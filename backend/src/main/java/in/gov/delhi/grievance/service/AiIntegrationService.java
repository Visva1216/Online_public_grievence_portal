package in.gov.delhi.grievance.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import in.gov.delhi.grievance.model.Complaint;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiIntegrationService {

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    @Value("${app.ai-service.url}")
    private String aiServiceUrl;

    // -------------------------------------------------------------------------
    // NLP: Categorize complaint text
    // -------------------------------------------------------------------------
    public Map<String, Object> categorizeComplaint(String text, String language) {
        try {
            WebClient client = webClientBuilder.baseUrl(aiServiceUrl).build();
            Map<String, String> body = Map.of("text", text, "language", language != null ? language : "en");

            Map<String, Object> result = client.post()
                    .uri("/ai/categorize")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(java.time.Duration.ofSeconds(6))
                    .block();

            return result != null ? result : fallbackCategorize(text);
        } catch (Exception e) {
            log.warn("AI categorization service unavailable, using fallback: {}", e.getMessage());
            return fallbackCategorize(text);
        }
    }

    // -------------------------------------------------------------------------
    // NLP: Detect priority
    // -------------------------------------------------------------------------
    public Map<String, Object> detectPriority(String text) {
        try {
            WebClient client = webClientBuilder.baseUrl(aiServiceUrl).build();
            Map<String, String> body = Map.of("text", text);

            Map<String, Object> result = client.post()
                    .uri("/ai/priority")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(java.time.Duration.ofSeconds(6))
                    .block();

            return result != null ? result : Map.of("priority", "MEDIUM", "confidence", 0.5);
        } catch (Exception e) {
            log.warn("AI priority service unavailable, using fallback: {}", e.getMessage());
            return fallbackPriority(text);
        }
    }

    // -------------------------------------------------------------------------
    // Image analysis
    // -------------------------------------------------------------------------
    public Map<String, Object> analyzeImage(byte[] imageBytes, String fileName) {
        try {
            WebClient client = webClientBuilder.baseUrl(aiServiceUrl).build();

            MultiValueMap<String, Object> formData = new LinkedMultiValueMap<>();
            ByteArrayResource resource = new ByteArrayResource(imageBytes) {
                @Override
                public String getFilename() { return fileName; }
            };
            formData.add("image", resource);

            Map<String, Object> result = client.post()
                    .uri("/ai/analyze-image")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(formData))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(java.time.Duration.ofSeconds(6))
                    .block();

            return result != null ? result : Map.of("tags", List.of(), "category_suggestion", "OTHER");
        } catch (Exception e) {
            log.warn("AI image analysis unavailable: {}", e.getMessage());
            return Map.of("tags", List.of("unanalyzed"), "category_suggestion", "OTHER");
        }
    }

    // -------------------------------------------------------------------------
    // Language translation
    // -------------------------------------------------------------------------
    public String translateToEnglish(String text, String sourceLanguage) {
        if ("en".equalsIgnoreCase(sourceLanguage)) return text;
        try {
            WebClient client = webClientBuilder.baseUrl(aiServiceUrl).build();
            Map<String, String> body = Map.of("text", text, "source_language", sourceLanguage, "target_language", "en");

            Map<String, Object> result = client.post()
                    .uri("/ai/translate")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(java.time.Duration.ofSeconds(6))
                    .block();

            return result != null ? (String) result.getOrDefault("translated_text", text) : text;
        } catch (Exception e) {
            log.warn("Translation service unavailable: {}", e.getMessage());
            return text;
        }
    }

    // -------------------------------------------------------------------------
    // Duplicate detection
    // -------------------------------------------------------------------------
    public boolean checkDuplicateText(String newText, String existingText) {
        try {
            WebClient client = webClientBuilder.baseUrl(aiServiceUrl).build();
            Map<String, String> body = Map.of("text1", newText, "text2", existingText);

            Map<String, Object> result = client.post()
                    .uri("/ai/similarity")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(java.time.Duration.ofSeconds(6))
                    .block();

            if (result != null) {
                double similarity = ((Number) result.getOrDefault("similarity", 0.0)).doubleValue();
                return similarity > 0.75;
            }
            return false;
        } catch (Exception e) {
            log.warn("Similarity service unavailable: {}", e.getMessage());
            return false;
        }
    }

    // -------------------------------------------------------------------------
    // Fallback implementations (rule-based)
    // -------------------------------------------------------------------------
    private Map<String, Object> fallbackCategorize(String text) {
        String lower = text.toLowerCase();

        Complaint.Category category;
        if (containsAny(lower, "garbage","waste","trash","litter","dirt","clean","sweeping","sanitation"))
            category = Complaint.Category.SANITATION;
        else if (containsAny(lower, "water","pipe","leak","supply","drain","sewage","flood"))
            category = Complaint.Category.WATER_SUPPLY;
        else if (containsAny(lower, "electric","power","light","streetlight","lamp","bulb","wire","current"))
            category = Complaint.Category.ELECTRICITY;
        else if (containsAny(lower, "road","pothole","footpath","pavement","highway","street","signal"))
            category = Complaint.Category.ROAD_MAINTENANCE;
        else if (containsAny(lower, "crime","police","theft","robbery","fight","assault","safety","security"))
            category = Complaint.Category.PUBLIC_SAFETY;
        else if (containsAny(lower, "park","garden","tree","plant","grass","playground"))
            category = Complaint.Category.PARKS_GARDENS;
        else if (containsAny(lower, "noise","loud","sound","music","honking","party","speaker"))
            category = Complaint.Category.NOISE_POLLUTION;
        else if (containsAny(lower, "dog","stray","animal","cattle","cow","monkey","bite"))
            category = Complaint.Category.ANIMAL_NUISANCE;
        else
            category = Complaint.Category.OTHER;

        return Map.of("category", category.name(), "confidence", 0.70, "method", "rule-based");
    }

    private Map<String, Object> fallbackPriority(String text) {
        String lower = text.toLowerCase();

        Complaint.Priority priority;
        double confidence;
        if (containsAny(lower, "danger","urgent","emergency","fire","accident","injury","death","blood","immediate"))  {
            priority = Complaint.Priority.CRITICAL; confidence = 0.90;
        } else if (containsAny(lower, "serious","major","broken","no water","no power","days","week")) {
            priority = Complaint.Priority.HIGH; confidence = 0.75;
        } else if (containsAny(lower, "problem","issue","concern","request","old","minor")) {
            priority = Complaint.Priority.LOW; confidence = 0.70;
        } else {
            priority = Complaint.Priority.MEDIUM; confidence = 0.60;
        }

        return Map.of("priority", priority.name(), "confidence", confidence, "method", "rule-based");
    }

    private boolean containsAny(String text, String... keywords) {
        return Arrays.stream(keywords).anyMatch(text::contains);
    }
}
