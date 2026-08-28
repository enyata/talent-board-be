import type { FooterProps } from "../types";

export const emailFooter = ({
  teamLabel = "The Enyata Talentboard team",
  closingLine,
  showCopyright = true,
  copyrightLabel = "Talentboard 2026",
  helpLabel = "Questions? Reply to this email or visit",
  helpUrl = "http://help.talentboard.ng",
  supportEmail,
}: FooterProps): string => {
  const helpLinkLabel = helpUrl.replace(/^https?:\/\//i, "");
  const fallbackSupportEmail = "community@enyata.com";

  const helpText = supportEmail
    ? `${helpLabel} <a href="mailto:${supportEmail}" style="color:#1d4ed8;text-decoration:none;">${supportEmail}</a>.`
    : `${helpLabel} <a href="${helpUrl}" target="_blank" style="color:#1d4ed8;text-decoration:none;">${helpLinkLabel}</a>`;

  return `
    ${
      closingLine
        ? `<p style="margin:0 0 12px 0;font-family:Arial,sans-serif;font-size:15px;line-height:23px;color:#1e293b;">
      ${closingLine}<br />
      <strong>${teamLabel}</strong>
    </p>`
        : ""
    }
    ${
      showCopyright
        ? `<p style="margin:0 0 16px 0;font-family:Arial,sans-serif;font-size:13px;line-height:20px;color:#64748b;">
      &copy; ${copyrightLabel}
    </p>`
        : ""
    }
    <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;line-height:20px;color:#64748b;">
      ${helpText || `Questions? Reply to this email or contact <a href="mailto:${fallbackSupportEmail}" style="color:#1d4ed8;text-decoration:none;">${fallbackSupportEmail}</a>.`}
    </p>
  `;
};
