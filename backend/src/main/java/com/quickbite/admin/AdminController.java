package com.quickbite.admin;

import com.quickbite.restaurant.Restaurant;
import com.quickbite.restaurant.RestaurantRepository;
import com.quickbite.order.Order;
import com.quickbite.order.OrderRepository;
import com.quickbite.user.User;
import com.quickbite.user.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')") // Restrict to admin users
public class AdminController {

    private final RestaurantRepository restaurantRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public AdminController(RestaurantRepository restaurantRepository,
                           OrderRepository orderRepository,
                           UserRepository userRepository) {
        this.restaurantRepository = restaurantRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    // 1. Fetch system statistics
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getSystemStats() {
        long totalRestaurants = restaurantRepository.count();
        long totalOrders = orderRepository.count();
        long activeDrivers = userRepository.countByRole(User.Role.DRIVER);
        long pendingApprovals = restaurantRepository.findAll().stream()
                .filter(r -> r.getStatus() == Restaurant.Status.PENDING_APPROVAL)
                .count();

        // Calculate total sales
        BigDecimal totalRevenue = orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == Order.Status.DELIVERED)
                .map(Order::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalRevenue", totalRevenue);
        stats.put("totalOrders", totalOrders);
        stats.put("activeDrivers", activeDrivers);
        stats.put("pendingApprovals", pendingApprovals);
        stats.put("totalRestaurants", totalRestaurants);

        return ResponseEntity.ok(stats);
    }

    // 2. Manage Restaurants
    @GetMapping("/restaurants")
    public ResponseEntity<List<Restaurant>> getAllRestaurants() {
        return ResponseEntity.ok(restaurantRepository.findAll());
    }

    @PutMapping("/restaurants/{id}/status")
    public ResponseEntity<Restaurant> updateRestaurantStatus(@PathVariable Long id, @RequestParam Restaurant.Status status) {
        Restaurant restaurant = restaurantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));
        restaurant.setStatus(status);
        return ResponseEntity.ok(restaurantRepository.save(restaurant));
    }

    // 3. Manage Orders
    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(orderRepository.findAll());
    }

    @PutMapping("/orders/{id}/cancel")
    public ResponseEntity<Order> cancelOrder(@PathVariable Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(Order.Status.CANCELLED);
        return ResponseEntity.ok(orderRepository.save(order));
    }

    // 4. Manage Users
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PutMapping("/users/{id}/verify")
    public ResponseEntity<User> toggleUserVerification(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setVerified(!user.isVerified());
        return ResponseEntity.ok(userRepository.save(user));
    }
}
