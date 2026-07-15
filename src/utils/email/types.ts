export interface EmailTemplatePayload {
  subject: string;
  text: string;
  html: string;
}

export interface HeaderProps {
  appName: string;
  logoUrl?: string;
}

export interface ButtonProps {
  text: string;
  url: string;
  backgroundColor?: string;
  borderRadius?: number;
  fullWidth?: boolean;
}

export interface FooterProps {
  teamLabel?: string;
  closingLine?: string;
  showCopyright?: boolean;
  copyrightLabel?: string;
  helpLabel?: string;
  helpUrl?: string;
  supportEmail?: string;
}

export interface BaseLayoutProps {
  appName: string;
  supportEmail: string;
  contentHtml: string;
  preheader?: string;
  logoUrl?: string;
  footerProps?: FooterProps;
}

export type UserAudience = "talent" | "recruiter";

export interface WelcomeTemplateData {
  firstName: string;
  getStartedUrl: string;
  audience: UserAudience;
}

export interface VerifyEmailTemplateData {
  firstName?: string;
  otp: string;
  expiresInMinutes?: number;
}

export interface IncompleteSignupTemplateData {
  firstName: string;
  completeSignupUrl: string;
  audience: UserAudience;
}

export interface ResetPasswordTemplateData {
  firstName: string;
  email: string;
  resetPasswordUrl: string;
  expiresInMinutes?: number;
}

export interface SendEmailInput {
  to: string;
  template: EmailTemplatePayload;
  from?: string;
  replyTo?: string;
}
