import nodemailer from 'nodemailer';

// Email configuration
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

// Create transporter
const transporter = nodemailer.createTransport({
  ...EMAIL_CONFIG,
  tls: {
    rejectUnauthorized: false,
  },
});

// Email templates
interface EmailTemplate {
  subject: string;
  html: string;
}

const templates: Record<string, EmailTemplate> = {
  welcome: {
    subject: 'Welcome to SmartInsurance!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Welcome to SmartInsurance!</h1>
        <p>Hello {{firstName}},</p>
        <p>Thank you for registering with SmartInsurance. Your account has been created successfully.</p>
        <p><strong>Your Login Details:</strong></p>
        <ul>
          <li>Email: {{email}}</li>
          <li>Role: {{role}}</li>
        </ul>
        <p>You can now log in to your account and start managing your insurance policies.</p>
        <p>Best regards,<br/>The SmartInsurance Team</p>
      </div>
    `,
  },

  policyCreated: {
    subject: 'Policy Created - {{policyNumber}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Policy Created Successfully</h1>
        <p>Hello {{customerName}},</p>
        <p>Your new policy has been created. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Policy Number</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{{policyNumber}}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Policy Type</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{{policyType}}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Sum Assured</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{{sumAssured}}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Premium Amount</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{{premiumAmount}}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Start Date</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{{startDate}}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>End Date</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{{endDate}}</td></tr>
        </table>
        <p>Best regards,<br/>The SmartInsurance Team</p>
      </div>
    `,
  },

  claimSubmitted: {
    subject: 'Claim Submitted - {{claimNumber}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Claim Submitted</h1>
        <p>Hello {{customerName}},</p>
        <p>Your claim has been submitted successfully. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Claim Number</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{{claimNumber}}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Policy Number</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{{policyNumber}}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Claim Amount</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{{claimAmount}}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Status</strong></td><td style="padding: 8px; border: 1px solid #ddd;">Submitted - Under Review</td></tr>
        </table>
        <p>We will notify you once your claim has been processed.</p>
        <p>Best regards,<br/>The SmartInsurance Team</p>
      </div>
    `,
  },

  claimApproved: {
    subject: 'Claim Approved - {{claimNumber}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Congratulations! Claim Approved</h1>
        <p>Hello {{customerName}},</p>
        <p>Your claim has been approved. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Claim Number</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{{claimNumber}}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Claimed Amount</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{{claimAmount}}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Approved Amount</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{{approvedAmount}}</td></tr>
        </table>
        <p>The approved amount will be credited to your account shortly.</p>
        <p>Best regards,<br/>The SmartInsurance Team</p>
      </div>
    `,
  },

  claimRejected: {
    subject: 'Claim Update - {{claimNumber}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #ef4444;">Claim Update</h1>
        <p>Hello {{customerName}},</p>
        <p>Unfortunately, your claim has been rejected. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Claim Number</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{{claimNumber}}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Reason</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{{reason}}</td></tr>
        </table>
        <p>If you have any questions, please contact our support team.</p>
        <p>Best regards,<br/>The SmartInsurance Team</p>
      </div>
    `,
  },

  paymentReminder: {
    subject: 'Payment Reminder - Policy {{policyNumber}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f59e0b;">Payment Reminder</h1>
        <p>Hello {{customerName}},</p>
        <p>This is a reminder that your premium payment is due soon.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Policy Number</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{{policyNumber}}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount Due</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{{amount}}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Due Date</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{{dueDate}}</td></tr>
        </table>
        <p>Please make your payment on time to keep your policy active.</p>
        <p>Best regards,<br/>The SmartInsurance Team</p>
      </div>
    `,
  },

  policyExpiring: {
    subject: 'Policy Expiring Soon - {{policyNumber}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f59e0b;">Policy Expiring Soon</h1>
        <p>Hello {{customerName}},</p>
        <p>Your policy is expiring on {{endDate}}. Please renew it to continue enjoying your coverage.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Policy Number</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{{policyNumber}}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Policy Type</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{{policyType}}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>End Date</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{{endDate}}</td></tr>
        </table>
        <p>Contact us or visit your agent to renew your policy.</p>
        <p>Best regards,<br/>The SmartInsurance Team</p>
      </div>
    `,
  },

  documentVerified: {
    subject: 'Document Verified - {{documentType}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Document Verified</h1>
        <p>Hello {{customerName}},</p>
        <p>Your document has been verified successfully.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Document Type</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{{documentType}}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>File Name</strong></td><td style="padding: 8px; border: 1px solid #ddd;">{{fileName}}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Status</strong></td><td style="padding: 8px; border: 1px solid #ddd;">Verified</td></tr>
        </table>
        <p>Best regards,<br/>The SmartInsurance Team</p>
      </div>
    `,
  },

  passwordChanged: {
    subject: 'Password Changed Successfully',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Password Changed</h1>
        <p>Hello {{firstName}},</p>
        <p>Your password has been changed successfully.</p>
        <p>If you did not make this change, please contact our support team immediately.</p>
        <p>Best regards,<br/>The SmartInsurance Team</p>
      </div>
    `,
  },
};

export const emailService = {
  /**
   * Send an email
   */
  async sendEmail(to: string, templateName: string, data: Record<string, string>): Promise<void> {
    // Skip if email is not configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`[Email] Skipping email to ${to} (not configured): ${templateName}`);
      return;
    }

    const template = templates[templateName];
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    // Replace placeholders
    let html = template.html;
    let subject = template.subject;
    for (const [key, value] of Object.entries(data)) {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
      subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    try {
      await transporter.sendMail({
        from: `"SmartInsurance" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });
      console.log(`[Email] Sent to ${to}: ${subject}`);
    } catch (error: any) {
      console.error(`[Email] Failed to send to ${to}:`, error.message);
      // Don't throw - email failure shouldn't break the main flow
    }
  },

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, firstName: string, role: string): Promise<void> {
    await this.sendEmail(email, 'welcome', { firstName, email, role });
  },

  /**
   * Send policy created email
   */
  async sendPolicyCreatedEmail(
    email: string,
    customerName: string,
    policyData: { policyNumber: string; policyType: string; sumAssured: string; premiumAmount: string; startDate: string; endDate: string }
  ): Promise<void> {
    await this.sendEmail(email, 'policyCreated', { customerName, ...policyData });
  },

  /**
   * Send claim submitted email
   */
  async sendClaimSubmittedEmail(
    email: string,
    customerName: string,
    claimData: { claimNumber: string; policyNumber: string; claimAmount: string }
  ): Promise<void> {
    await this.sendEmail(email, 'claimSubmitted', { customerName, ...claimData });
  },

  /**
   * Send claim approved email
   */
  async sendClaimApprovedEmail(
    email: string,
    customerName: string,
    claimData: { claimNumber: string; claimAmount: string; approvedAmount: string }
  ): Promise<void> {
    await this.sendEmail(email, 'claimApproved', { customerName, ...claimData });
  },

  /**
   * Send claim rejected email
   */
  async sendClaimRejectedEmail(
    email: string,
    customerName: string,
    claimData: { claimNumber: string; reason: string }
  ): Promise<void> {
    await this.sendEmail(email, 'claimRejected', { customerName, ...claimData });
  },

  /**
   * Send payment reminder email
   */
  async sendPaymentReminderEmail(
    email: string,
    customerName: string,
    paymentData: { policyNumber: string; amount: string; dueDate: string }
  ): Promise<void> {
    await this.sendEmail(email, 'paymentReminder', { customerName, ...paymentData });
  },

  /**
   * Send policy expiring email
   */
  async sendPolicyExpiringEmail(
    email: string,
    customerName: string,
    policyData: { policyNumber: string; policyType: string; endDate: string }
  ): Promise<void> {
    await this.sendEmail(email, 'policyExpiring', { customerName, ...policyData });
  },

  /**
   * Send document verified email
   */
  async sendDocumentVerifiedEmail(
    email: string,
    customerName: string,
    documentData: { documentType: string; fileName: string }
  ): Promise<void> {
    await this.sendEmail(email, 'documentVerified', { customerName, ...documentData });
  },

  /**
   * Send password changed email
   */
  async sendPasswordChangedEmail(email: string, firstName: string): Promise<void> {
    await this.sendEmail(email, 'passwordChanged', { firstName });
  },
};
