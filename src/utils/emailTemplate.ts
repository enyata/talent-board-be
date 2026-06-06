import config from "config";

export interface EmailTemplatePayload {
  subject: string;
  text: string;
  html: string;
}

export const verificationEmailTemplate = (
  otp: string,
  minutes = 10,
): EmailTemplatePayload => {
  const appName = config.get<string>("APP_NAME") || "Talent Board";
  const subject = `Verify your email for ${appName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <p>Hi,</p>
      <p>Use the code below to verify your email address for ${appName}.</p>
      <div style="background: #f5f7fb; padding: 16px; border-radius: 8px; display: inline-block;">
        <h2 style="margin: 0; letter-spacing: 0.12em;">${otp}</h2>
      </div>
      <p style="margin-top: 16px;">This code expires in ${minutes} minutes.</p>
      <p>If you did not request this, please ignore this message.</p>
    </div>
  `;

  return {
    subject,
    text: `Verify your email for ${appName}\n\nYour code is: ${otp}\n\nThis code expires in ${minutes} minutes.\n\nIf you did not request this, please ignore this message.`,
    html,
  };
};
