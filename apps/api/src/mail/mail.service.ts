import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
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
  }

  async sendMail(to: string, subject: string, html: string) {
    try {
      const from = process.env.MAIL_FROM || 'no-reply@localhost';
      
      this.logger.log(`Sending email to: ${to}`);
      
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent successfully: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
      return true;
    } catch (error) {
      this.logger.error('SMTP connection verification failed:', error);
      return false;
    }
  }
}
