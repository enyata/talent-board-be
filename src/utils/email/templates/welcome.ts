import config from "config";
import { emailButton } from "../components/button";
import { baseEmailLayout } from "../layouts/baseLayout";
import type { EmailTemplatePayload, WelcomeTemplateData } from "../types";

const appName = config.get<string>("APP_NAME") || "Talentboard";
const supportEmail = config.get<string>("EMAIL_FROM");

const toPlainText = (value: string) => value.replace(/\s+/g, " ").trim();

export const welcomeEmail = (
  data: WelcomeTemplateData,
): EmailTemplatePayload => {
  const subject = `Welcome to Talentboard, ${data.firstName}`;
  const heading = `Welcome to Enyata Talentboard, ${data.firstName}.`;

  const bodyByAudience = {
    talent: {
      lead: "Job searching can get busy. Talentboard helps you stay organized by keeping your opportunities, follow-ups, and notes together in one clear workspace.",
      detail:
        "We've prepared your board so you can jump in and start tracking opportunities right away. Keep your applications, conversations, and next steps in one place so you always know what to do next.",
    },
    recruiter: {
      lead: "Hiring can get busy. Talentboard helps you stay organized by keeping your roles, candidates, and hiring progress in one clear workspace.",
      detail:
        "We've prepared your workspace so you can start managing openings and tracking candidates right away. Keep everything organized in one place, from applications and interviews to notes and follow-ups.",
    },
  } as const;

  const selectedBody = bodyByAudience[data.audience];

  const contentHtml = `
    <p style="margin:0 0 12px 0;font-family:Arial,sans-serif;font-size:22px;line-height:30px;font-weight:700;color:#0f172a;">${heading}</p>
    <p style="margin:0 0 12px 0;font-family:Arial,sans-serif;font-size:15px;line-height:24px;color:#334155;">
      ${selectedBody.lead}
    </p>
    <p style="margin:0 0 8px 0;font-family:Arial,sans-serif;font-size:15px;line-height:24px;color:#334155;">
      ${selectedBody.detail}
    </p>
    ${emailButton({
      text: "Get Started",
      url: data.getStartedUrl,
      backgroundColor: "#0f766e",
      borderRadius: 10,
      fullWidth: true,
    })}
  `;

  const html = baseEmailLayout({
    appName,
    supportEmail,
    preheader: `Welcome to Enyata Talentboard, ${data.firstName}.`,
    contentHtml,
    footerProps: {
      closingLine: "Warmly,",
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
      ${heading}
      ${selectedBody.lead}
      ${selectedBody.detail}
      Get Started: ${data.getStartedUrl}
      Warmly,
      The Enyata Talentboard team
      Copyright Talentboard 2026
      Questions? Reply to this email or visit help.talentboard.ng
    `),
  };
};
