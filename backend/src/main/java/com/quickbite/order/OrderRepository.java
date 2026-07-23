package com.quickbite.order;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCustomerEmailOrderByCreatedAtDesc(String customerEmail);
    List<Order> findByRestaurantIdOrderByCreatedAtDesc(Long restaurantId);
    List<Order> findByDriverNameOrderByCreatedAtDesc(String driverName);
    List<Order> findByStatusOrderByCreatedAtDesc(Order.Status status);
    Optional<Order> findByPaymentReference(String paymentReference);
}
