package in.gov.delhi.grievance.service;

import in.gov.delhi.grievance.dto.*;
import in.gov.delhi.grievance.model.*;
import in.gov.delhi.grievance.repository.*;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final ComplaintImageRepository imageRepository;
    private final ComplaintStatusLogRepository statusLogRepository;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final AiIntegrationService aiService;
    private final EmailService emailService;
    private final EntityManager entityManager;

    @Value("${app.upload.complaint-images}")
    private String uploadDir;

    private static final AtomicLong counter = new AtomicLong(0);

    // -------------------------------------------------------------------------
    // Submit new complaint
    // -------------------------------------------------------------------------
    @Transactional
    public ComplaintResponse submitComplaint(ComplaintRequest request, String userEmail,
            List<MultipartFile> images, MultipartFile voiceFile) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // 1. Translate if needed
        String descriptionForProcessing = request.getDescription();
        String translatedText = null;
        if (request.getOriginalLanguage() != null && !request.getOriginalLanguage().equals("en")) {
            translatedText = aiService.translateToEnglish(request.getDescription(), request.getOriginalLanguage());
            descriptionForProcessing = translatedText;
        }

        // 2. AI Categorization
        Map<String, Object> categoryResult = aiService.categorizeComplaint(descriptionForProcessing,
                request.getOriginalLanguage());
        Complaint.Category aiCategory = request.getCategory() != null ? request.getCategory()
                : Complaint.Category.valueOf((String) categoryResult.getOrDefault("category", "OTHER"));
        double categoryConfidence = ((Number) categoryResult.getOrDefault("confidence", 0.5)).doubleValue();

        // 3. AI Priority Detection
        Map<String, Object> priorityResult = aiService.detectPriority(descriptionForProcessing);
        Complaint.Priority aiPriority = Complaint.Priority.valueOf(
                (String) priorityResult.getOrDefault("priority", "MEDIUM"));
        double priorityConfidence = ((Number) priorityResult.getOrDefault("confidence", 0.5)).doubleValue();

        // 4. Auto-assign department
        Department department = assignDepartment(aiCategory);

        // 5. Build complaint
        String complaintId = generateComplaintId();
        Complaint complaint = Complaint.builder()
                .complaintId(complaintId)
                .user(user)
                .title(request.getTitle())
                .description(request.getDescription())
                .descriptionTranslated(translatedText)
                .originalLanguage(request.getOriginalLanguage() != null ? request.getOriginalLanguage() : "en")
                .category(aiCategory)
                .categoryConfidence(BigDecimal.valueOf(categoryConfidence))
                .priority(aiPriority)
                .priorityConfidence(BigDecimal.valueOf(priorityConfidence))
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .address(request.getAddress())
                .ward(request.getWard())
                .district(request.getDistrict())
                .pincode(request.getPincode())
                .status(Complaint.Status.SUBMITTED)
                .department(department)
                .isDuplicate(false)
                .build();

        complaint = complaintRepository.save(complaint);

        // 6. Handle image uploads + AI analysis
        List<String> aiTags = new ArrayList<>();
        if (images != null && !images.isEmpty()) {
            for (MultipartFile image : images) {
                if (!image.isEmpty()) {
                    ComplaintImage ci = saveImage(complaint, image);
                    if (ci.getAiAnalysis() != null) {
                        Object tags = ci.getAiAnalysis().get("tags");
                        if (tags instanceof List<?> tagList) {
                            tagList.forEach(t -> aiTags.add(t.toString()));
                        }
                    }
                }
            }
        }

        // 7. Save voice complaint path
        if (voiceFile != null && !voiceFile.isEmpty()) {
            String voicePath = saveVoiceFile(voiceFile, complaintId);
            complaint.setVoiceFilePath(voicePath);
        }

        // 8. Update AI image tags
        if (!aiTags.isEmpty()) {
            complaint.setAiImageTags(aiTags);
            // Update category from image if more confident
            complaintRepository.save(complaint);
        }

        // 9. Duplicate detection
        checkAndMarkDuplicate(complaint);

        // 10. Status log entry
        final Complaint savedComplaint = complaint;
        ComplaintStatusLog log = ComplaintStatusLog.builder()
                .complaint(savedComplaint)
                .changedBy(user)
                .oldStatus(null)
                .newStatus(Complaint.Status.SUBMITTED.name())
                .remarks("Complaint submitted by citizen")
                .build();
        statusLogRepository.save(log);

        // 11. Send email async
        emailService.sendComplaintSubmitted(complaint);

        return toResponse(complaint);
    }

    // -------------------------------------------------------------------------
    // Get complaint by complaint ID (public tracking)
    // -------------------------------------------------------------------------
    public ComplaintResponse getByComplaintId(String complaintId) {
        Complaint complaint = complaintRepository.findByComplaintId(complaintId)
                .orElseThrow(() -> new NoSuchElementException("Complaint not found: " + complaintId));
        return toResponse(complaint);
    }

    // -------------------------------------------------------------------------
    // Get complaints for current user
    // -------------------------------------------------------------------------
    public Page<ComplaintResponse> getMyComplaints(String userEmail, int page, int size) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return complaintRepository.findByUserId(user.getId(), pageable).map(this::toResponse);
    }

    // -------------------------------------------------------------------------
    // Admin: Get all complaints with filters
    // -------------------------------------------------------------------------
    public Page<ComplaintResponse> getAllComplaints(Complaint.Status status, Complaint.Category category,
            Complaint.Priority priority, String district,
            int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        // Use specifications for dynamic filtering
        return complaintRepository.findAll((root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            if (status != null)
                predicates.add(cb.equal(root.get("status"), status));
            if (category != null)
                predicates.add(cb.equal(root.get("category"), category));
            if (priority != null)
                predicates.add(cb.equal(root.get("priority"), priority));
            if (district != null && !district.isBlank())
                predicates.add(cb.like(cb.lower(root.get("district")), "%" + district.toLowerCase() + "%"));
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        }, pageable).map(this::toResponse);
    }

    // -------------------------------------------------------------------------
    // Admin: Update status
    // -------------------------------------------------------------------------
    @Transactional
    public ComplaintResponse updateStatus(Long complaintId, Complaint.Status newStatus,
            String remarks, Long adminId, boolean sendEmail) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new NoSuchElementException("Complaint not found"));
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Admin not found"));

        String oldStatus = complaint.getStatus().name();

        // Update status if different
        if (newStatus != null) {
            complaint.setStatus(newStatus);
            if (newStatus == Complaint.Status.RESOLVED) {
                complaint.setResolvedAt(LocalDateTime.now());
                if (remarks != null && !remarks.isBlank()) {
                    complaint.setResolutionNote(remarks);
                }
            }
        }

        complaintRepository.save(complaint);

        // Always log the change if status changed OR if there are remarks
        if ((newStatus != null && !newStatus.name().equals(oldStatus)) || (remarks != null && !remarks.isBlank())) {
            ComplaintStatusLog statusLog = ComplaintStatusLog.builder()
                    .complaint(complaint)
                    .changedBy(admin)
                    .oldStatus(oldStatus)
                    .newStatus(complaint.getStatus().name())
                    .remarks(remarks != null && !remarks.isBlank() ? remarks
                            : "Status updated to " + complaint.getStatus())
                    .build();
            statusLogRepository.save(statusLog);
        }

        // Force-initialize lazy associations BEFORE async email handoff
        // so the @Async thread can access user/department data
        Hibernate.initialize(complaint.getUser());
        if (complaint.getDepartment() != null) {
            Hibernate.initialize(complaint.getDepartment());
        }

        // Send email (wrapped in try-catch so failures never crash the update)
        if (sendEmail) {
            try {
                if (newStatus == Complaint.Status.RESOLVED) {
                    emailService.sendComplaintResolved(complaint);
                } else if (newStatus != null && !newStatus.name().equals(oldStatus)) {
                    emailService.sendStatusUpdated(complaint, oldStatus);
                }
            } catch (Exception e) {
                log.warn("Failed to queue email notification for complaint {}: {}",
                        complaint.getComplaintId(), e.getMessage());
            }
        }

        // Flush all writes, then clear the persistence context to avoid
        // Hibernate 6 "Illegal pop() with non-matching JdbcValuesSourceProcessingState"
        // bug that occurs when lazy collections are loaded after writes in the same session
        complaintRepository.flush();
        entityManager.clear();

        // Reload complaint fresh from DB for clean response building
        Complaint reloaded = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new NoSuchElementException("Complaint not found after update"));
        return toResponse(reloaded);
    }

    // -------------------------------------------------------------------------
    // Admin: Assign department
    // -------------------------------------------------------------------------
    @Transactional
    public ComplaintResponse assignDepartment(Long complaintId, Long departmentId, Long adminId, boolean sendEmail) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new NoSuchElementException("Complaint not found"));
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new NoSuchElementException("Department not found"));
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Admin not found"));

        String oldStatus = complaint.getStatus().name();
        String oldDeptName = complaint.getDepartment() != null ? complaint.getDepartment().getName() : null;

        complaint.setDepartment(department);
        complaint.setAssignedAt(LocalDateTime.now());

        if (complaint.getStatus() == Complaint.Status.SUBMITTED) {
            complaint.setStatus(Complaint.Status.ASSIGNED);
        }

        complaintRepository.save(complaint);

        // Log
        statusLogRepository.save(ComplaintStatusLog.builder()
                .complaint(complaint)
                .changedBy(admin)
                .oldStatus(oldStatus)
                .newStatus(complaint.getStatus().name())
                .remarks("Assigned to " + department.getName()
                        + (oldDeptName != null ? " (Reassigned from " + oldDeptName + ")" : ""))
                .build());

        // Force-initialize lazy associations for async email
        Hibernate.initialize(complaint.getUser());
        Hibernate.initialize(complaint.getDepartment());

        if (sendEmail) {
            try {
                emailService.sendComplaintAssigned(complaint);
            } catch (Exception e) {
                log.warn("Failed to queue assignment email for complaint {}: {}",
                        complaint.getComplaintId(), e.getMessage());
            }
        }

        // Flush + clear to avoid Hibernate 6 lazy-collection bug
        complaintRepository.flush();
        entityManager.clear();

        Complaint reloaded = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new NoSuchElementException("Complaint not found after assignment"));
        return toResponse(reloaded);
    }

    // -------------------------------------------------------------------------
    // Get map data with advanced filters
    // -------------------------------------------------------------------------
    public List<Map<String, Object>> getMapData(Complaint.Category category, String statusType, String complaintId,
            User currentUser) {
        List<Complaint> complaints;

        if (currentUser.getRole() == User.Role.ADMIN) {
            // Admin sees everything
            if (complaintId != null && !complaintId.isBlank()) {
                // If searching by ID, we ignore other filters to find that specific one
                complaints = complaintRepository.findByComplaintId(complaintId).map(List::of).orElse(List.of());
                return complaints.stream()
                        .map(this::mapToMapData)
                        .collect(Collectors.toList());
            } else {
                complaints = complaintRepository.findAllWithLocation();
            }
        } else {
            // Citizen sees only their own
            complaints = complaintRepository.findAllByUserIdWithLocation(currentUser.getId());
            if (complaintId != null && !complaintId.isBlank()) {
                complaints = complaints.stream().filter(c -> c.getComplaintId().equals(complaintId)).toList();
            }
        }

        return complaints.stream()
                .filter(c -> category == null || c.getCategory() == category)
                .filter(c -> {
                    if ("active".equalsIgnoreCase(statusType)) {
                        // Ongoing: Submitted, Assigned, In Progress
                        return c.getStatus() == Complaint.Status.SUBMITTED || 
                               c.getStatus() == Complaint.Status.ASSIGNED || 
                               c.getStatus() == Complaint.Status.IN_PROGRESS;
                    } else if ("resolved".equalsIgnoreCase(statusType)) {
                        // Resolved: Resolved or Closed
                        return c.getStatus() == Complaint.Status.RESOLVED || 
                               c.getStatus() == Complaint.Status.CLOSED;
                    }
                    return true; // "all" or default
                })
                .map(this::mapToMapData)
                .collect(Collectors.toList());
    }

    private Map<String, Object> mapToMapData(Complaint c) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", c.getComplaintId());
        m.put("lat", c.getLatitude());
        m.put("lng", c.getLongitude());
        m.put("category", c.getCategory());
        m.put("priority", c.getPriority());
        m.put("status", c.getStatus());
        m.put("title", c.getTitle());
        m.put("address", c.getAddress());
        m.put("createdAt", c.getCreatedAt());
        return m;
    }

    // -------------------------------------------------------------------------
    // Analytics
    // -------------------------------------------------------------------------
    public Map<String, Object> getAnalytics() {
        Map<String, Object> analytics = new HashMap<>();
        analytics.put("total", complaintRepository.count());
        analytics.put("submitted", complaintRepository.countByStatus(Complaint.Status.SUBMITTED));
        analytics.put("assigned", complaintRepository.countByStatus(Complaint.Status.ASSIGNED));
        analytics.put("inProgress", complaintRepository.countByStatus(Complaint.Status.IN_PROGRESS));
        analytics.put("resolved", complaintRepository.countByStatus(Complaint.Status.RESOLVED));
        analytics.put("closed", complaintRepository.countByStatus(Complaint.Status.CLOSED));

        // By category
        List<Object[]> byCat = complaintRepository.countByCategory();
        Map<String, Long> categoryMap = new LinkedHashMap<>();
        byCat.forEach(row -> categoryMap.put(row[0].toString(), (Long) row[1]));
        analytics.put("byCategory", categoryMap);

        // By priority
        List<Object[]> byPriority = complaintRepository.countByPriority();
        Map<String, Long> priorityMap = new LinkedHashMap<>();
        byPriority.forEach(row -> priorityMap.put(row[0].toString(), (Long) row[1]));
        analytics.put("byPriority", priorityMap);

        // Recent (last 7 days)
        analytics.put("last7Days", complaintRepository.countSince(LocalDateTime.now().minusDays(7)));
        analytics.put("last30Days", complaintRepository.countSince(LocalDateTime.now().minusDays(30)));

        return analytics;
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------
    private String generateComplaintId() {
        String year = String.valueOf(LocalDateTime.now().getYear());
        long seq = complaintRepository.count() + 1 + counter.getAndIncrement();
        return String.format("DEL-%s-%05d", year, seq);
    }

    private Department assignDepartment(Complaint.Category category) {
        String code = switch (category) {
            case SANITATION -> "MCD_SANITATION";
            case WATER_SUPPLY -> "DJB_WATER";
            case ELECTRICITY -> "BSES_ELECTRICITY";
            case ROAD_MAINTENANCE -> "PWD_ROADS";
            case PUBLIC_SAFETY -> "DELHI_POLICE";
            case PARKS_GARDENS -> "DDA_PARKS";
            case NOISE_POLLUTION -> "DPCC_NOISE";
            case ANIMAL_NUISANCE -> "MVD_ANIMAL";
            default -> "MCD_SANITATION";
        };
        return departmentRepository.findByCode(code).orElse(null);
    }

    private ComplaintImage saveImage(Complaint complaint, MultipartFile file) {
        try {
            Path uploadPath = Paths.get(uploadDir, complaint.getComplaintId());
            Files.createDirectories(uploadPath);
            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // AI analysis
            Map<String, Object> aiAnalysis = aiService.analyzeImage(file.getBytes(), fileName);

            ComplaintImage ci = ComplaintImage.builder()
                    .complaint(complaint)
                    .imagePath(filePath.toString())
                    .imageUrl("/uploads/complaints/" + complaint.getComplaintId() + "/" + fileName)
                    .fileName(file.getOriginalFilename())
                    .fileSize(file.getSize())
                    .mimeType(file.getContentType())
                    .aiAnalysis(aiAnalysis)
                    .build();

            return imageRepository.save(ci);
        } catch (IOException e) {
            log.error("Failed to save image: {}", e.getMessage());
            throw new RuntimeException("Image upload failed", e);
        }
    }

    private String saveVoiceFile(MultipartFile voiceFile, String complaintId) {
        try {
            Path uploadPath = Paths.get("./uploads/voice", complaintId);
            Files.createDirectories(uploadPath);
            String fileName = complaintId + "_voice_" + UUID.randomUUID() + ".webm";
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(voiceFile.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            return filePath.toString();
        } catch (IOException e) {
            log.warn("Failed to save voice file: {}", e.getMessage());
            return null;
        }
    }

    private void checkAndMarkDuplicate(Complaint complaint) {
        if (complaint.getLatitude() == null || complaint.getLongitude() == null)
            return;

        List<Complaint> nearby = complaintRepository.findNearbyComplaintsOfCategory(
                complaint.getLatitude(), complaint.getLongitude(),
                complaint.getCategory(),
                LocalDateTime.now().minusDays(7));

        for (Complaint existing : nearby) {
            if (existing.getId().equals(complaint.getId()))
                continue;
            boolean isDuplicate = aiService.checkDuplicateText(complaint.getDescription(), existing.getDescription());
            if (isDuplicate) {
                complaint.setIsDuplicate(true);
                complaint.setDuplicateOf(existing.getId());
                complaintRepository.save(complaint);
                log.info("Complaint {} marked as duplicate of {}", complaint.getComplaintId(),
                        existing.getComplaintId());
                break;
            }
        }
    }

    public ComplaintResponse toResponse(Complaint c) {
        List<ComplaintResponse.ImageInfo> images;
        try {
            images = c.getImages() != null
                    ? c.getImages().stream()
                            .map(i -> new ComplaintResponse.ImageInfo(i.getId(), i.getImageUrl(), i.getFileName())).toList()
                    : List.of();
        } catch (Exception e) {
            log.debug("Could not load images for complaint {}: {}", c.getComplaintId(), e.getMessage());
            images = List.of();
        }

        List<ComplaintResponse.StatusLogInfo> logs;
        try {
            logs = c.getStatusLogs() != null
                    ? c.getStatusLogs().stream()
                            .sorted(Comparator.comparing(ComplaintStatusLog::getCreatedAt))
                            .map(sl -> new ComplaintResponse.StatusLogInfo(
                                    sl.getOldStatus(), sl.getNewStatus(), sl.getRemarks(),
                                    sl.getChangedBy() != null ? sl.getChangedBy().getFullName() : "System",
                                    sl.getCreatedAt()))
                            .toList()
                    : List.of();
        } catch (Exception e) {
            log.debug("Could not load status logs for complaint {}: {}", c.getComplaintId(), e.getMessage());
            logs = List.of();
        }

        return ComplaintResponse.builder()
                .id(c.getId())
                .complaintId(c.getComplaintId())
                .userId(c.getUser() != null ? c.getUser().getId() : null)
                .userName(c.getUser() != null ? c.getUser().getFullName() : null)
                .userEmail(c.getUser() != null ? c.getUser().getEmail() : null)
                .title(c.getTitle())
                .description(c.getDescription())
                .descriptionTranslated(c.getDescriptionTranslated())
                .originalLanguage(c.getOriginalLanguage())
                .category(c.getCategory())
                .categoryConfidence(c.getCategoryConfidence())
                .priority(c.getPriority())
                .status(c.getStatus())
                .latitude(c.getLatitude())
                .longitude(c.getLongitude())
                .address(c.getAddress())
                .ward(c.getWard())
                .district(c.getDistrict())
                .pincode(c.getPincode())
                .departmentId(c.getDepartment() != null ? c.getDepartment().getId() : null)
                .departmentName(c.getDepartment() != null ? c.getDepartment().getName() : null)
                .assignedAt(c.getAssignedAt())
                .isDuplicate(c.getIsDuplicate())
                .duplicateOf(c.getDuplicateOf())
                .aiImageTags(c.getAiImageTags())
                .images(images)
                .statusLogs(logs)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .resolvedAt(c.getResolvedAt())
                .build();
    }
}
