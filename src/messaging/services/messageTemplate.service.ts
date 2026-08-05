import AppDataSource from "@src/datasource";
import { UserEntity, UserRole } from "@src/entities/user.entity";
import {
  MessageTemplateLibrarySummary,
  MessageTemplateSummary,
} from "@src/interfaces";
import { ListMessageTemplatesDto } from "../schemas/template.schema";

const TEMPLATE_TOKEN_REGEX = /{{\s*([a-zA-Z0-9_]+)\s*}}/g;

export const RECRUITER_TEMPLATE_IDS = {
  INTRO_OUTREACH: "recruiter-intro-outreach",
  SCHEDULE_INTERVIEW: "recruiter-schedule-interview",
  AVAILABILITY_CHECK: "recruiter-availability-check",
} as const;

export const TALENT_TEMPLATE_IDS = {
  EXPRESS_INTEREST: "talent-express-interest",
  FOLLOW_UP: "talent-follow-up",
  SHARE_PORTFOLIO: "talent-share-portfolio",
} as const;

const RECRUITER_MESSAGE_TEMPLATES: MessageTemplateSummary[] = [
  {
    id: RECRUITER_TEMPLATE_IDS.INTRO_OUTREACH,
    title: "Intro Outreach",
    body: "Hi {{first_name}}, your background caught my eye. Would you be open to a quick chat about a role I'm working on?",
    use_cases: ["intro_note"],
  },
  {
    id: RECRUITER_TEMPLATE_IDS.SCHEDULE_INTERVIEW,
    title: "Schedule an Interview",
    body: "Hi {{first_name}}, I'd love to schedule an interview to discuss a role that aligns with your experience. Are you available this week for a 30-minute call?",
    use_cases: ["intro_note", "active_message_compose"],
  },
  {
    id: RECRUITER_TEMPLATE_IDS.AVAILABILITY_CHECK,
    title: "Ask About Availability",
    body: "Hi {{first_name}}, I'm reaching out to check your availability for an upcoming project. Would you be open to sharing your current schedule and earliest start date?",
    use_cases: ["active_message_compose"],
  },
];

const TALENT_MESSAGE_TEMPLATES: MessageTemplateSummary[] = [
  {
    id: TALENT_TEMPLATE_IDS.EXPRESS_INTEREST,
    title: "Express Interest",
    body: "Hi {{first_name}}, I came across your job posting and I'm very interested. My experience aligns well with what you're looking for. I'd love to connect!",
    use_cases: ["active_message_compose"],
  },
  {
    id: TALENT_TEMPLATE_IDS.FOLLOW_UP,
    title: "Follow up",
    body: "Hi {{first_name}}, I wanted to follow up on my earlier application. I'm still very interested in the role and would love to hear if there are any updates on the hiring process.",
    use_cases: ["active_message_compose"],
  },
  {
    id: TALENT_TEMPLATE_IDS.SHARE_PORTFOLIO,
    title: "Share Portfolio",
    body: "Hi {{first_name}}, I'd like to share my portfolio with you showcasing relevant work I've done in this space. Here's a link to my latest projects: [portfolio link]. Let me know if you'd like to discuss further!",
    use_cases: ["active_message_compose"],
  },
];

export class MessageTemplateService {
  private readonly userRepo = AppDataSource.getRepository(UserEntity);

  async getTemplates(
    role: UserRole,
    query: ListMessageTemplatesDto,
  ): Promise<MessageTemplateLibrarySummary> {
    const roleTemplates =
      role === UserRole.TALENT
        ? TALENT_MESSAGE_TEMPLATES
        : RECRUITER_MESSAGE_TEMPLATES;

    const target = await this.userRepo.findOne({
      where: { id: query.target_user_id },
    });

    const dynamicFields = this.buildDynamicFields(target);

    const hydratedTemplates = roleTemplates.map((template) =>
      this.hydrateTemplate(template, dynamicFields),
    );

    if (query.use_case === "intro_note") {
      return {
        templates: hydratedTemplates.filter((template) =>
          template.use_cases.includes("intro_note"),
        ),
      };
    }

    if (query.use_case === "active_message_compose") {
      return {
        templates: hydratedTemplates.filter((template) =>
          template.use_cases.includes("active_message_compose"),
        ),
      };
    }

    return { templates: hydratedTemplates };
  }

  private buildDynamicFields(
    target: UserEntity | null,
  ): Record<string, string> {
    return {
      first_name: this.resolveRecipientDisplayName(target),
    };
  }

  private resolveRecipientDisplayName(target: UserEntity | null): string {
    const firstName = target?.first_name?.trim();
    const lastName = target?.last_name?.trim();

    if (firstName) {
      return `${firstName}`;
    }

    if (firstName || lastName) {
      return firstName || lastName || "there";
    }

    if (target?.role) {
      return target.role === UserRole.RECRUITER ? "Recruiter" : "Talent";
    }

    return "there";
  }

  private hydrateTemplate(
    template: MessageTemplateSummary,
    dynamicFields: Record<string, string>,
  ): MessageTemplateSummary {
    const body = template.body.replace(TEMPLATE_TOKEN_REGEX, (_, token) => {
      const value = dynamicFields[token];
      return typeof value === "string" ? value : `{{${token}}}`;
    });

    return {
      ...template,
      body,
    };
  }
}
