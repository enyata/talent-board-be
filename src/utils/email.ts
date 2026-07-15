import {
  incompleteSignupEmailTemplate,
  resetPasswordEmailTemplate,
  sendEmail,
  type UserAudience,
  verifyEmailTemplate,
  welcomeEmail,
} from "./email/index";

export const EmailService = {
  async sendVerification(to: string, otp: string, ttlMinutes?: number) {
    const template = verifyEmailTemplate({
      otp,
      expiresInMinutes: ttlMinutes,
    });
    return sendEmail({
      to,
      template,
      from: "Enyata Talentboard <hello@talentboard.ng>",
    });
  },

  async sendPasswordReset(to: string, resetLink: string, ttlMinutes?: number) {
    const template = resetPasswordEmailTemplate({
      firstName: "there",
      email: to,
      resetPasswordUrl: resetLink,
      expiresInMinutes: ttlMinutes,
    });
    return sendEmail({
      to,
      template,
      from: "Enyata Talentboard <hello@talentboard.ng>",
    });
  },

  async sendWelcome(
    to: string,
    getStartedUrl: string,
    firstName: string,
    audience: UserAudience = "talent",
  ) {
    const template = welcomeEmail({ firstName, getStartedUrl, audience });
    return sendEmail({
      to,
      template,
      from: "Enyata Talentboard <hello@talentboard.ng>",
    });
  },

  async sendIncompleteSignup(
    to: string,
    completeSignupUrl: string,
    firstName: string,
    audience: UserAudience = "talent",
  ) {
    const template = incompleteSignupEmailTemplate({
      firstName,
      completeSignupUrl,
      audience,
    });
    return sendEmail({
      to,
      template,
      from: "Enyata Talentboard <hello@talentboard.ng>",
    });
  },
};
