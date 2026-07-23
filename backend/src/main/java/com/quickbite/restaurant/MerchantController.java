package com.quickbite.restaurant;

import com.quickbite.order.Order;
import com.quickbite.order.OrderRepository;
import com.quickbite.upload.FileUploadService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/merchant")
@PreAuthorize("hasRole('RESTAURANT')") // Restrict to restaurant owners
public class MerchantController {

    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final OrderRepository orderRepository;
    private final FileUploadService fileUploadService;

    public MerchantController(RestaurantRepository restaurantRepository,
                              MenuItemRepository menuItemRepository,
                              OrderRepository orderRepository,
                              FileUploadService fileUploadService) {
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
        this.orderRepository = orderRepository;
        this.fileUploadService = fileUploadService;
    }

    // Helper to get restaurant by logged-in merchant email
    private Restaurant getMyRestaurant(Principal principal) {
        String email = principal.getName();
        return restaurantRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No restaurant profile associated with this account email: " + email));
    }

    // 1. Get Restaurant details
    @GetMapping("/profile")
    public ResponseEntity<Restaurant> getProfile(Principal principal) {
        return ResponseEntity.ok(getMyRestaurant(principal));
    }

    @PutMapping("/profile")
    public ResponseEntity<Restaurant> updateProfile(Principal principal, @RequestBody Restaurant updateData) {
        Restaurant restaurant = getMyRestaurant(principal);
        restaurant.setName(updateData.getName());
        restaurant.setCuisineType(updateData.getCuisineType());
        restaurant.setImage(updateData.getImage());
        return ResponseEntity.ok(restaurantRepository.save(restaurant));
    }

    @PostMapping(value = "/profile/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Restaurant> uploadRestaurantImage(
            Principal principal,
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request
    ) {
        Restaurant restaurant = getMyRestaurant(principal);
        restaurant.setImage(fileUploadService.storeImage(file, "restaurants", request));
        return ResponseEntity.ok(restaurantRepository.save(restaurant));
    }

    // 2. Menu Item CRUD
    @GetMapping("/menu")
    public ResponseEntity<List<MenuItem>> getMenu(Principal principal) {
        Restaurant restaurant = getMyRestaurant(principal);
        return ResponseEntity.ok(menuItemRepository.findByRestaurantId(restaurant.getId()));
    }

    @PostMapping("/menu")
    public ResponseEntity<MenuItem> createMenuItem(Principal principal, @RequestBody MenuItem item) {
        Restaurant restaurant = getMyRestaurant(principal);
        item.setRestaurant(restaurant);
        return ResponseEntity.ok(menuItemRepository.save(item));
    }

    @PostMapping(value = "/menu/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ImageUploadResponse> uploadMenuImage(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request
    ) {
        return ResponseEntity.ok(new ImageUploadResponse(fileUploadService.storeImage(file, "menu", request)));
    }

    @PostMapping(value = "/menu/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MenuItem> uploadMenuItemImage(
            Principal principal,
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request
    ) {
        Restaurant restaurant = getMyRestaurant(principal);
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Menu item not found"));

        if (!item.getRestaurant().getId().equals(restaurant.getId())) {
            throw new RuntimeException("Access denied. You do not own this menu item.");
        }

        item.setImage(fileUploadService.storeImage(file, "menu", request));
        return ResponseEntity.ok(menuItemRepository.save(item));
    }

    @PutMapping("/menu/{id}")
    public ResponseEntity<MenuItem> updateMenuItem(Principal principal, @PathVariable Long id, @RequestBody MenuItem updateData) {
        Restaurant restaurant = getMyRestaurant(principal);
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Menu item not found"));

        if (!item.getRestaurant().getId().equals(restaurant.getId())) {
            throw new RuntimeException("Access denied. You do not own this menu item.");
        }

        item.setName(updateData.getName());
        item.setDescription(updateData.getDescription());
        item.setPrice(updateData.getPrice());
        item.setCategory(updateData.getCategory());
        item.setImage(updateData.getImage());

        return ResponseEntity.ok(menuItemRepository.save(item));
    }

    @DeleteMapping("/menu/{id}")
    public ResponseEntity<String> deleteMenuItem(Principal principal, @PathVariable Long id) {
        Restaurant restaurant = getMyRestaurant(principal);
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Menu item not found"));

        if (!item.getRestaurant().getId().equals(restaurant.getId())) {
            throw new RuntimeException("Access denied. You do not own this menu item.");
        }

        menuItemRepository.delete(item);
        return ResponseEntity.ok("Menu item deleted successfully");
    }

    // 3. Order Processing
    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getOrders(Principal principal) {
        Restaurant restaurant = getMyRestaurant(principal);
        return ResponseEntity.ok(orderRepository.findByRestaurantIdOrderByCreatedAtDesc(restaurant.getId()));
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(Principal principal, @PathVariable Long id, @RequestParam Order.Status status) {
        Restaurant restaurant = getMyRestaurant(principal);
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getRestaurant().getId().equals(restaurant.getId())) {
            throw new RuntimeException("Access denied. This order was not placed at your restaurant.");
        }

        order.setStatus(status);
        return ResponseEntity.ok(orderRepository.save(order));
    }

    public record ImageUploadResponse(String imageUrl) {}
}
