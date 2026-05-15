package in.gov.delhi.grievance.dto;

import in.gov.delhi.grievance.model.Complaint;
import lombok.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplaintRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 300)
    private String title;

    @NotBlank(message = "Description is required")
    @Size(min = 10, message = "Description must be at least 10 characters")
    private String description;

    private String originalLanguage;

    // Category (can be overridden by AI)
    private Complaint.Category category;

    // Location
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String address;
    private String ward;
    private String district;
    private String pincode;
}
