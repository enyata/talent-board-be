import {
  resetPasswordEmailTemplate,
  verifyEmailTemplate,
  type EmailTemplatePayload,
} from "./email/index";

export type { EmailTemplatePayload };

// Backward-compatible wrappers for existing imports.
export const verificationEmailTemplate = (
  otp: string,
  minutes = 10,
): EmailTemplatePayload => {
  return verifyEmailTemplate({ otp, expiresInMinutes: minutes });
};

// Backward-compatible wrappers for existing imports.
export const passwordResetEmailTemplate = (
  resetLink: string,
  minutes = 30,
): EmailTemplatePayload => {
  return resetPasswordEmailTemplate({
    firstName: "there",
    email: "sample@gmail.com",
    resetPasswordUrl: resetLink,
    expiresInMinutes: minutes,
  });
};
