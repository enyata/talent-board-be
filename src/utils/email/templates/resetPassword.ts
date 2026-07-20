import config from "config";
import { emailButton } from "../components/button";
import { baseEmailLayout } from "../layouts/baseLayout";
import type { EmailTemplatePayload, ResetPasswordTemplateData } from "../types";

const appName = config.get<string>("APP_NAME") || "Talentboard";
const supportEmail = config.get<string>("EMAIL_FROM");

const toPlainText = (value: string) => value.replace(/\s+/g, " ").trim();

export const resetPasswordEmailTemplate = (
  data: ResetPasswordTemplateData,
): EmailTemplatePayload => {
  const subject = "Reset your password";
  const greeting = `Hi ${data.firstName},`;
  const expiresInMinutes = data.expiresInMinutes ?? 30;

  const contentHtml = `
    <p style="margin:0 0 12px 0;font-family:Arial,sans-serif;font-size:22px;line-height:30px;font-weight:700;color:#0f172a;">Reset your password.</p>
    <p style="margin:0 0 12px 0;font-family:Arial,sans-serif;font-size:15px;line-height:24px;color:#334155;">
      <strong>${greeting} we got a request to reset the password for ${data.email}. Tap the button below to choose a new one.</strong>
    </p>
    ${emailButton({
      text: "Reset Password",
      url: data.resetPasswordUrl,
      backgroundColor: "#1d4ed8",
      borderRadius: 10,
      fullWidth: true,
    })}
    <p style="margin:0 0 8px 0;font-family:Arial,sans-serif;font-size:14px;line-height:22px;color:#475569;">
      <strong>Or paste this link into your browser:</strong>
    </p>
    <p style="margin:0 0 12px 0;font-family:Arial,sans-serif;font-size:13px;line-height:21px;color:#1d4ed8;word-break:break-all;">
      <a href="${data.resetPasswordUrl}" target="_blank" style="color:#1d4ed8;text-decoration:underline;">${data.resetPasswordUrl}</a>
    </p>
    <p style="margin:0 0 4px 0;font-family:Arial,sans-serif;font-size:14px;line-height:22px;color:#64748b;">
      For your security, this link expires in <strong>${expiresInMinutes} minutes</strong> and can only be used once.
    </p>
    <p style="margin:0;font-family:Arial,sans-serif;font-size:14px;line-height:22px;color:#64748b;">
      <strong>Didn't request this?</strong> No action needed - your password stays the same. If you keep seeing these emails, let us know at <a href="mailto:${supportEmail}" style="color:#1d4ed8;text-decoration:none;">${supportEmail}</a>
    </p>
  `;

  const html = baseEmailLayout({
    appName,
    supportEmail,
    preheader: "Reset your TalentBoard password.",
    contentHtml,
    footerProps: {
      closingLine: undefined,
      teamLabel: "",
      copyrightLabel: "Talentboard 2026",
      helpLabel: "Need a hand?",
      helpUrl: "http://help.talentboard.ng",
      supportEmail: undefined,
    },
  });

  return {
    subject,
    html,
    text: toPlainText(`
      Reset your password.
      ${greeting} we got a request to reset the password for ${data.email}. Tap the button below to choose a new one.
      Reset Password: ${data.resetPasswordUrl}
      Or paste this link into your browser: ${data.resetPasswordUrl}
      For your security, this link expires in ${expiresInMinutes} minutes and can only be used once.
      Didn't request this? No action needed - your password stays the same. If you keep seeing these emails, let us know at ${supportEmail}
      Need a hand? help.talentboard.ng
    `),
  };
};
