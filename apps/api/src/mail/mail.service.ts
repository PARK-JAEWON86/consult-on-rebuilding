import { Injectable, Logger } from '@nestjs/common'
import nodemailer from 'nodemailer'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private transporter?: nodemailer.Transporter
  private sesClient?: SESClient
  private readonly emailProvider: string

  constructor() {
    this.emailProvider = process.env.EMAIL_PROVIDER || 'smtp'

    if (this.emailProvider === 'ses') {
      this.initializeSES()
    } else {
      this.initializeSMTP()
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
      })
      this.logger.log('AWS SES client initialized successfully')
    } catch (error) {
      this.logger.error('Failed to initialize AWS SES client:', error)
      throw error
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
      })
      this.logger.log('SMTP transporter initialized successfully')
    } catch (error) {
      this.logger.error('Failed to initialize SMTP transporter:', error)
      throw error
    }
  }

  async sendMail(to: string, subject: string, html: string, text?: string) {
    const emailOptions: EmailOptions = { to, subject, html, text }

    if (this.emailProvider === 'ses') {
      return this.sendWithSES(emailOptions)
    } else {
      return this.sendWithSMTP(emailOptions)
    }
  }

  private async sendWithSES(options: EmailOptions) {
    try {
      if (!this.sesClient) {
        throw new Error('SES client not initialized')
      }

      const fromEmail =
        process.env.SES_FROM_EMAIL ||
        process.env.MAIL_FROM ||
        'no-reply@consult-on.kr'
      const fromName = process.env.SES_FROM_NAME || 'Consult-On'
      const from = `${fromName} <${fromEmail}>`

      this.logger.log(`Sending email via SES to: ${options.to}`)

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
      })

      const result = await this.sesClient.send(command)
      this.logger.log(`Email sent successfully via SES: ${result.MessageId}`)
      return { messageId: result.MessageId }
    } catch (error) {
      this.logger.error(`Failed to send email via SES to ${options.to}:`, error)
      throw error
    }
  }

  private async sendWithSMTP(options: EmailOptions) {
    try {
      if (!this.transporter) {
        throw new Error('SMTP transporter not initialized')
      }

      const from = process.env.MAIL_FROM || 'no-reply@localhost'

      this.logger.log(`Sending email via SMTP to: ${options.to}`)

      const info = await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        ...(options.text && { text: options.text }),
      })

      this.logger.log(`Email sent successfully via SMTP: ${info.messageId}`)
      return info
    } catch (error) {
      this.logger.error(
        `Failed to send email via SMTP to ${options.to}:`,
        error
      )
      throw error
    }
  }

  async verifyConnection() {
    try {
      if (this.emailProvider === 'ses') {
        // SES 연결 확인 - 간단한 테스트 이메일 전송 시도
        if (!this.sesClient) {
          throw new Error('SES client not initialized')
        }
        this.logger.log('AWS SES connection verified successfully')
        return true
      } else {
        // SMTP 연결 확인
        if (!this.transporter) {
          throw new Error('SMTP transporter not initialized')
        }
        await this.transporter.verify()
        this.logger.log('SMTP connection verified successfully')
        return true
      }
    } catch (error) {
      this.logger.error(
        `${this.emailProvider.toUpperCase()} connection verification failed:`,
        error
      )
      return false
    }
  }

  // 회원가입 인증 이메일 전송
  async sendVerificationEmail(
    to: string,
    verificationCode: string,
    userName?: string
  ) {
    const subject = '[Consult-On] 이메일 인증을 완료해주세요'

    const html = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>이메일 인증</title>
      </head>
      <body style="font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; line-height: 1.5; color: #1f2937; margin: 0; padding: 20px; background-color: #f8fafc;">
        <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

          <!-- Header & Content Wrapper -->
          <div style="display: flex; align-items: stretch;">

            <!-- Left Side: Header -->
            <div style="background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%); padding: 40px 30px; width: 280px; display: flex; flex-direction: column; justify-content: center;">
              <h1 style="font-size: 28px; font-weight: 700; color: #ffffff; margin: 0 0 12px 0; letter-spacing: -0.5px;">Consult-On</h1>
              <p style="font-size: 14px; color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.6;">이메일 인증을 완료하고<br/>모든 서비스를 이용하세요</p>
            </div>

            <!-- Right Side: Main Content -->
            <div style="flex: 1; padding: 40px 35px;">

              <!-- Welcome Message -->
              <h2 style="font-size: 20px; font-weight: 600; color: #1e293b; margin: 0 0 8px 0;">안녕하세요${userName ? `, ${userName}님` : ''}!</h2>
              <p style="color: #64748b; margin: 0 0 24px 0; font-size: 14px; line-height: 1.6;">회원가입해 주셔서 감사합니다. 아래 인증 코드를 입력해주세요.</p>

              <!-- Verification Code -->
              <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
                <p style="font-size: 11px; font-weight: 600; color: #64748b; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">인증 코드</p>
                <div style="font-size: 36px; font-weight: 700; color: #2563eb; letter-spacing: 8px; font-family: 'SF Mono', 'Monaco', 'Consolas', monospace; margin: 0;">${verificationCode}</div>
              </div>

              <!-- Security Info -->
              <div style="background: #eff6ff; border-left: 3px solid #3b82f6; border-radius: 4px; padding: 16px 20px;">
                <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px;">
                  <span style="color: #3b82f6; font-size: 14px;">⏱</span>
                  <p style="color: #475569; margin: 0; font-size: 13px; line-height: 1.5;">이 인증 코드는 <strong>5분간 유효</strong>합니다</p>
                </div>
                <div style="display: flex; align-items: flex-start; gap: 8px;">
                  <span style="color: #3b82f6; font-size: 14px;">🔒</span>
                  <p style="color: #475569; margin: 0; font-size: 13px; line-height: 1.5;">보안을 위해 다른 사람과 공유하지 마세요</p>
                </div>
              </div>

            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f1f5f9; padding: 20px 35px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">본 메일은 발신 전용입니다 · &copy; 2024 Consult-On. All rights reserved.</p>
          </div>

        </div>
      </body>
      </html>
    `

    const text = `
[Consult-On] 이메일 인증

안녕하세요${userName ? `, ${userName}님` : ''}!

Consult-On 서비스에 회원가입해 주셔서 감사합니다.
아래 인증 코드를 입력하여 이메일 인증을 완료해주세요.

인증 코드: ${verificationCode}

주의사항:
- 이 인증 코드는 5분간 유효합니다.
- 보안을 위해 다른 사람과 공유하지 마세요.
- 본인이 요청하지 않은 경우, 이 이메일을 무시해주세요.

인증이 완료되면 Consult-On의 모든 서비스를 이용하실 수 있습니다.

© 2024 Consult-On. All rights reserved.
    `

    return this.sendMail(to, subject, html, text)
  }

  // 비밀번호 재설정 이메일 전송
  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    userName?: string
  ) {
    const subject = '[Consult-On] 비밀번호 재설정 요청'
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`

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
          <p>&copy; 2025 Consult-On. All rights reserved.</p>
        </div>
      </body>
      </html>
    `

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
    `

    return this.sendMail(to, subject, html, text)
  }

  // 전문가 신청 상태 변경 알림 이메일 전송
  async sendExpertApplicationStatusEmail(
    to: string,
    status: 'APPROVED' | 'REJECTED',
    applicantName: string,
    applicationId: string,
    rejectionReason?: string
  ) {
    const isApproved = status === 'APPROVED'
    const subject = isApproved
      ? '[Consult-On] 전문가 신청이 승인되었습니다'
      : '[Consult-On] 전문가 신청 검토 결과 안내'

    const html = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>전문가 신청 결과</title>
      </head>
      <body style="font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; line-height: 1.5; color: #1f2937; margin: 0; padding: 20px; background-color: #f8fafc;">
        <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

          <!-- Header & Content Wrapper -->
          <div style="display: flex; align-items: stretch;">

            <!-- Left Side: Header -->
            <div style="background: ${isApproved ? 'linear-gradient(180deg, #10b981 0%, #059669 100%)' : 'linear-gradient(180deg, #ef4444 0%, #dc2626 100%)'}; padding: 40px 30px; width: 280px; display: flex; flex-direction: column; justify-content: center;">
              <h1 style="font-size: 28px; font-weight: 700; color: #ffffff; margin: 0 0 12px 0; letter-spacing: -0.5px;">Consult-On</h1>
              <p style="font-size: 14px; color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.6;">${isApproved ? '전문가 신청이<br/>승인되었습니다' : '전문가 신청 검토<br/>결과를 안내드립니다'}</p>
            </div>

            <!-- Right Side: Main Content -->
            <div style="flex: 1; padding: 40px 35px;">

              <!-- Welcome Message -->
              <h2 style="font-size: 20px; font-weight: 600; color: #1e293b; margin: 0 0 8px 0;">${isApproved ? '🎉 축하합니다!' : '검토 결과 안내'}</h2>
              <p style="color: #64748b; margin: 0 0 24px 0; font-size: 14px; line-height: 1.6;">안녕하세요, ${applicantName}님!</p>

              ${isApproved ? `
                <!-- Approval Message -->
                <div style="background: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                  <p style="color: #166534; margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; font-weight: 600;">
                    ✅ 전문가 등록 신청이 승인되었습니다
                  </p>
                  <p style="color: #166534; margin: 0; font-size: 13px; line-height: 1.6;">
                    이제 Consult-On 플랫폼에서 전문가로 활동하실 수 있습니다.
                  </p>
                </div>

                <!-- Next Steps -->
                <div style="background: #eff6ff; border-left: 3px solid #3b82f6; border-radius: 4px; padding: 16px 20px; margin-bottom: 24px;">
                  <p style="font-size: 11px; font-weight: 600; color: #1e40af; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">다음 단계</p>
                  <div style="font-size: 13px; color: #475569; line-height: 1.8;">
                    <div style="margin-bottom: 8px;">📍 전문가 대시보드에 로그인하세요</div>
                    <div style="margin-bottom: 8px;">📍 프로필을 완성하고 공개 설정을 확인하세요</div>
                    <div style="margin-bottom: 8px;">📍 예약 가능 시간을 설정하세요</div>
                    <div>📍 첫 상담 요청을 기다려보세요!</div>
                  </div>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 24px 0;">
                  <a href="${process.env.FRONTEND_URL}/dashboard/expert" style="display: inline-block; background-color: #10b981; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                    전문가 대시보드로 이동
                  </a>
                </div>
              ` : `
                <!-- Rejection Message -->
                <div style="background: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                  <p style="color: #991b1b; margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; font-weight: 600;">
                    검토 결과
                  </p>
                  <p style="color: #7f1d1d; margin: 0; font-size: 13px; line-height: 1.6;">
                    제출하신 전문가 등록 신청을 신중히 검토한 결과, 아쉽게도 현재 단계에서는 승인이 어려운 것으로 판단되었습니다.
                  </p>
                </div>

                ${rejectionReason ? `
                  <!-- Review Notes -->
                  <div style="background: #fff7ed; border-left: 3px solid #f59e0b; border-radius: 4px; padding: 16px 20px; margin-bottom: 24px;">
                    <p style="font-size: 11px; font-weight: 600; color: #92400e; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">검토 의견</p>
                    <p style="color: #92400e; margin: 0; font-size: 13px; line-height: 1.6;">
                      ${rejectionReason}
                    </p>
                  </div>
                ` : ''}

                <!-- Re-application Info -->
                <div style="background: #eff6ff; border-left: 3px solid #3b82f6; border-radius: 4px; padding: 16px 20px;">
                  <div style="display: flex; align-items: flex-start; gap: 8px;">
                    <span style="color: #3b82f6; font-size: 14px;">ℹ️</span>
                    <p style="color: #475569; margin: 0; font-size: 13px; line-height: 1.5;">
                      <strong>재신청 안내:</strong> 피드백을 반영하여 언제든지 다시 신청하실 수 있습니다. 자격 요건을 보완한 후 재신청해 주시기 바랍니다.
                    </p>
                  </div>
                </div>
              `}

              <!-- Application Info -->
              <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-top: 24px;">
                <p style="font-size: 11px; font-weight: 600; color: #64748b; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">신청 번호</p>
                <div style="font-size: 18px; font-weight: 700; color: #1e293b; font-family: 'SF Mono', 'Monaco', 'Consolas', monospace; margin: 0;">${applicationId}</div>
              </div>

            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f1f5f9; padding: 20px 35px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
              문의: <a href="mailto:consult.on.official@gmail.com" style="color: #3b82f6; text-decoration: none;">consult.on.official@gmail.com</a>
            </p>
            <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">본 메일은 발신 전용입니다 · © 2024 Consult-On. All rights reserved.</p>
          </div>

        </div>
      </body>
      </html>
    `

    const text = `
[Consult-On] 전문가 신청 결과

안녕하세요, ${applicantName}님!

${isApproved
  ? `축하합니다! 제출하신 전문가 등록 신청이 승인되었습니다.

다음 단계:
1. 전문가 대시보드에 로그인하세요
2. 프로필을 완성하고 공개 설정을 확인하세요
3. 예약 가능 시간을 설정하세요
4. 첫 상담 요청을 기다려보세요!

전문가 대시보드: ${process.env.FRONTEND_URL}/dashboard/expert`
  : `제출하신 전문가 등록 신청을 검토한 결과, 현재 단계에서는 승인이 어려운 것으로 판단되었습니다.

${rejectionReason ? `검토 의견: ${rejectionReason}\n` : ''}
재신청 안내: 피드백을 반영하여 언제든지 다시 신청하실 수 있습니다.`
}

신청 번호: ${applicationId}

문의: consult.on.official@gmail.com
© 2024 Consult-On. All rights reserved.
    `

    return this.sendMail(to, subject, html, text)
  }

  // 추가 정보 요청 이메일 전송
  async sendAdditionalInfoRequestEmail(
    to: string,
    applicantName: string,
    applicationId: string,
    requestNotes: string
  ) {
    const subject = '[Consult-On] 전문가 등록 - 추가 정보가 필요합니다'

    // 줄바꿈을 <br> 태그로 변환
    const formattedNotes = requestNotes.replace(/\n/g, '<br>')

    const html = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>추가 정보 요청</title>
      </head>
      <body style="font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; line-height: 1.5; color: #1f2937; margin: 0; padding: 20px; background-color: #f8fafc;">
        <div style="max-width: 800px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

          <!-- Header & Content Wrapper -->
          <div style="display: flex; align-items: stretch;">

            <!-- Left Side: Header -->
            <div style="background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; width: 280px; display: flex; flex-direction: column; justify-content: center;">
              <h1 style="font-size: 28px; font-weight: 700; color: #ffffff; margin: 0 0 12px 0; letter-spacing: -0.5px;">Consult-On</h1>
              <p style="font-size: 14px; color: rgba(255, 255, 255, 0.9); margin: 0; line-height: 1.6;">전문가 등록<br/>추가 정보 요청</p>
            </div>

            <!-- Right Side: Main Content -->
            <div style="flex: 1; padding: 40px 35px;">

              <!-- Welcome Message -->
              <h2 style="font-size: 20px; font-weight: 600; color: #1e293b; margin: 0 0 8px 0;">추가 정보가 필요합니다</h2>
              <p style="color: #64748b; margin: 0 0 24px 0; font-size: 14px; line-height: 1.6;">안녕하세요, ${applicantName}님!</p>

              <!-- Info Request Message -->
              <div style="background: #fffbeb; border: 2px solid #fde68a; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <p style="color: #92400e; margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; font-weight: 600;">
                  📝 검토 진행 중
                </p>
                <p style="color: #78350f; margin: 0; font-size: 13px; line-height: 1.6;">
                  제출하신 전문가 등록 신청을 검토하던 중 아래 사항에 대한 추가 정보가 필요합니다.
                </p>
              </div>

              <!-- Request Details -->
              <div style="background: #fff7ed; border-left: 3px solid #f59e0b; border-radius: 4px; padding: 16px 20px; margin-bottom: 24px;">
                <p style="font-size: 11px; font-weight: 600; color: #92400e; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">요청 사항</p>
                <div style="color: #92400e; margin: 0; font-size: 13px; line-height: 1.6;">
                  ${formattedNotes}
                </div>
              </div>

              <!-- Next Steps -->
              <div style="background: #eff6ff; border-left: 3px solid #3b82f6; border-radius: 4px; padding: 16px 20px;">
                <div style="display: flex; align-items: flex-start; gap: 8px;">
                  <span style="color: #3b82f6; font-size: 14px;">ℹ️</span>
                  <p style="color: #475569; margin: 0; font-size: 13px; line-height: 1.5;">
                    <strong>다음 단계:</strong> 추가 정보를 준비하신 후 재신청 또는 이메일로 회신해 주시기 바랍니다. 빠른 시일 내에 검토를 완료하겠습니다.
                  </p>
                </div>
              </div>

              <!-- Application Info -->
              <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-top: 24px;">
                <p style="font-size: 11px; font-weight: 600; color: #64748b; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">신청 번호</p>
                <div style="font-size: 18px; font-weight: 700; color: #1e293b; font-family: 'SF Mono', 'Monaco', 'Consolas', monospace; margin: 0;">${applicationId}</div>
              </div>

            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f1f5f9; padding: 20px 35px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
              문의: <a href="mailto:consult.on.official@gmail.com" style="color: #3b82f6; text-decoration: none;">consult.on.official@gmail.com</a>
            </p>
            <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">본 메일은 발신 전용입니다 · © 2024 Consult-On. All rights reserved.</p>
          </div>

        </div>
      </body>
      </html>
    `

    const text = `
[Consult-On] 전문가 등록 - 추가 정보 요청

안녕하세요, ${applicantName}님!

제출하신 전문가 등록 신청을 검토하던 중 아래 사항에 대한 추가 정보가 필요합니다.

요청 사항:
${requestNotes}

다음 단계: 추가 정보를 준비하신 후 재신청 또는 이메일로 회신해 주시기 바랍니다.
빠른 시일 내에 검토를 완료하겠습니다.

신청 번호: ${applicationId}

문의: consult.on.official@gmail.com
© 2024 Consult-On. All rights reserved.
    `

    return this.sendMail(to, subject, html, text)
  }
}
