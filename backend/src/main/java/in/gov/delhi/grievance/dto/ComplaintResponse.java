package in.gov.delhi.grievance.dto;

import in.gov.delhi.grievance.model.Complaint;
import in.gov.delhi.grievance.model.ComplaintImage;
import in.gov.delhi.grievance.model.ComplaintStatusLog;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintResponse {
    private Long id;
    private String complaintId;
    private Long userId;
    private String userName;
    private String userEmail;

    private String title;
    private String description;
    private String descriptionTranslated;
    private String originalLanguage;

    private Complaint.Category category;
    private BigDecimal categoryConfidence;
    private Complaint.Priority priority;
    private Complaint.Status status;

    private BigDecimal latitude;
    private BigDecimal longitude;
    private String address;
    private String ward;
    private String district;
    private String pincode;

    private Long departmentId;
    private String departmentName;
    private LocalDateTime assignedAt;

    private Boolean isDuplicate;
    private Long duplicateOf;

    private List<String> aiImageTags;
    private List<ImageInfo> images;
    private List<StatusLogInfo> statusLogs;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ImageInfo {
        private Long id;
        private String imageUrl;
        private String fileName;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class StatusLogInfo {
        private String oldStatus;
        private String newStatus;
        private String remarks;
        private String changedBy;
        private LocalDateTime createdAt;
    }
}
