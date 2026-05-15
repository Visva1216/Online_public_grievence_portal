package in.gov.delhi.grievance.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "complaints")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "complaint_id", unique = true, nullable = false, length = 20)
    private String complaintId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "original_language", length = 20)
    private String originalLanguage = "en";

    @Column(name = "description_translated", columnDefinition = "TEXT")
    private String descriptionTranslated;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Category category;

    @Column(name = "category_confidence", precision = 5, scale = 4)
    private BigDecimal categoryConfidence;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Priority priority = Priority.MEDIUM;

    @Column(name = "priority_confidence", precision = 5, scale = 4)
    private BigDecimal priorityConfidence;

    // Location
    @Column(precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(precision = 11, scale = 8)
    private BigDecimal longitude;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 100)
    private String ward;

    @Column(length = 100)
    private String district;

    @Column(length = 10)
    private String pincode;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Status status = Status.SUBMITTED;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_officer_id")
    private User assignedOfficer;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    @Column(name = "resolution_note", columnDefinition = "TEXT")
    private String resolutionNote;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Convert(converter = in.gov.delhi.grievance.util.ListConverter.class)
    @Column(name = "ai_image_tags", columnDefinition = "json")
    private List<String> aiImageTags;

    @Column(name = "ai_category_raw", length = 100)
    private String aiCategoryRaw;

    @Column(name = "is_duplicate")
    private Boolean isDuplicate = false;

    @Column(name = "duplicate_of")
    private Long duplicateOf;

    @Column(name = "voice_file_path", length = 500)
    private String voiceFilePath;

    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ComplaintImage> images;

    @OneToMany(mappedBy = "complaint", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ComplaintStatusLog> statusLogs;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Category {
        SANITATION, WATER_SUPPLY, ELECTRICITY, ROAD_MAINTENANCE,
        PUBLIC_SAFETY, PARKS_GARDENS, NOISE_POLLUTION, ANIMAL_NUISANCE, OTHER
    }

    public enum Priority {
        CRITICAL, HIGH, MEDIUM, LOW
    }

    public enum Status {
        SUBMITTED, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED, REJECTED
    }
}
