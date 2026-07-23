package com.quickbite.upload;

import jakarta.servlet.http.HttpServletRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class FileUploadService {

    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private final Path uploadRoot;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();
    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;

    public FileUploadService(@Value("${quickbite.upload-dir:uploads}") String uploadDir,
                             @Value("${cloudinary.cloud-name:}") String cloudName,
                             @Value("${cloudinary.api-key:}") String apiKey,
                             @Value("${cloudinary.api-secret:}") String apiSecret,
                             ObjectMapper objectMapper) {
        this.uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.cloudName = cloudName;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.objectMapper = objectMapper;
    }

    public String storeImage(MultipartFile file, String folder, HttpServletRequest request) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Image file is required.");
        }
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new RuntimeException("Only JPG, PNG, and WEBP images are supported.");
        }
        if (isCloudinaryConfigured()) {
            return uploadToCloudinary(file, folder);
        }

        String extension = extensionFor(file);
        String filename = UUID.randomUUID() + extension;
        Path targetDirectory = uploadRoot.resolve(folder).normalize();
        Path target = targetDirectory.resolve(filename).normalize();

        if (!target.startsWith(uploadRoot)) {
            throw new RuntimeException("Invalid upload path.");
        }

        try {
            Files.createDirectories(targetDirectory);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new RuntimeException("Unable to save image. Please try again.");
        }

        String path = "/uploads/" + folder + "/" + filename;
        return ServletUriComponentsBuilder.fromRequestUri(request)
                .replacePath(path)
                .replaceQuery(null)
                .build()
                .toUriString();
    }

    private boolean isCloudinaryConfigured() {
        return cloudName != null && !cloudName.isBlank()
                && apiKey != null && !apiKey.isBlank()
                && apiSecret != null && !apiSecret.isBlank();
    }

    private String uploadToCloudinary(MultipartFile file, String folder) {
        try {
            long timestamp = Instant.now().getEpochSecond();
            String cloudFolder = "quickbite/" + folder;
            String signaturePayload = "folder=" + cloudFolder + "&timestamp=" + timestamp + apiSecret;
            String signature = sha1(signaturePayload);
            String boundary = "QuickBiteBoundary" + UUID.randomUUID();

            ByteArrayOutputStream body = new ByteArrayOutputStream();
            writePart(body, boundary, "api_key", apiKey);
            writePart(body, boundary, "timestamp", String.valueOf(timestamp));
            writePart(body, boundary, "folder", cloudFolder);
            writePart(body, boundary, "signature", signature);
            writeFilePart(body, boundary, "file", file);
            body.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload"))
                    .timeout(Duration.ofSeconds(40))
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(body.toByteArray()))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode root = objectMapper.readTree(response.body());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new RuntimeException(root.path("error").path("message").asText("Cloudinary upload failed."));
            }

            String secureUrl = root.path("secure_url").asText();
            if (secureUrl == null || secureUrl.isBlank()) {
                throw new RuntimeException("Cloudinary upload did not return an image URL.");
            }
            return secureUrl;
        } catch (RuntimeException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new RuntimeException("Unable to upload image to Cloudinary. Please try again.");
        }
    }

    private void writePart(ByteArrayOutputStream body, String boundary, String name, String value) throws IOException {
        body.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        body.write(("Content-Disposition: form-data; name=\"" + name + "\"\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        body.write((value + "\r\n").getBytes(StandardCharsets.UTF_8));
    }

    private void writeFilePart(ByteArrayOutputStream body, String boundary, String name, MultipartFile file) throws IOException {
        String filename = file.getOriginalFilename() == null || file.getOriginalFilename().isBlank()
                ? UUID.randomUUID() + extensionFor(file)
                : file.getOriginalFilename();
        body.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        body.write(("Content-Disposition: form-data; name=\"" + name + "\"; filename=\"" + filename + "\"\r\n").getBytes(StandardCharsets.UTF_8));
        body.write(("Content-Type: " + file.getContentType() + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        body.write(file.getBytes());
        body.write("\r\n".getBytes(StandardCharsets.UTF_8));
    }

    private String sha1(String value) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-1");
        return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
    }

    private String extensionFor(MultipartFile file) {
        String originalName = file.getOriginalFilename();
        if (originalName != null && originalName.contains(".")) {
            String ext = originalName.substring(originalName.lastIndexOf('.')).toLowerCase(Locale.ROOT);
            if (ext.equals(".jpg") || ext.equals(".jpeg") || ext.equals(".png") || ext.equals(".webp")) {
                return ext;
            }
        }
        return switch (file.getContentType()) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }
}
