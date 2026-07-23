package com.quickbite.chat;

import com.quickbite.restaurant.Restaurant;
import com.quickbite.restaurant.RestaurantRepository;
import com.quickbite.upload.FileUploadService;
import com.quickbite.user.User;
import com.quickbite.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatMessageRepository chatMessageRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;
    private final FileUploadService fileUploadService;

    public ChatController(ChatMessageRepository chatMessageRepository,
                          RestaurantRepository restaurantRepository,
                          UserRepository userRepository,
                          FileUploadService fileUploadService) {
        this.chatMessageRepository = chatMessageRepository;
        this.restaurantRepository = restaurantRepository;
        this.userRepository = userRepository;
        this.fileUploadService = fileUploadService;
    }

    @GetMapping("/customer")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<ChatMessage>> getCustomerMessages(Principal principal) {
        return ResponseEntity.ok(chatMessageRepository.findByCustomerEmailOrderByCreatedAtAsc(principal.getName()));
    }

    @GetMapping("/customer/restaurants/{restaurantId}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<ChatMessage>> getCustomerRestaurantMessages(Principal principal, @PathVariable Long restaurantId) {
        return ResponseEntity.ok(chatMessageRepository.findByRestaurantIdAndCustomerEmailOrderByCreatedAtAsc(restaurantId, principal.getName()));
    }

    @PostMapping(value = "/customer/restaurants/{restaurantId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ChatMessage> sendCustomerMessage(
            Principal principal,
            @PathVariable Long restaurantId,
            @RequestParam(value = "message", required = false) String message,
            @RequestParam(value = "file", required = false) MultipartFile file,
            HttpServletRequest request
    ) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(saveMessage(restaurant, user.getEmail(), user.getName(), "CUSTOMER", message, file, request));
    }

    @GetMapping("/merchant")
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<List<ChatMessage>> getMerchantMessages(Principal principal) {
        Restaurant restaurant = restaurantRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));
        return ResponseEntity.ok(chatMessageRepository.findByRestaurantIdOrderByCreatedAtAsc(restaurant.getId()));
    }

    @PostMapping(value = "/merchant/customers/{customerEmail}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('RESTAURANT')")
    public ResponseEntity<ChatMessage> sendMerchantMessage(
            Principal principal,
            @PathVariable String customerEmail,
            @RequestParam(value = "message", required = false) String message,
            @RequestParam(value = "file", required = false) MultipartFile file,
            HttpServletRequest request
    ) {
        Restaurant restaurant = restaurantRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        return ResponseEntity.ok(saveMessage(restaurant, customer.getEmail(), customer.getName(), "MERCHANT", message, file, request));
    }

    private ChatMessage saveMessage(Restaurant restaurant,
                                    String customerEmail,
                                    String customerName,
                                    String senderRole,
                                    String message,
                                    MultipartFile file,
                                    HttpServletRequest request) {
        if ((message == null || message.isBlank()) && (file == null || file.isEmpty())) {
            throw new RuntimeException("Send a message or attach an image.");
        }

        ChatMessage chat = new ChatMessage();
        chat.setRestaurant(restaurant);
        chat.setCustomerEmail(customerEmail);
        chat.setCustomerName(customerName);
        chat.setSenderRole(senderRole);
        chat.setMessage(message == null ? "" : message.trim());
        if (file != null && !file.isEmpty()) {
            chat.setImageUrl(fileUploadService.storeImage(file, "chat", request));
        }
        return chatMessageRepository.save(chat);
    }
}
