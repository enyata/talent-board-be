import type { ButtonProps } from "../types";

export const emailButton = ({
  text,
  url,
  backgroundColor = "#1d4ed8",
  borderRadius = 10,
  fullWidth = true,
}: ButtonProps): string => {
  const buttonWidth = fullWidth ? "100%" : "auto";

  return `
    <table role="presentation" width="${buttonWidth}" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
      <tr>
        <td align="center" bgcolor="${backgroundColor}" style="border-radius:${borderRadius}px;">
          <a
            href="${url}"
            target="_blank"
            style="display:block;padding:14px 24px;font-family:Arial,sans-serif;font-size:16px;line-height:20px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:${borderRadius}px;"
          >
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
};
