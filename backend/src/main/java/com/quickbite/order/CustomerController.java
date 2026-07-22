package com.quickbite.order;

import com.quickbite.restaurant.MenuItem;
import com.quickbite.restaurant.MenuItemRepository;
import com.quickbite.restaurant.Restaurant;
import com.quickbite.restaurant.RestaurantRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer")
@PreAuthorize("hasRole('CUSTOMER')") // Restrict to customer users
public class CustomerController {

    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final OrderRepository orderRepository;

    public CustomerController(RestaurantRepository restaurantRepository,
                              MenuItemRepository menuItemRepository,
                              OrderRepository orderRepository) {
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
        this.orderRepository = orderRepository;
    }

    // 1. Browse Catalog (Restaurants & Menus)
    @GetMapping("/restaurants")
    public ResponseEntity<List<Restaurant>> getActiveRestaurants() {
        // Return only active restaurants
        List<Restaurant> active = restaurantRepository.findAll().stream()
                .filter(r -> r.getStatus() == Restaurant.Status.ACTIVE)
                .toList();
        return ResponseEntity.ok(active);
    }

    @GetMapping("/restaurants/{id}/menu")
    public ResponseEntity<List<MenuItem>> getRestaurantMenu(@PathVariable Long id) {
        return ResponseEntity.ok(menuItemRepository.findByRestaurantId(id));
    }

    // 2. Cart & Checkout (Place Order)
    @PostMapping("/orders")
    public ResponseEntity<Order> placeOrder(Principal principal, @RequestBody OrderRequest req) {
        String email = principal.getName();
        
        Restaurant restaurant = restaurantRepository.findById(req.restaurantId())
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        Order order = new Order();
        order.setCustomerEmail(email);
        order.setCustomerName(email.substring(0, email.indexOf('@'))); // Fallback username
        order.setRestaurant(restaurant);
        order.setTotalPrice(req.totalPrice());
        order.setStatus(Order.Status.PENDING);

        List<OrderItem> items = new ArrayList<>();
        for (OrderItemRequest itemReq : req.items()) {
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setItemName(itemReq.itemName());
            item.setQuantity(itemReq.quantity());
            item.setPrice(itemReq.price());
            items.add(item);
        }
        order.setItems(items);

        return ResponseEntity.ok(orderRepository.save(order));
    }

    // 3. Order History & Status
    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getMyOrders(Principal principal) {
        String email = principal.getName();
        return ResponseEntity.ok(orderRepository.findByCustomerEmailOrderByCreatedAtDesc(email));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<Order> getOrderDetails(Principal principal, @PathVariable Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getCustomerEmail().equals(principal.getName())) {
            throw new RuntimeException("Access denied. You do not own this order.");
        }

        return ResponseEntity.ok(order);
    }

    // Helper records for requests
    public record OrderRequest(Long restaurantId, List<OrderItemRequest> items, BigDecimal totalPrice) {}
    public record OrderItemRequest(String itemName, Integer quantity, BigDecimal price) {}
}
