import config from "config";
import { createTransport } from "nodemailer";
import { verificationEmailTemplate } from "./emailTemplate";
import log from "./logger";

const getEmailProvider = () =>
  config.get<string>("EMAIL_PROVIDER")?.toLowerCase() || "smtp";

const getSmtpConfig = () => {
  const provider = getEmailProvider();
  const host = config.get<string>("SMTP_HOST");
  const port = Number(config.get<string>("SMTP_PORT") || 587);
  const secure =
    String(config.get<string>("SMTP_SECURE")).toLowerCase() === "true";

  if (provider === "gmail") {
    const user = config.get<string>("GMAIL_USER");
    const pass = config.get<string>("GMAIL_PASSWORD");

    return {
      service: "gmail",
      auth: { user, pass },
    };
  }

  return {
    host,
    port,
    secure,
    auth: {
      user: config.get<string>("SMTP_USER"),
      pass: config.get<string>("SMTP_PASSWORD"),
    },
  };
};

export const EmailService = {
  async sendVerification(to: string, otp: string) {
    const template = verificationEmailTemplate(otp);
    const mailOptions = {
      from: config.get<string>("EMAIL_FROM"),
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    };
    const transportConfig = getSmtpConfig();

    const transporter = createTransport(transportConfig);

    const info = await transporter.sendMail(mailOptions);
    log.info(
      {
        to,
        messageId: info.messageId,
        provider: getEmailProvider(),
      },
      "Email OTP sent",
    );

    return info;
  },
};
