package com.quickbite.chat;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByCustomerEmailOrderByCreatedAtAsc(String customerEmail);
    List<ChatMessage> findByRestaurantIdOrderByCreatedAtAsc(Long restaurantId);
    List<ChatMessage> findByRestaurantIdAndCustomerEmailOrderByCreatedAtAsc(Long restaurantId, String customerEmail);
}
