import { emailDivider } from "../components/divider";
import { emailFooter } from "../components/footer";
import { emailHeader } from "../components/header";
import type { BaseLayoutProps } from "../types";

export const baseEmailLayout = ({
  appName,
  supportEmail,
  contentHtml,
  preheader = "",
  logoUrl,
  footerProps,
}: BaseLayoutProps): string => {
  return `
<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${appName}</title>
    <style>
      @media only screen and (max-width: 620px) {
        .tb-shell {
          width: 100% !important;
        }
        .tb-content,
        .tb-header-cell {
          padding-left: 20px !important;
          padding-right: 20px !important;
        }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#f1f5f9;word-spacing:normal;">
    <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">${preheader}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f1f5f9;">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="tb-shell" style="width:600px;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
            ${emailHeader({ appName, logoUrl })}
            <tr>
              <td class="tb-content" style="padding:30px 32px 28px 32px;">
                ${contentHtml}
                ${emailDivider()}
                ${emailFooter({ supportEmail, ...footerProps })}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
};
