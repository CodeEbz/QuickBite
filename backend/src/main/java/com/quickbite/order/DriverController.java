package com.quickbite.order;

import com.quickbite.user.User;
import com.quickbite.user.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/driver")
@PreAuthorize("hasRole('DRIVER')") // Restrict to driver accounts
public class DriverController {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public DriverController(OrderRepository orderRepository, UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    // Helper to get driver name from Principal
    private String getDriverDisplayName(Principal principal) {
        String email = principal.getName();
        return userRepository.findByEmail(email)
                .map(User::getName)
                .orElse(email);
    }

    // 1. Available orders waiting for courier pickup
    @GetMapping("/orders/available")
    public ResponseEntity<List<Order>> getAvailableOrders() {
        List<Order> available = orderRepository.findAll().stream()
                .filter(o -> (o.getDriverName() == null || o.getDriverName().isBlank()) &&
                             (o.getStatus() == Order.Status.PREPARING || o.getStatus() == Order.Status.READY || o.getStatus() == Order.Status.PENDING))
                .toList();
        return ResponseEntity.ok(available);
    }

    // 2. Currently active delivery assigned to the driver
    @GetMapping("/orders/my-active")
    public ResponseEntity<Order> getMyActiveDelivery(Principal principal) {
        String driverName = getDriverDisplayName(principal);
        Order activeOrder = orderRepository.findAll().stream()
                .filter(o -> driverName.equalsIgnoreCase(o.getDriverName()) && o.getStatus() == Order.Status.DELIVERING)
                .findFirst()
                .orElse(null);
        return ResponseEntity.ok(activeOrder);
    }

    @GetMapping("/orders/history")
    public ResponseEntity<List<Order>> getMyDeliveryHistory(Principal principal) {
        String driverName = getDriverDisplayName(principal);
        List<Order> history = orderRepository.findByDriverNameOrderByCreatedAtDesc(driverName);
        return ResponseEntity.ok(history);
    }

    // 3. Accept job offer
    @PutMapping("/orders/{id}/accept")
    public ResponseEntity<Order> acceptOrder(Principal principal, @PathVariable Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (order.getDriverName() != null && !order.getDriverName().isBlank()) {
            throw new RuntimeException("This delivery has already been accepted by another courier.");
        }

        String driverName = getDriverDisplayName(principal);
        order.setDriverName(driverName);
        order.setStatus(Order.Status.DELIVERING);

        return ResponseEntity.ok(orderRepository.save(order));
    }

    // 4. Mark delivery as complete upon arrival
    @PutMapping("/orders/{id}/complete")
    public ResponseEntity<Order> completeDelivery(Principal principal, @PathVariable Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        String driverName = getDriverDisplayName(principal);
        if (!driverName.equalsIgnoreCase(order.getDriverName())) {
            throw new RuntimeException("Access denied. You are not assigned to this delivery.");
        }

        order.setStatus(Order.Status.DELIVERED);
        return ResponseEntity.ok(orderRepository.save(order));
    }
}
