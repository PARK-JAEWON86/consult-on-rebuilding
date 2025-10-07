import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter?: nodemailer.Transporter;
  private sesClient?: SESClient;
  private readonly emailProvider: string;

  constructor() {
    this.emailProvider = process.env.EMAIL_PROVIDER || 'smtp';

    if (this.emailProvider === 'ses') {
      this.initializeSES();
    } else {
      this.initializeSMTP();
    }
  }

  private initializeSES() {
    try {
      this.sesClient = new SESClient({
        region: process.env.AWS_REGION || 'ap-northeast-2',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });
      this.logger.log('AWS SES client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize AWS SES client:', error);
      throw error;
    }
  }

  private initializeSMTP() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 587),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false, // Gmail에서 필요할 수 있음
        },
      });
      this.logger.log('SMTP transporter initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize SMTP transporter:', error);
      throw error;
    }
  }

  async sendMail(to: string, subject: string, html: string, text?: string) {
    const emailOptions: EmailOptions = { to, subject, html, text };

    if (this.emailProvider === 'ses') {
      return this.sendWithSES(emailOptions);
    } else {
      return this.sendWithSMTP(emailOptions);
    }
  }

  private async sendWithSES(options: EmailOptions) {
    try {
      if (!this.sesClient) {
        throw new Error('SES client not initialized');
      }

      const fromEmail = process.env.SES_FROM_EMAIL || process.env.MAIL_FROM || 'no-reply@consult-on.kr';
      const fromName = process.env.SES_FROM_NAME || 'Consult-On';
      const from = `${fromName} <${fromEmail}>`;

      this.logger.log(`Sending email via SES to: ${options.to}`);

      const command = new SendEmailCommand({
        Source: from,
        Destination: {
          ToAddresses: [options.to],
        },
        Message: {
          Subject: {
            Data: options.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: options.html,
              Charset: 'UTF-8',
            },
            ...(options.text && {
              Text: {
                Data: options.text,
                Charset: 'UTF-8',
              },
            }),
          },
        },
      });

      const result = await this.sesClient.send(command);
      this.logger.log(`Email sent successfully via SES: ${result.MessageId}`);
      return { messageId: result.MessageId };
    } catch (error) {
      this.logger.error(`Failed to send email via SES to ${options.to}:`, error);
      throw error;
    }
  }

  private async sendWithSMTP(options: EmailOptions) {
    try {
      if (!this.transporter) {
        throw new Error('SMTP transporter not initialized');
      }

      const from = process.env.MAIL_FROM || 'no-reply@localhost';

      this.logger.log(`Sending email via SMTP to: ${options.to}`);

      const info = await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        ...(options.text && { text: options.text }),
      });

      this.logger.log(`Email sent successfully via SMTP: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error(`Failed to send email via SMTP to ${options.to}:`, error);
      throw error;
    }
  }

  async verifyConnection() {
    try {
      if (this.emailProvider === 'ses') {
        // SES 연결 확인 - 간단한 테스트 이메일 전송 시도
        if (!this.sesClient) {
          throw new Error('SES client not initialized');
        }
        this.logger.log('AWS SES connection verified successfully');
        return true;
      } else {
        // SMTP 연결 확인
        if (!this.transporter) {
          throw new Error('SMTP transporter not initialized');
        }
        await this.transporter.verify();
        this.logger.log('SMTP connection verified successfully');
        return true;
      }
    } catch (error) {
      this.logger.error(`${this.emailProvider.toUpperCase()} connection verification failed:`, error);
      return false;
    }
  }

  // 회원가입 인증 이메일 전송
  async sendVerificationEmail(to: string, verificationCode: string, userName?: string) {
    const subject = '[Consult-On] 이메일 인증을 완료해주세요';

    const html = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>이메일 인증</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">

          <!-- Section 1: Header -->
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); text-align: center; padding: 40px 20px;">
            <h1 style="font-size: 24px; font-weight: bold; color: #ffffff; margin: 0; letter-spacing: -0.5px;">Consult-On</h1>
          </div>

          <!-- Section 2: Welcome -->
          <div style="background-color: #ffffff; padding: 40px 30px; text-align: center;">
            <h2 style="font-size: 20px; font-weight: 700; color: #1e40af; margin: 0 0 16px 0;">안녕하세요${userName ? `, ${userName}님` : ''}!</h2>
            <p style="color: #4b5563; margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;">Consult-On 서비스에 회원가입해 주셔서 감사합니다.</p>
            <p style="color: #4b5563; margin: 0 0 10px 0; font-size: 14px; line-height: 1.6;">아래 인증 코드를 입력하여 이메일 인증을 완료해주세요.</p>
          </div>

          <!-- Section 3: Verification Code (HERO) -->
          <div style="background: linear-gradient(to bottom, #f0f9ff, #e0f2fe); padding: 40px 30px; text-align: center;">
            <div style="background: #ffffff; border: 3px solid #3b82f6; border-radius: 12px; padding: 30px; margin: 0 auto; max-width: 380px; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.2), 0 4px 6px -2px rgba(59, 130, 246, 0.1);">
              <p style="font-size: 12px; font-weight: 700; color: #3b82f6; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 1.5px;">인증 코드</p>
              <div style="font-size: 42px; font-weight: 900; color: #2563eb; letter-spacing: 10px; font-family: 'Courier New', Courier, monospace; margin: 0; padding: 16px 0;">${verificationCode}</div>
            </div>
          </div>

          <!-- Section 4: Security Info -->
          <div style="background-color: #ffffff; padding: 40px 30px; text-align: center;">
            <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #3b82f6; border-radius: 10px; padding: 24px; margin: 0 auto; max-width: 420px;">
              <span style="color: #1e40af; font-size: 15px; font-weight: 700; margin: 0 0 16px 0; display: block;">🔒 보안 안내</span>
              <div style="margin: 0; padding: 0; text-align: center;">
                <p style="color: #374151; margin: 0 0 10px 0; font-size: 13px;">✓ 이 인증 코드는 <strong>60분간 유효</strong>합니다</p>
                <p style="color: #374151; margin: 0 0 10px 0; font-size: 13px;">✓ 보안을 위해 다른 사람과 공유하지 마세요</p>
                <p style="color: #374151; margin: 0; font-size: 13px;">✓ 본인이 요청하지 않은 경우 이 이메일을 무시해주세요</p>
              </div>
            </div>
          </div>

          <!-- Section 5: Additional Info -->
          <div style="background-color: #f9fafb; padding: 30px; text-align: center;">
            <p style="color: #4b5563; margin: 0 0 12px 0; font-size: 13px; line-height: 1.6;">인증이 완료되면 Consult-On의 모든 서비스를 이용하실 수 있습니다.</p>
            <p style="color: #4b5563; margin: 0; font-size: 13px; line-height: 1.6;">궁금한 점이 있으시면 언제든지 고객센터로 문의해주세요.</p>
          </div>

          <!-- Section 6: Footer -->
          <div style="background-color: #e5e7eb; padding: 30px; text-align: center;">
            <p style="margin: 6px 0; font-size: 12px; color: #6b7280;">본 메일은 발신 전용입니다. 문의사항은 고객센터를 이용해주세요.</p>
            <p style="margin: 6px 0; font-size: 12px; color: #6b7280;">&copy; 2024 Consult-On. All rights reserved.</p>
          </div>

        </div>
      </body>
      </html>
    `;

    const text = `
[Consult-On] 이메일 인증

안녕하세요${userName ? `, ${userName}님` : ''}!

Consult-On 서비스에 회원가입해 주셔서 감사합니다.
아래 인증 코드를 입력하여 이메일 인증을 완료해주세요.

인증 코드: ${verificationCode}

주의사항:
- 이 인증 코드는 60분간 유효합니다.
- 보안을 위해 다른 사람과 공유하지 마세요.
- 본인이 요청하지 않은 경우, 이 이메일을 무시해주세요.

인증이 완료되면 Consult-On의 모든 서비스를 이용하실 수 있습니다.

© 2024 Consult-On. All rights reserved.
    `;

    return this.sendMail(to, subject, html, text);
  }

  // 비밀번호 재설정 이메일 전송
  async sendPasswordResetEmail(to: string, resetToken: string, userName?: string) {
    const subject = '[Consult-On] 비밀번호 재설정 요청';
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>비밀번호 재설정</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 2px solid #3b82f6;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #3b82f6;
          }
          .content {
            padding: 20px 0;
          }
          .reset-button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
          }
          .warning {
            background-color: #fef3cd;
            border: 1px solid #fbbf24;
            border-radius: 4px;
            padding: 12px;
            margin: 20px 0;
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Consult-On</div>
        </div>

        <div class="content">
          <h2>비밀번호 재설정 요청</h2>

          <p>안녕하세요${userName ? `, ${userName}님` : ''}!</p>
          <p>계정의 비밀번호 재설정을 요청하셨습니다.</p>
          <p>아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요.</p>

          <div style="text-align: center;">
            <a href="${resetUrl}" class="reset-button">비밀번호 재설정하기</a>
          </div>

          <div class="warning">
            <strong>주의사항:</strong>
            <ul style="margin: 8px 0 0 0; padding-left: 20px;">
              <li>이 링크는 30분간 유효합니다.</li>
              <li>보안을 위해 다른 사람과 공유하지 마세요.</li>
              <li>본인이 요청하지 않은 경우, 이 이메일을 무시해주세요.</li>
            </ul>
          </div>

          <p style="font-size: 14px; color: #6b7280;">
            버튼이 작동하지 않는 경우, 아래 링크를 복사하여 브라우저에 직접 입력해주세요:<br>
            <a href="${resetUrl}">${resetUrl}</a>
          </p>
        </div>

        <div class="footer">
          <p>본 메일은 발신 전용입니다. 문의사항은 고객센터를 이용해주세요.</p>
          <p>&copy; 2024 Consult-On. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    const text = `
[Consult-On] 비밀번호 재설정 요청

안녕하세요${userName ? `, ${userName}님` : ''}!

계정의 비밀번호 재설정을 요청하셨습니다.
아래 링크를 클릭하여 새로운 비밀번호를 설정해주세요.

비밀번호 재설정 링크: ${resetUrl}

주의사항:
- 이 링크는 30분간 유효합니다.
- 보안을 위해 다른 사람과 공유하지 마세요.
- 본인이 요청하지 않은 경우, 이 이메일을 무시해주세요.

© 2024 Consult-On. All rights reserved.
    `;

    return this.sendMail(to, subject, html, text);
  }
}