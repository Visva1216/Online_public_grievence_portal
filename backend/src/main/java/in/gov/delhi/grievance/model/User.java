package in.gov.delhi.grievance.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(unique = true, nullable = false, length = 150)
    private String email;

    @Column(length = 15)
    private String phone;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "aadhaar_number", length = 12)
    private String aadhaarNumber;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 100)
    private String district;

    @Column(length = 10)
    private String pincode;

    @Column(name = "is_verified")
    private Boolean isVerified = false;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "email_verified")
    private Boolean emailVerified = false;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private Role role = Role.CITIZEN;

    @Column(name = "profile_photo", length = 500)
    private String profilePhoto;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    public enum Role {
        CITIZEN, ADMIN, DEPARTMENT_OFFICER
    }
}
