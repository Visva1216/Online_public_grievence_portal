package in.gov.delhi.grievance.controller;

import in.gov.delhi.grievance.dto.ApiResponse;
import in.gov.delhi.grievance.service.ComplaintService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final ComplaintService complaintService;

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnalytics() {
        return ResponseEntity.ok(ApiResponse.success(complaintService.getAnalytics()));
    }
}
