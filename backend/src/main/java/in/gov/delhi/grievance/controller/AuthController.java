package in.gov.delhi.grievance.controller;

import in.gov.delhi.grievance.dto.*;
import in.gov.delhi.grievance.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(@RequestBody java.util.Map<String, String> body) {
        try {
            AuthResponse response = authService.loginWithGoogle(body.get("token"));
            return ResponseEntity.ok(ApiResponse.success("Google login successful", response));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Google authentication failed"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Object>> getCurrentUser(
            org.springframework.security.core.Authentication authentication) {
        var user = authService.getCurrentUser(authentication.getName());
        var userInfo = new java.util.HashMap<String, Object>();
        userInfo.put("id", user.getId());
        userInfo.put("fullName", user.getFullName());
        userInfo.put("email", user.getEmail());
        userInfo.put("phone", user.getPhone());
        userInfo.put("district", user.getDistrict());
        userInfo.put("role", user.getRole());
        userInfo.put("createdAt", user.getCreatedAt());
        return ResponseEntity.ok(ApiResponse.success(userInfo));
    }
}
