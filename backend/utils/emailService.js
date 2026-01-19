const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Create transporter with Gmail SMTP
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
      }
    });
  }

  // Send email verification
  async sendVerificationEmail(email, name, token) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'TeamSync <noreply@teamsync.com>',
      to: email,
      subject: 'Verify Your TeamSync Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1976d2; color: white; padding: 20px; text-align: center;">
            <h1>Welcome to TeamSync!</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Hello ${name},</h2>
            <p>Thank you for signing up with TeamSync. To complete your registration, please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #1976d2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #1976d2;">${verificationUrl}</p>
            <p><strong>Note:</strong> This verification link will expire in 24 hours.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">
              If you didn't create a TeamSync account, please ignore this email.
            </p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Verification email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email, name, token) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'TeamSync <noreply@teamsync.com>',
      to: email,
      subject: 'Reset Your TeamSync Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f44336; color: white; padding: 20px; text-align: center;">
            <h1>Password Reset Request</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your TeamSync password. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #f44336; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #f44336;">${resetUrl}</p>
            <p><strong>Note:</strong> This reset link will expire in 1 hour.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">
              If you didn't request a password reset, please ignore this email or contact support if you have concerns.
            </p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send project invitation email
  async sendProjectInvitationEmail(email, name, projectName, inviterName, joinCode) {
    const joinUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/join-project?code=${joinCode}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'TeamSync <noreply@teamsync.com>',
      to: email,
      subject: `You've been invited to join "${projectName}" on TeamSync`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #4caf50; color: white; padding: 20px; text-align: center;">
            <h1>Project Invitation</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Hello ${name},</h2>
            <p><strong>${inviterName}</strong> has invited you to join the project <strong>"${projectName}"</strong> on TeamSync.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${joinUrl}" 
                 style="background: #4caf50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Join Project
              </a>
            </div>
            <p>You can also join manually using the join code: <strong>${joinCode}</strong></p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">
              If you're not interested in this project, you can safely ignore this email.
            </p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Project invitation email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send project invitation email:', error);
      return { success: false, error: error.message };
    }
  }

  // Send notification email
  async sendNotificationEmail(email, name, title, message, actionUrl = null) {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'TeamSync <noreply@teamsync.com>',
      to: email,
      subject: `TeamSync Notification: ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #ff9800; color: white; padding: 20px; text-align: center;">
            <h1>TeamSync Notification</h1>
          </div>
          <div style="padding: 20px;">
            <h2>Hello ${name},</h2>
            <h3>${title}</h3>
            <p>${message}</p>
            ${actionUrl ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${actionUrl}" 
                   style="background: #ff9800; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  View Details
                </a>
              </div>
            ` : ''}
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">
              You received this notification because you're part of a TeamSync project. 
              You can manage your notification preferences in your account settings.
            </p>
          </div>
        </div>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Notification email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send notification email:', error);
      return { success: false, error: error.message };
    }
  }

  // Test email configuration
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log('Email service is ready to send emails');
      return { success: true };
    } catch (error) {
      console.error('Email service configuration error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();