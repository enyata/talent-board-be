import config from "config";
import { createTransport } from "nodemailer";
import log from "../logger";
import type { SendEmailInput } from "./types";

const getEmailProvider = () =>
  config.get<string>("EMAIL_PROVIDER")?.toLowerCase() || "smtp";

const getSmtpConfig = () => {
  const provider = getEmailProvider();

  if (provider === "gmail") {
    return {
      service: "gmail",
      auth: {
        user: config.get<string>("GMAIL_USER"),
        pass: config.get<string>("GMAIL_PASSWORD"),
      },
    };
  }

  const host = config.get<string>("SMTP_HOST");
  const port = config.get<number>("SMTP_PORT") || 587;
  const secure = config.get<boolean>("SMTP_SECURE");

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

export const sendEmail = async ({
  to,
  template,
  from,
  replyTo,
}: SendEmailInput) => {
  const transportConfig = getSmtpConfig();
  const transporter = createTransport(transportConfig);

  const mailOptions = {
    from:
      from ||
      config.get<string>("EMAIL_FROM") ||
      "Enyata Talentboard <hello@talentboard.ng>",
    to,
    subject: template.subject,
    text: template.text,
    html: template.html,
    replyTo,
  };

  const auth = (transportConfig as { auth?: { user?: string; pass?: string } })
    .auth;
  const isLocalDev =
    config.get<string>("NODE_ENV") === "development" &&
    (transportConfig as { host?: string }).host === "maildev";

  if (!isLocalDev && (!auth?.user || !auth?.pass)) {
    const error = new Error(
      `Email provider (${getEmailProvider()}) is missing credentials. Check your .env file.`,
    );
    log.error({ provider: getEmailProvider() }, error.message);
    throw error;
  }

  try {
    await transporter.verify();
    const info = await transporter.sendMail(mailOptions);
    log.info(
      { to, messageId: info.messageId, provider: getEmailProvider() },
      "Transactional email sent successfully",
    );
    return info;
  } catch (error) {
    log.error(
      { err: error, to, provider: getEmailProvider() },
      "Failed to send transactional email",
    );
    throw error;
  }
};
