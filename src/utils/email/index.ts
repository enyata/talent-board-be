import { incompleteSignupEmailTemplate } from "./templates/incompleteSignup";
import { resetPasswordEmailTemplate } from "./templates/resetPassword";
import { verifyEmailTemplate } from "./templates/verifyEmail";
import { welcomeEmail } from "./templates/welcome";

export { sendEmail } from "./sendEmail";

export {
  incompleteSignupEmailTemplate,
  resetPasswordEmailTemplate,
  verifyEmailTemplate,
  welcomeEmail,
};

export type {
  EmailTemplatePayload,
  IncompleteSignupTemplateData,
  ResetPasswordTemplateData,
  SendEmailInput,
  UserAudience,
  VerifyEmailTemplateData,
  WelcomeTemplateData,
} from "./types";
