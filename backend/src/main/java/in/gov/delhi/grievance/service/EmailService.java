package in.gov.delhi.grievance.service;

import in.gov.delhi.grievance.model.EmailNotification;
import in.gov.delhi.grievance.model.Complaint;
import in.gov.delhi.grievance.repository.EmailNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final EmailNotificationRepository notificationRepository;

    @Value("${app.email.from}")
    private String fromEmail;

    @Value("${app.email.from-name}")
    private String fromName;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Async
    public void sendComplaintSubmitted(Complaint complaint) {
        try {
            String toEmail = complaint.getUser().getEmail();
            String subject = "✅ Complaint Registered - " + complaint.getComplaintId();
            String body = buildSubmittedEmailBody(complaint);
            sendEmail(toEmail, subject, body,
                    EmailNotification.NotificationType.COMPLAINT_SUBMITTED, complaint);
        } catch (Exception e) {
            logger.error("Failed to send submission email for complaint {}: {}",
                    complaint.getComplaintId(), e.getMessage());
        }
    }

    @Async
    public void sendComplaintAssigned(Complaint complaint) {
        try {
            String toEmail = complaint.getUser().getEmail();
            String subject = "📋 Complaint Assigned - " + complaint.getComplaintId();
            String body = buildAssignedEmailBody(complaint);
            sendEmail(toEmail, subject, body,
                    EmailNotification.NotificationType.COMPLAINT_ASSIGNED, complaint);
        } catch (Exception e) {
            logger.error("Failed to send assignment email for complaint {}: {}",
                    complaint.getComplaintId(), e.getMessage());
        }
    }

    @Async
    public void sendStatusUpdated(Complaint complaint, String oldStatus) {
        try {
            String toEmail = complaint.getUser().getEmail();
            String subject = "🔄 Complaint Status Updated - " + complaint.getComplaintId();
            String body = buildStatusUpdatedEmailBody(complaint, oldStatus);
            sendEmail(toEmail, subject, body,
                    EmailNotification.NotificationType.STATUS_UPDATED, complaint);
        } catch (Exception e) {
            logger.error("Failed to send status update email for complaint {}: {}",
                    complaint.getComplaintId(), e.getMessage());
        }
    }

    @Async
    public void sendComplaintResolved(Complaint complaint) {
        try {
            String toEmail = complaint.getUser().getEmail();
            String subject = "🎉 Complaint Resolved - " + complaint.getComplaintId();
            String body = buildResolvedEmailBody(complaint);
            sendEmail(toEmail, subject, body,
                    EmailNotification.NotificationType.COMPLAINT_RESOLVED, complaint);
        } catch (Exception e) {
            logger.error("Failed to send resolution email for complaint {}: {}",
                    complaint.getComplaintId(), e.getMessage());
        }
    }

    private void sendEmail(String to, String subject, String body,
                           EmailNotification.NotificationType type, Complaint complaint) {
        EmailNotification notification = EmailNotification.builder()
                .complaint(complaint)
                .recipientEmail(to)
                .subject(subject)
                .body(body)
                .notificationType(type)
                .status(EmailNotification.EmailStatus.PENDING)
                .build();

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(message);

            notification.setStatus(EmailNotification.EmailStatus.SENT);
            notification.setSentAt(LocalDateTime.now());
            logger.info("Email sent successfully to {} for complaint {}", to, complaint.getComplaintId());
        } catch (Exception e) {
            notification.setStatus(EmailNotification.EmailStatus.FAILED);
            notification.setErrorMessage(e.getMessage());
            logger.error("Failed to send email to {}: {}", to, e.getMessage());
            logger.info("======= FALLBACK MOCK EMAIL LOG =======");
            logger.info("TO: {}", to);
            logger.info("SUBJECT: {}", subject);
            logger.info("BODY:\n{}", body);
            logger.info("=======================================");
        }

        notificationRepository.save(notification);
    }

    private String buildSubmittedEmailBody(Complaint complaint) {
        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8">
            <style>
                body { font-family: 'Segoe UI', sans-serif; background: #f4f7fb; margin: 0; padding: 20px; }
                .container { max-width: 600px; margin: auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #1e3a5f 0%%, #2d6a9f 100%%); padding: 32px; text-align: center; }
                .header img { width: 60px; margin-bottom: 12px; }
                .header h1 { color: #fff; margin: 0; font-size: 22px; }
                .header p { color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px; }
                .body { padding: 32px; }
                .badge { background: #e8f5e9; color: #2e7d32; padding: 8px 20px; border-radius: 20px; font-weight: 700; font-size: 15px; display: inline-block; margin-bottom: 24px; }
                .info-row { display: flex; justify-content: space-between; border-bottom: 1px solid #f0f0f0; padding: 12px 0; }
                .info-label { color: #888; font-size: 13px; }
                .info-value { font-weight: 600; color: #222; font-size: 14px; text-align: right; max-width: 60%%; }
                .btn { display: block; width: fit-content; margin: 24px auto 0; background: linear-gradient(135deg, #1e3a5f, #2d6a9f); color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; text-align: center; }
                .footer { background: #f8f9fa; padding: 20px 32px; text-align: center; font-size: 12px; color: #aaa; }
            </style>
            </head>
            <body>
            <div class="container">
                <div class="header">
                    <h1>🏛️ Delhi Grievance Portal</h1>
                    <p>Government of NCT of Delhi</p>
                </div>
                <div class="body">
                    <p>Dear <strong>%s</strong>,</p>
                    <p>Your complaint has been successfully registered. Our team will review it shortly.</p>
                    <div class="badge">✅ Complaint Submitted</div>
                    <div class="info-row"><span class="info-label">Complaint ID</span><span class="info-value"><strong>%s</strong></span></div>
                    <div class="info-row"><span class="info-label">Category</span><span class="info-value">%s</span></div>
                    <div class="info-row"><span class="info-label">Priority</span><span class="info-value">%s</span></div>
                    <div class="info-row"><span class="info-label">Status</span><span class="info-value">Submitted</span></div>
                    <div class="info-row"><span class="info-label">Location</span><span class="info-value">%s</span></div>
                    <a href="%s/track/%s" class="btn">Track Your Complaint →</a>
                </div>
                <div class="footer">
                    <p>This is an automated email from Delhi Grievance Portal. Please do not reply.</p>
                    <p>© 2024 Government of NCT of Delhi. All rights reserved.</p>
                </div>
            </div>
            </body></html>
            """.formatted(
                complaint.getUser().getFullName(),
                complaint.getComplaintId(),
                complaint.getCategory().name().replace("_", " "),
                complaint.getPriority().name(),
                complaint.getAddress() != null ? complaint.getAddress() : "N/A",
                frontendUrl,
                complaint.getComplaintId()
        );
    }

    private String buildAssignedEmailBody(Complaint complaint) {
        return """
            <!DOCTYPE html><html><body style="font-family:sans-serif;background:#f4f7fb;padding:20px">
            <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,0.1)">
            <h2 style="color:#1e3a5f">📋 Complaint Assigned - %s</h2>
            <p>Dear <strong>%s</strong>, your complaint has been assigned to <strong>%s</strong>.</p>
            <p>They will contact you within 48 hours. You can track progress at: <a href="%s/track/%s">Track Complaint</a></p>
            </div></body></html>
            """.formatted(
                complaint.getComplaintId(),
                complaint.getUser().getFullName(),
                complaint.getDepartment() != null ? complaint.getDepartment().getName() : "Concerned Department",
                frontendUrl, complaint.getComplaintId()
        );
    }

    private String buildStatusUpdatedEmailBody(Complaint complaint, String oldStatus) {
        return """
            <!DOCTYPE html><html><body style="font-family:sans-serif;background:#f4f7fb;padding:20px">
            <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,0.1)">
            <h2 style="color:#1e3a5f">🔄 Status Update - %s</h2>
            <p>Dear <strong>%s</strong>, your complaint status has been updated.</p>
            <p><strong>Previous Status:</strong> %s → <strong>New Status:</strong> %s</p>
            <p><a href="%s/track/%s">View Full Details →</a></p>
            </div></body></html>
            """.formatted(
                complaint.getComplaintId(),
                complaint.getUser().getFullName(),
                oldStatus, complaint.getStatus().name(),
                frontendUrl, complaint.getComplaintId()
        );
    }

    private String buildResolvedEmailBody(Complaint complaint) {
        return """
            <!DOCTYPE html><html><body style="font-family:sans-serif;background:#f4f7fb;padding:20px">
            <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,0.1)">
            <h2 style="color:#2e7d32">🎉 Complaint Resolved - %s</h2>
            <p>Dear <strong>%s</strong>, we are pleased to inform you that your complaint has been resolved.</p>
            <p><strong>Resolution:</strong> %s</p>
            <p>Thank you for helping us improve Delhi!</p>
            <p><a href="%s/track/%s">View Resolution Details →</a></p>
            </div></body></html>
            """.formatted(
                complaint.getComplaintId(),
                complaint.getUser().getFullName(),
                complaint.getResolutionNote() != null ? complaint.getResolutionNote() : "Resolved by concerned department",
                frontendUrl, complaint.getComplaintId()
        );
    }
}
