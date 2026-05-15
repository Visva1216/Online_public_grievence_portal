package in.gov.delhi.grievance.repository;

import in.gov.delhi.grievance.model.Complaint;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long>, JpaSpecificationExecutor<Complaint> {

       Optional<Complaint> findByComplaintId(String complaintId);

       Page<Complaint> findByUserId(Long userId, Pageable pageable);

       Page<Complaint> findByStatus(Complaint.Status status, Pageable pageable);

       Page<Complaint> findByCategory(Complaint.Category category, Pageable pageable);

       Page<Complaint> findByDepartmentId(Long departmentId, Pageable pageable);

       // Nearby complaints for duplicate detection
       @Query("SELECT c FROM Complaint c WHERE " +
                     "ABS(c.latitude - :lat) < 0.01 AND ABS(c.longitude - :lng) < 0.01 " +
                     "AND c.category = :category AND c.status != 'CLOSED' " +
                     "AND c.createdAt > :since")
       List<Complaint> findNearbyComplaintsOfCategory(
                     @Param("lat") BigDecimal lat,
                     @Param("lng") BigDecimal lng,
                     @Param("category") Complaint.Category category,
                     @Param("since") LocalDateTime since);

       // Analytics queries
       @Query("SELECT c.category, COUNT(c) FROM Complaint c GROUP BY c.category")
       List<Object[]> countByCategory();

       @Query("SELECT c.status, COUNT(c) FROM Complaint c GROUP BY c.status")
       List<Object[]> countByStatus();

       @Query("SELECT c.priority, COUNT(c) FROM Complaint c GROUP BY c.priority")
       List<Object[]> countByPriority();

       @Query("SELECT c.district, COUNT(c) FROM Complaint c GROUP BY c.district ORDER BY COUNT(c) DESC")
       List<Object[]> countByDistrict();

       @Query("SELECT COUNT(c) FROM Complaint c WHERE c.department.id = :deptId AND c.status = 'RESOLVED'")
       long countResolvedByDepartment(@Param("deptId") Long deptId);

       @Query("SELECT AVG(TIMESTAMPDIFF(HOUR, c.createdAt, c.resolvedAt)) FROM Complaint c " +
                     "WHERE c.department.id = :deptId AND c.status = 'RESOLVED' AND c.resolvedAt IS NOT NULL")
       Double avgResolutionHoursByDepartment(@Param("deptId") Long deptId);

       @Query("SELECT c FROM Complaint c WHERE c.latitude IS NOT NULL AND c.longitude IS NOT NULL")
       List<Complaint> findAllWithLocation();

       long countByStatus(Complaint.Status status);

       @Query("SELECT c FROM Complaint c WHERE c.user.id = :userId AND c.latitude IS NOT NULL AND c.longitude IS NOT NULL")
       List<Complaint> findAllByUserIdWithLocation(@Param("userId") Long userId);

       @Query("SELECT COUNT(c) FROM Complaint c WHERE c.createdAt > :since")
    long countSince(@Param("since") LocalDateTime since);
}
