package in.gov.delhi.grievance.service;

import in.gov.delhi.grievance.dto.*;
import in.gov.delhi.grievance.model.User;
import in.gov.delhi.grievance.repository.UserRepository;
import in.gov.delhi.grievance.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .address(request.getAddress())
                .district(request.getDistrict())
                .pincode(request.getPincode())
                .aadhaarNumber(request.getAadhaarNumber())
                .role(User.Role.CITIZEN)
                .isActive(true)
                .isVerified(false)
                .emailVerified(false)
                .build();

        userRepository.save(user);

        String token = tokenProvider.generateToken(user.getEmail());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .expiresAt(LocalDateTime.now().plusDays(1))
                .build();
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        String token = tokenProvider.generateToken(authentication);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        userRepository.updateLastLogin(user.getId(), LocalDateTime.now());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .expiresAt(LocalDateTime.now().plusDays(1))
                .build();
    }

    public User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @Transactional
    public AuthResponse loginWithGoogle(String accessToken) throws Exception {
        org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setBearerAuth(accessToken);
        org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>("parameters", headers);
        
        org.springframework.http.ResponseEntity<java.util.Map> response = restTemplate.exchange(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                org.springframework.http.HttpMethod.GET,
                entity,
                java.util.Map.class
        );

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            java.util.Map<String, Object> payload = response.getBody();
            String email = (String) payload.get("email");
            String name = (String) payload.get("name");

            User user = userRepository.findByEmail(email).orElseGet(() -> {
                User newUser = User.builder()
                        .email(email)
                        .fullName(name)
                        .role(User.Role.CITIZEN)
                        .isActive(true)
                        .passwordHash(passwordEncoder.encode("OAUTH_PLACEHOLDER_PWD_" + System.currentTimeMillis()))
                        .build();
                return userRepository.save(newUser);
            });

            String customJwt = tokenProvider.generateToken(user.getEmail());

            userRepository.updateLastLogin(user.getId(), LocalDateTime.now());

            return AuthResponse.builder()
                    .token(customJwt)
                    .tokenType("Bearer")
                    .userId(user.getId())
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .role(user.getRole().name())
                    .expiresAt(LocalDateTime.now().plusDays(1))
                    .build();
        } else {
            throw new IllegalArgumentException("Invalid Google token");
        }
    }
}
