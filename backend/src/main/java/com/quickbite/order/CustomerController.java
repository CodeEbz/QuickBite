package com.quickbite.order;

import com.quickbite.restaurant.MenuItem;
import com.quickbite.restaurant.MenuItemRepository;
import com.quickbite.restaurant.Restaurant;
import com.quickbite.restaurant.RestaurantRepository;
import com.quickbite.payment.PaystackService;
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
    private final PaystackService paystackService;

    public CustomerController(RestaurantRepository restaurantRepository,
                              MenuItemRepository menuItemRepository,
                              OrderRepository orderRepository,
                              PaystackService paystackService) {
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
        this.orderRepository = orderRepository;
        this.paystackService = paystackService;
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
        return ResponseEntity.ok(createOrder(principal.getName(), req));
    }

    @PostMapping("/payments/initialize")
    public ResponseEntity<PaystackService.InitializePaymentResponse> initializePayment(
            Principal principal,
            @RequestBody OrderRequest req
    ) {
        validateOrderRequest(req);
        return ResponseEntity.ok(paystackService.initialize(principal.getName(), req.totalPrice()));
    }

    @PostMapping("/payments/verify")
    public ResponseEntity<Order> verifyPaymentAndCreateOrder(
            Principal principal,
            @RequestBody VerifyPaymentRequest req
    ) {
        if (req == null || req.order() == null) {
            throw new RuntimeException("Order details are required.");
        }
        validateOrderRequest(req.order());

        PaystackService.VerifyPaymentResponse verification = paystackService.verify(req.reference());
        long expectedAmount = req.order().totalPrice()
                .multiply(BigDecimal.valueOf(100))
                .setScale(0, java.math.RoundingMode.HALF_UP)
                .longValueExact();
        if (!verification.successful() || !verification.amount().equals(expectedAmount)) {
            throw new RuntimeException("Payment has not been completed for this order.");
        }

        return ResponseEntity.ok(orderRepository.findByPaymentReference(verification.reference())
                .map(existingOrder -> {
                    if (!existingOrder.getCustomerEmail().equals(principal.getName())) {
                        throw new RuntimeException("Access denied. This payment belongs to another account.");
                    }
                    return existingOrder;
                })
                .orElseGet(() -> createOrder(principal.getName(), req.order(), verification.reference(), verification.status())));
    }

    private Order createOrder(String email, OrderRequest req) {
        return createOrder(email, req, null, null);
    }

    private Order createOrder(String email, OrderRequest req, String paymentReference, String paymentStatus) {
        validateOrderRequest(req);

        Restaurant restaurant = restaurantRepository.findById(req.restaurantId())
                .orElseThrow(() -> new RuntimeException("Restaurant not found"));

        Order order = new Order();
        order.setCustomerEmail(email);
        order.setCustomerName(email.substring(0, email.indexOf('@'))); // Fallback username
        order.setRestaurant(restaurant);
        order.setTotalPrice(req.totalPrice());
        order.setStatus(Order.Status.PENDING);
        order.setPaymentReference(paymentReference);
        order.setPaymentStatus(paymentStatus);

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

        return orderRepository.save(order);
    }

    private void validateOrderRequest(OrderRequest req) {
        if (req == null) {
            throw new RuntimeException("Order details are required.");
        }
        if (req.restaurantId() == null) {
            throw new RuntimeException("Restaurant is required.");
        }
        if (req.items() == null || req.items().isEmpty()) {
            throw new RuntimeException("Cart is empty.");
        }
        if (req.totalPrice() == null || req.totalPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Order total must be greater than zero.");
        }
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
    public record VerifyPaymentRequest(String reference, OrderRequest order) {}
}
