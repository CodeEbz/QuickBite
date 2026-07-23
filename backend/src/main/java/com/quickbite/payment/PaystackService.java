package com.quickbite.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;

@Service
public class PaystackService {

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final ObjectMapper objectMapper;
    private final String secretKey;
    private final String baseUrl;
    private final String currency;

    public PaystackService(ObjectMapper objectMapper,
                           @Value("${paystack.secret-key:}") String secretKey,
                           @Value("${paystack.base-url:https://api.paystack.co}") String baseUrl,
                           @Value("${paystack.currency:NGN}") String currency) {
        this.objectMapper = objectMapper;
        this.secretKey = secretKey;
        this.baseUrl = trimTrailingSlash(baseUrl);
        this.currency = currency;
    }

    public InitializePaymentResponse initialize(String email, BigDecimal amount, String callbackUrl) {
        ensureConfigured();

        long amountInSubunits = toSubunits(amount);
        String reference = "QB-" + UUID.randomUUID().toString().replace("-", "");

        try {
            Map<String, Object> payloadData = new HashMap<>();
            payloadData.put("email", email);
            payloadData.put("amount", amountInSubunits);
            payloadData.put("reference", reference);
            payloadData.put("currency", currency);
            if (callbackUrl != null && !callbackUrl.isBlank()) {
                payloadData.put("callback_url", callbackUrl);
            }
            String payload = objectMapper.writeValueAsString(payloadData);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/transaction/initialize"))
                    .timeout(Duration.ofSeconds(20))
                    .header("Authorization", "Bearer " + secretKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode root = objectMapper.readTree(response.body());
            if (response.statusCode() < 200 || response.statusCode() >= 300 || !root.path("status").asBoolean(false)) {
                throw new RuntimeException(root.path("message").asText("Unable to initialize Paystack payment."));
            }

            JsonNode data = root.path("data");
            return new InitializePaymentResponse(
                    data.path("authorization_url").asText(),
                    data.path("access_code").asText(),
                    data.path("reference").asText(reference),
                    amountInSubunits,
                    currency
            );
        } catch (RuntimeException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new RuntimeException("Unable to initialize Paystack payment. Please try again.");
        }
    }

    public VerifyPaymentResponse verify(String reference) {
        ensureConfigured();
        if (reference == null || reference.isBlank()) {
            throw new RuntimeException("Payment reference is required.");
        }

        try {
            String encodedReference = URLEncoder.encode(reference, StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/transaction/verify/" + encodedReference))
                    .timeout(Duration.ofSeconds(20))
                    .header("Authorization", "Bearer " + secretKey)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode root = objectMapper.readTree(response.body());
            if (response.statusCode() < 200 || response.statusCode() >= 300 || !root.path("status").asBoolean(false)) {
                throw new RuntimeException(root.path("message").asText("Unable to verify Paystack payment."));
            }

            JsonNode data = root.path("data");
            String status = data.path("status").asText();
            long paidAmount = data.path("amount").asLong(0);
            return new VerifyPaymentResponse("success".equalsIgnoreCase(status), status, paidAmount, data.path("reference").asText(reference));
        } catch (RuntimeException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new RuntimeException("Unable to verify Paystack payment. Please try again.");
        }
    }

    private void ensureConfigured() {
        if (secretKey == null || secretKey.isBlank()) {
            throw new RuntimeException("Paystack is not configured. Set PAYSTACK_SECRET_KEY on the backend.");
        }
    }

    private long toSubunits(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Payment amount must be greater than zero.");
        }
        return amount.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();
    }

    private String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "https://api.paystack.co";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    public record InitializePaymentResponse(String authorizationUrl, String accessCode, String reference, Long amount, String currency) {}
    public record VerifyPaymentResponse(boolean successful, String status, Long amount, String reference) {}
}
