import config from "config";
import { emailButton } from "../components/button";
import { baseEmailLayout } from "../layouts/baseLayout";
import type {
  EmailTemplatePayload,
  IncompleteSignupTemplateData,
} from "../types";

const appName = config.get<string>("APP_NAME") || "Talentboard";
const supportEmail = config.get<string>("EMAIL_FROM");

const toPlainText = (value: string) => value.replace(/\s+/g, " ").trim();

export const incompleteSignupEmailTemplate = (
  data: IncompleteSignupTemplateData,
): EmailTemplatePayload => {
  const subject = "You're almost in — finish setting up Talentboard";

  const bodyByAudience = {
    talent:
      "Your Talentboard account is almost ready. Complete your setup to start tracking opportunities, manage follow-ups, and keep important notes in one place. We've saved your progress, so you can continue where you left off without starting over.",
    recruiter:
      "Your Talentboard workspace is almost ready. Complete your setup to start managing job openings, tracking candidates, and organizing your hiring process in one place. We've saved your progress, so you can continue where you left off without starting over.",
  } as const;

  const selectedBody = bodyByAudience[data.audience];

  const contentHtml = `
    <p style="margin:0 0 12px 0;font-family:Arial,sans-serif;font-size:22px;line-height:30px;font-weight:700;color:#0f172a;">Finish creating your account.</p>
    <p style="margin:0 0 12px 0;font-family:Arial,sans-serif;font-size:16px;line-height:24px;color:#0f172a;">Hi ${data.firstName},</p>
    <p style="margin:0 0 12px 0;font-family:Arial,sans-serif;font-size:15px;line-height:24px;color:#334155;">
      ${selectedBody}
    </p>
    ${emailButton({
      text: "Continue Setup",
      url: data.completeSignupUrl,
      backgroundColor: "#0f766e",
      borderRadius: 10,
      fullWidth: true,
    })}
    <p style="margin:2px 0 0 0;font-family:Arial,sans-serif;font-size:14px;line-height:22px;color:#64748b;">
      If you didn't initiate this signup, you can safely ignore this email.
    </p>
  `;

  const html = baseEmailLayout({
    appName,
    supportEmail,
    preheader: "Your signup is almost complete.",
    contentHtml,
    footerProps: {
      closingLine: "See you soon,",
      teamLabel: "The Enyata Talentboard team",
      copyrightLabel: "Talentboard 2026",
      helpLabel: "Questions? Reply to this email or visit",
      helpUrl: "http://help.talentboard.ng",
      supportEmail: undefined,
    },
  });

  return {
    subject,
    html,
    text: toPlainText(`
      Finish creating your account.
      Hi ${data.firstName},
      ${selectedBody}
      Continue Setup: ${data.completeSignupUrl}
      If you didn't initiate this signup, you can safely ignore this email.
      See you soon,
      The Enyata Talentboard team
      Copyright Talentboard 2026
      Questions? Reply to this email or visit help.talentboard.ng
    `),
  };
};
