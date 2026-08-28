import type { HeaderProps } from "../types";

export const emailHeader = ({ appName, logoUrl }: HeaderProps): string => {
  const brandLabel = logoUrl
    ? `<img src="${logoUrl}" width="132" alt="${appName}" style="display:block;border:0;outline:none;text-decoration:none;max-width:132px;height:auto;" />`
    : `<span style="font-size:22px;line-height:28px;font-weight:700;color:#f8fafc;letter-spacing:0.2px;">${appName}</span>`;

  return `
    <tr>
      <td style="background:#0f172a;padding:24px 32px;border-radius:16px 16px 0 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="left">${brandLabel}</td>
          </tr>
        </table>
      </td>
    </tr>
  `;
};
