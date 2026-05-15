package in.gov.delhi.grievance.repository;

import in.gov.delhi.grievance.model.EmailNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmailNotificationRepository extends JpaRepository<EmailNotification, Long> {
    List<EmailNotification> findByStatus(EmailNotification.EmailStatus status);
    List<EmailNotification> findByComplaintId(Long complaintId);
}
