import { NotificationService } from "@src/dashboard/services/notification.service";
import { ConversationThreadEntity } from "@src/entities/conversationThread.entity";
import { MessageRequestEntity } from "@src/entities/messageRequest.entity";
import { NotificationType } from "@src/entities/notification.entity";
import { UserEntity } from "@src/entities/user.entity";
import { sendEmail } from "@src/utils/email/sendEmail";
import { EmailTemplatePayload } from "@src/utils/email/types";
import log from "@src/utils/logger";
import config from "config";

export class MessagingEngagementService {
  private readonly notificationService = new NotificationService();

  async onMessageRequestCreated(request: MessageRequestEntity): Promise<void> {
    const senderName = this.getDisplayName(request.recruiter);

    await Promise.all([
      this.sendNotificationSafe(
        request.recruiter.id,
        request.talent.id,
        `${senderName} sent you a message request`,
      ),
      this.sendEmailSafe(
        request.talent.email,
        this.buildEmailTemplate({
          subject: `New message request from ${senderName}`,
          heading: `You received a message request from ${senderName}.`,
          primaryCopy: "Review the request and respond when you are ready.",
          secondaryCopy:
            "You can accept to start a conversation or decline if it is not a fit right now.",
        }),
      ),
    ]);
  }

  async onMessageRequestAccepted(request: MessageRequestEntity): Promise<void> {
    const senderName = this.getDisplayName(request.talent);

    await Promise.all([
      this.sendNotificationSafe(
        request.talent.id,
        request.recruiter.id,
        `${senderName} accepted your message request`,
      ),
      this.sendEmailSafe(
        request.recruiter.email,
        this.buildEmailTemplate({
          subject: `${senderName} accepted your message request`,
          heading: `${senderName} accepted your request.`,
          primaryCopy: "Your conversation is now active.",
          secondaryCopy: "Open your inbox to continue the conversation.",
        }),
      ),
    ]);
  }

  async onMessageRequestDeclined(request: MessageRequestEntity): Promise<void> {
    const senderName = this.getDisplayName(request.talent);

    await Promise.all([
      this.sendNotificationSafe(
        request.talent.id,
        request.recruiter.id,
        `${senderName} declined your message request`,
      ),
      this.sendEmailSafe(
        request.recruiter.email,
        this.buildEmailTemplate({
          subject: `${senderName} declined your message request`,
          heading: `${senderName} declined your request.`,
          primaryCopy: "This request has been closed.",
          secondaryCopy:
            "You can still discover and contact other talents from your dashboard.",
        }),
      ),
    ]);
  }

  async onMessageSent(params: {
    thread: ConversationThreadEntity;
    sender: UserEntity;
    body: string;
  }): Promise<void> {
    const { thread, sender, body } = params;
    const recipient =
      thread.recruiter.id === sender.id ? thread.talent : thread.recruiter;
    const senderName = this.getDisplayName(sender);

    await Promise.all([
      this.sendNotificationSafe(
        sender.id,
        recipient.id,
        `New message from ${senderName}`,
      ),
      this.sendEmailSafe(
        recipient.email,
        this.buildEmailTemplate({
          subject: `New message from ${senderName}`,
          heading: `${senderName} sent you a new message.`,
          primaryCopy: this.truncateMessage(body),
          secondaryCopy:
            "Reply from your inbox to keep the conversation moving.",
        }),
      ),
    ]);
  }

  private async sendNotificationSafe(
    senderId: string,
    recipientId: string,
    message: string,
  ): Promise<void> {
    await this.safeRun(async () => {
      await this.notificationService.sendNotification(
        NotificationType.MESSAGE,
        senderId,
        recipientId,
        message,
      );
    }, "messaging notification");
  }

  private async sendEmailSafe(
    to: string,
    template: EmailTemplatePayload,
  ): Promise<void> {
    if (!to) {
      return;
    }

    await this.safeRun(async () => {
      await sendEmail({ to, template });
    }, "messaging email");
  }

  private async safeRun(task: () => Promise<void>, label: string) {
    try {
      await task();
    } catch (error) {
      log.error(
        { err: error, label },
        "Messaging engagement side-effect failed",
      );
    }
  }

  private buildEmailTemplate(input: {
    subject: string;
    heading: string;
    primaryCopy: string;
    secondaryCopy: string;
  }): EmailTemplatePayload {
    const inboxUrl = this.getMessagesUrl();

    return {
      subject: input.subject,
      html: `
        <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5;">
          <p style="margin:0 0 12px 0;font-size:20px;font-weight:700;">${input.heading}</p>
          <p style="margin:0 0 12px 0;font-size:14px;color:#334155;">${input.primaryCopy}</p>
          <p style="margin:0 0 16px 0;font-size:14px;color:#334155;">${input.secondaryCopy}</p>
          <a href="${inboxUrl}" style="display:inline-block;padding:10px 16px;background:#0f766e;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">Open messages</a>
        </div>
      `,
      text: `${input.heading}\n\n${input.primaryCopy}\n${input.secondaryCopy}\n\nOpen messages: ${inboxUrl}`,
    };
  }

  private truncateMessage(message: string): string {
    const trimmed = message.trim();
    if (trimmed.length <= 180) {
      return trimmed;
    }

    return `${trimmed.slice(0, 177)}...`;
  }

  private getDisplayName(user: UserEntity): string {
    const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    return fullName || user.email;
  }

  private getMessagesUrl(): string {
    const frontendUrl =
      config.get<string>("FRONTEND_URL") || "http://localhost:3000";
    return `${frontendUrl.replace(/\/$/, "")}/messages`;
  }
}
