package in.gov.delhi.grievance.repository;

import in.gov.delhi.grievance.model.ComplaintStatusLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ComplaintStatusLogRepository extends JpaRepository<ComplaintStatusLog, Long> {
    List<ComplaintStatusLog> findByComplaintIdOrderByCreatedAtDesc(Long complaintId);
}
