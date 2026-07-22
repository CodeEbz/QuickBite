package com.quickbite.restaurant;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
    Optional<Restaurant> findByEmail(String email);
    boolean existsByEmail(String email);
}
