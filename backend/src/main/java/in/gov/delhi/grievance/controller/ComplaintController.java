package in.gov.delhi.grievance.controller;

import in.gov.delhi.grievance.dto.*;
import in.gov.delhi.grievance.model.Complaint;
import in.gov.delhi.grievance.model.User;
import in.gov.delhi.grievance.service.ComplaintService;
import in.gov.delhi.grievance.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;
    private final AuthService authService;

    // ---- Citizen: Submit complaint ----
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ComplaintResponse>> submitComplaint(
            @RequestPart("data") @Valid ComplaintRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images,
            @RequestPart(value = "voice", required = false) MultipartFile voice,
            Authentication authentication) {

        ComplaintResponse response = complaintService.submitComplaint(
                request, authentication.getName(), images, voice);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Complaint submitted successfully", response));
    }

    // ---- Citizen: My complaints ----
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<Page<ComplaintResponse>>> getMyComplaints(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ComplaintResponse> complaints = complaintService.getMyComplaints(
                authentication.getName(), page, size);
        return ResponseEntity.ok(ApiResponse.success(complaints));
    }

    // ---- Public -> Protected: Track by complaint ID ----
    @GetMapping("/track/{complaintId}")
    public ResponseEntity<ApiResponse<ComplaintResponse>> trackComplaint(
            @PathVariable String complaintId,
            Authentication authentication) {
        ComplaintResponse response = complaintService.getByComplaintId(complaintId);
        
        // Authorization: User must be ADMIN or the owner of the complaint
        User currentUser = authService.getCurrentUser(authentication.getName());
        if (currentUser.getRole() != User.Role.ADMIN && !response.getUserEmail().equals(currentUser.getEmail())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("You are not authorized to track this complaint"));
        }
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ---- Public -> Protected: Map data ----
    @GetMapping("/map/data")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMapData(
            @RequestParam(required = false) Complaint.Category category,
            @RequestParam(required = false, defaultValue = "all") String statusType,
            @RequestParam(required = false) String complaintId,
            Authentication authentication) {
        User currentUser = authService.getCurrentUser(authentication.getName());
        return ResponseEntity
                .ok(ApiResponse.success(complaintService.getMapData(category, statusType, complaintId, currentUser)));
    }

    // ---- Admin: All complaints with filters ----
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ComplaintResponse>>> getAllComplaints(
            @RequestParam(required = false) Complaint.Status status,
            @RequestParam(required = false) Complaint.Category category,
            @RequestParam(required = false) Complaint.Priority priority,
            @RequestParam(required = false) String district,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ComplaintResponse> complaints = complaintService.getAllComplaints(
                status, category, priority, district, page, size);
        return ResponseEntity.ok(ApiResponse.success(complaints));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ComplaintResponse>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        var admin = authService.getCurrentUser(authentication.getName());
        Complaint.Status newStatus = null;
        if (body.get("status") != null && !body.get("status").toString().isBlank()) {
            newStatus = Complaint.Status.valueOf(body.get("status").toString());
        }
        String remarks = body.getOrDefault("remarks", "").toString();
        boolean sendEmail = Boolean.parseBoolean(body.getOrDefault("sendEmail", "true").toString());
        ComplaintResponse response = complaintService.updateStatus(id, newStatus, remarks, admin.getId(), sendEmail);
        return ResponseEntity.ok(ApiResponse.success("Status updated", response));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<ComplaintResponse>> assignDepartment(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body,
            Authentication authentication) {
        var admin = authService.getCurrentUser(authentication.getName());
        Long departmentId = Long.parseLong(body.get("departmentId").toString());
        boolean sendEmail = Boolean.parseBoolean(body.getOrDefault("sendEmail", "true").toString());
        ComplaintResponse response = complaintService.assignDepartment(id, departmentId, admin.getId(), sendEmail);
        return ResponseEntity.ok(ApiResponse.success("Department assigned", response));
    }
}
