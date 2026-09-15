import config from "config";
import { baseEmailLayout } from "../layouts/baseLayout";
import type { EmailTemplatePayload, VerifyEmailTemplateData } from "../types";

const appName = config.get<string>("APP_NAME") || "Talentboard";
const supportEmail = config.get<string>("EMAIL_FROM");

const toPlainText = (value: string) => value.replace(/\s+/g, " ").trim();

export const verifyEmailTemplate = (
  data: VerifyEmailTemplateData,
): EmailTemplatePayload => {
  const spacedOtp = data.otp.split("").join(" ");
  const subject = `Your verification code - ${spacedOtp}`;
  const greeting = data.firstName ? `Hi ${data.firstName},` : "Hi there,";
  const expiresInMinutes = data.expiresInMinutes ?? 10;

  const contentHtml = `
    <p style="margin:0 0 12px 0;font-family:Arial,sans-serif;font-size:22px;line-height:30px;font-weight:700;color:#0f172a;">Verify your email.</p>
    <p style="margin:0 0 12px 0;font-family:Arial,sans-serif;font-size:16px;line-height:24px;color:#0f172a;">${greeting}</p>
    <p style="margin:0 0 14px 0;font-family:Arial,sans-serif;font-size:15px;line-height:24px;color:#334155;">
      Use the code below to confirm your email address. Enter it on the verification screen to finish setting up your Talentboard account.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:12px 0 14px 0;">
      <tr>
        <td align="center" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:18px;">
          <span style="display:block;font-family:Arial,sans-serif;font-size:34px;line-height:40px;letter-spacing:8px;font-weight:700;color:#1e3a8a;">${spacedOtp}</span>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 10px 0;font-family:Arial,sans-serif;font-size:14px;line-height:22px;color:#334155;">
      This code expires in <strong>${expiresInMinutes} minutes.</strong>
    </p>
    <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;line-height:22px;color:#64748b;">
      <strong>Didn't request this?</strong> You can safely ignore this email. If you didn't initiate this action, someone may have entered your email address by mistake. Your account remains secure.
    </p>
  `;

  const html = baseEmailLayout({
    appName,
    supportEmail,
    preheader: "Verify your email address with your one-time code.",
    contentHtml,
    footerProps: {
      closingLine: undefined,
      teamLabel: "",
      copyrightLabel: "Talentboard 2026",
      helpLabel: "Need a hand?",
      helpUrl: "community@enyata.com",
      supportEmail: undefined,
    },
  });

  return {
    subject,
    html,
    text: toPlainText(`
      ${greeting}
      Verify your email.
      Use the code below to confirm your email address. Enter it on the verification screen to finish setting up your Talentboard account.
      ${spacedOtp}
      This code expires in ${expiresInMinutes} minutes.
      Didn't request this? You can safely ignore this email. If you didn't initiate this action, someone may have entered your email address by mistake. Your account remains secure.
      Need a hand? contact us at ${supportEmail}
    `),
  };
};
