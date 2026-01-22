import { createTransport } from "nodemailer";

// Inline SVG logo for Socially
const logoSVG = `<svg width="133" height="30" viewBox="0 0 133 30" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="9.91667" cy="15" rx="9.91667" ry="10" fill="#4361EE"/><ellipse cx="28.3332" cy="15" rx="5.66667" ry="5.71429" fill="#899DFC"/><path d="M45.0145 16.3838L47.5255 15.5468C47.7623 16.5445 48.2273 17.3561 48.9205 17.9817C49.6307 18.5905 50.3832 18.9371 51.1779 19.0216C52.2432 19.1231 53.1225 18.9286 53.8157 18.4383C54.5259 17.931 54.9148 17.2208 54.9825 16.3077C55.0501 15.3439 54.6443 14.5661 53.765 13.9743C52.9026 13.3825 51.4823 12.7653 49.5039 12.1227C48.3034 11.7338 47.348 11.0828 46.6378 10.1697C45.9276 9.25664 45.6064 8.25054 45.674 7.15145C45.7247 6.10309 46.1052 5.15618 46.8154 4.31073C47.5255 3.46527 48.5232 2.89882 49.8083 2.61136C51.2963 2.27318 52.7082 2.37464 54.044 2.91573C55.3798 3.45682 56.3944 4.50518 57.0876 6.06082L54.7288 7.17682C54.4075 6.43282 53.9679 5.86636 53.4099 5.47745C52.8688 5.07164 52.3024 4.86873 51.7105 4.86873C51.1356 4.86873 50.5523 4.97864 49.9605 5.19845C49.2165 5.51973 48.7345 5.934 48.5147 6.44127C48.3118 6.94855 48.278 7.45582 48.4133 7.96309C48.5485 8.41964 48.8698 8.83391 49.3771 9.20591C49.9013 9.561 50.4677 9.83154 51.0765 10.0175C52.277 10.4572 53.2155 10.8376 53.8918 11.1589C54.5851 11.4802 55.2445 11.8775 55.8702 12.351C56.5127 12.8245 56.9693 13.3655 57.2398 13.9743C57.5104 14.5661 57.6541 15.2763 57.671 16.1048C57.7048 17.7281 57.1891 19.0132 56.1238 19.9601C55.0755 20.8901 53.6805 21.3974 51.9388 21.4819C50.2141 21.5665 48.7007 21.1522 47.3987 20.2391C46.0967 19.326 45.302 18.0409 45.0145 16.3838ZM61.6303 19.5543C60.3452 18.2185 59.7027 16.629 59.7027 14.7859C59.7027 12.9428 60.3452 11.3787 61.6303 10.0936C62.9154 8.80854 64.4964 8.166 66.3733 8.166C68.2333 8.166 69.8058 8.80854 71.0909 10.0936C72.376 11.3787 73.0186 12.9428 73.0186 14.7859C73.0186 16.629 72.376 18.2185 71.0909 19.5543C69.8058 20.8901 68.2333 21.558 66.3733 21.558C64.4964 21.558 62.9154 20.8901 61.6303 19.5543ZM62.4166 14.8113C62.4166 16.0964 62.8055 17.1363 63.5833 17.931C64.378 18.7257 65.3165 19.1231 66.3987 19.1231C67.4808 19.1231 68.4108 18.7342 69.1887 17.9564C69.9665 17.1616 70.3554 16.1133 70.3554 14.8113C70.3554 13.5769 69.958 12.5624 69.1633 11.7676C68.3855 10.956 67.4639 10.5502 66.3987 10.5502C65.3334 10.5502 64.4034 10.956 63.6087 11.7676C62.8139 12.5624 62.4166 13.5769 62.4166 14.8113ZM80.1695 10.6516C79.2057 10.77 78.4194 11.235 77.8107 12.0466C77.202 12.8414 76.9061 13.7375 76.923 14.7352C76.9399 15.9188 77.2696 16.9249 77.9122 17.7535C78.5716 18.5651 79.3917 19.0132 80.3724 19.0977C81.2348 19.1654 82.0211 18.9878 82.7313 18.5651C83.4414 18.1424 83.9149 17.5759 84.1516 16.8657L86.5358 17.8042C86.0624 19.0724 85.2761 20.0362 84.177 20.6956C83.0948 21.3382 81.7928 21.6256 80.271 21.558C78.5801 21.4904 77.1597 20.814 76.0099 19.5289C74.877 18.2269 74.3105 16.6205 74.3105 14.7098C74.3105 12.8667 74.9108 11.3365 76.1114 10.119C77.3119 8.90154 78.7069 8.24209 80.2964 8.14064C81.8351 8.03918 83.1371 8.37736 84.2024 9.15518C85.2676 9.91609 86.0032 10.8545 86.409 11.9705L84.0502 12.8075C83.6105 11.8606 83.0272 11.2435 82.3001 10.956C81.5899 10.6516 80.8797 10.5502 80.1695 10.6516ZM91.4054 5.655C91.0672 5.99318 90.6445 6.16227 90.1372 6.16227C89.63 6.16227 89.1988 5.99318 88.8437 5.655C88.4886 5.31682 88.3111 4.89409 88.3111 4.38682C88.3111 3.87954 88.4886 3.45682 88.8437 3.11864C89.1988 2.78045 89.63 2.61136 90.1372 2.61136C90.6445 2.61136 91.0672 2.78045 91.4054 3.11864C91.7605 3.45682 91.9381 3.87954 91.9381 4.38682C91.9381 4.89409 91.7605 5.31682 91.4054 5.655ZM91.4562 8.49573V21.1775H88.793V8.49573H91.4562ZM99.1073 21.4312C97.8222 21.6172 96.6639 21.3635 95.6324 20.6703C94.6179 19.977 94.0599 19.047 93.9584 17.8803C93.8232 15.4792 95.1083 14.0335 97.8137 13.5431C99.4032 13.2556 100.942 13.2895 102.43 13.6445C102.565 13.0189 102.498 12.4186 102.227 11.8437C101.956 11.2519 101.424 10.8545 100.629 10.6516C99.7667 10.4318 98.972 10.4487 98.2449 10.7024C97.5347 10.9391 97.0021 11.4379 96.647 12.1988L94.3896 11.1082C94.8123 10.1951 95.5394 9.45109 96.5709 8.87618C97.2473 8.48727 98.0927 8.259 99.1073 8.19136C100.139 8.10682 101.103 8.22518 101.999 8.54645C102.963 8.90154 103.715 9.48491 104.256 10.2965C104.797 11.1082 105.076 11.9452 105.093 12.8075L105.169 21.1268L102.633 21.1015L102.531 19.4782C102.21 19.9178 101.745 20.3321 101.136 20.721C100.545 21.093 99.8682 21.3297 99.1073 21.4312ZM99.7921 19.2499C100.739 19.0301 101.466 18.5651 101.973 17.8549C102.481 17.1447 102.684 16.443 102.582 15.7497C101.889 15.6145 101.229 15.5299 100.604 15.4961C99.9781 15.4454 99.344 15.4538 98.7014 15.5215C98.0589 15.5891 97.5432 15.792 97.1543 16.1302C96.7823 16.4515 96.5963 16.8995 96.5963 17.4745C96.5963 18.1001 96.9175 18.6074 97.5601 18.9963C98.2026 19.3852 98.9466 19.4697 99.7921 19.2499ZM110.952 2.66209V21.1775H108.213V2.66209H110.952ZM116.723 2.66209V21.1775H113.984V2.66209H116.723ZM121.125 26.7322L124.016 20.5688L118.74 8.57182L121.632 8.59718L125.36 17.373L128.886 8.59718H131.777L123.94 26.7322H121.125Z" fill="black"/></svg>`;

const createEmailTemplate = (title, code, token, isPasswordReset = false) => {
  const actionText = isPasswordReset ? "Reset Password" : "Verify Account";
  const actionUrl = isPasswordReset
    ? `${process.env.APP_URL}/reset-password/${token}`
    : `${process.env.APP_URL}/verify-account/${token}`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; line-height: 1.6; }
        a { color: unset; text-decoration: none; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; }
        .header { background: #f1f5f9; padding: 40px 30px; text-align: center; }
        .logo { width: 133px; height: 30px; margin-bottom: 20px; display: block; margin-left: auto; margin-right: auto; }
        .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
        .header p { font-size: 16px; }
        .content { padding: 40px 30px; }
        .code-section { background-color: #f1f5f9; border-radius: 8px; padding: 24px; margin: 24px 0; text-align: center; }
        .code-label { font-size: 14px; color: #64748b; margin-bottom: 8px; font-weight: 500; }
        .verification-code { font-size: 32px; font-weight: 700; color: #1e293b; letter-spacing: 4px; font-family: 'Courier New', monospace; background-color: #ffffff; padding: 16px 24px; border-radius: 6px; border: 2px solid #e2e8f0; display: inline-block; margin: 8px 0; }
        .action-button { display: inline-block; background: #fff; color: #4361ee; border: 2px solid #4361ee; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 16px 0; transition: all 0.3s ease; cursor: pointer; }
        .action-button:hover { background: linear-gradient(135deg, #4361ee 0%, #3f37c9 100%); color: #fff !important; border-color: #3f37c9; }
        .info-text { color: #64748b; font-size: 14px; margin: 16px 0; line-height: 1.5; }
        .footer { background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { color: #94a3b8; font-size: 12px; margin-bottom: 8px; }
        .social-links { margin-top: 16px; }
        .social-links a { color: #64748b; text-decoration: none; margin: 0 8px; font-size: 12px; }
        @media (max-width: 600px) { .container { margin: 0; border-radius: 0; } .header, .content, .footer { padding: 24px 20px; } .verification-code { font-size: 24px; letter-spacing: 2px; padding: 12px 16px; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src=${
            process.env.APP_URL
          }/storage/assets/logo.png alt="Socially" width="80" height="50" style="display:block;margin:0 auto 28px auto;">
          <h1>${title}</h1>
          <p>Welcome to Socially - Your Social Connection Platform</p>
        </div>
        
        <div class="content">
          <p>Hello there! 👋</p>
          <p>We're excited to have you on board. To complete your ${actionText.toLowerCase()} process, please use the verification code below:</p>
          
          <div class="code-section">
            <div class="code-label">Your Verification Code</div>
            <div class="verification-code">${code}</div>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 8px;">This code will expire in 10 minutes</p>
          </div>
          
          <p>Alternatively, you can click the button below to ${actionText.toLowerCase()} directly:</p>
          
          <div style="text-align: center;">
            <a href="${actionUrl}" class="action-button">${actionText}</a>
          </div>
          
          <div class="info-text">
            <strong>Important:</strong> If you didn't request this ${actionText.toLowerCase()}, please ignore this email. Your account security is important to us.
          </div>
          
          <div class="info-text">
            <strong>Need help?</strong> If you're having trouble, please contact our support team and we'll be happy to assist you.
          </div>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Socially. All rights reserved.</p>
          <p>This email was sent to you because you requested account verification.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const sendAccountVerificationCode = async (email, code, token) => {
  try {
    console.log(code);
    const transporter = createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const emailHtml = createEmailTemplate(
      "Verify Your Account",
      code,
      token,
      false,
    );

    await transporter.sendMail({
      subject: "Verify Your Socially Account",
      to: email,
      html: emailHtml,
    });
  } catch (error) {
    console.error("Error sending verification email:", error);
  }
};

export const sendResetPasswordCode = async (email, code, token) => {
  try {
    console.log(code);
    const transporter = createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const emailHtml = createEmailTemplate(
      "Reset Your Password",
      code,
      token,
      true,
    );

    await transporter.sendMail({
      subject: "Reset Your Socially Password",
      to: email,
      html: emailHtml,
    });
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }
};
