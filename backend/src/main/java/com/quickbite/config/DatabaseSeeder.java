package com.quickbite.config;

import com.quickbite.restaurant.MenuItem;
import com.quickbite.restaurant.MenuItemRepository;
import com.quickbite.restaurant.Restaurant;
import com.quickbite.restaurant.RestaurantRepository;
import com.quickbite.order.Order;
import com.quickbite.order.OrderItem;
import com.quickbite.order.OrderRepository;
import com.quickbite.user.User;
import com.quickbite.user.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseSeeder(RestaurantRepository restaurantRepository,
                          MenuItemRepository menuItemRepository,
                          OrderRepository orderRepository,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder) {
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Always ensure merchant user accounts exist in the users table
        seedMerchantUsers();

        if (restaurantRepository.count() == 0) {
            seedDatabase();
        }
    }

    private void seedMerchantUsers() {
        seedUser("John Smith", "john@burgerpalace.com", User.Role.RESTAURANT);
        seedUser("Marco Rossi", "marco@pizzadiroma.com", User.Role.RESTAURANT);
        seedUser("Yuki Tanaka", "yuki@sushizen.com", User.Role.RESTAURANT);
        seedUser("Laura Vance", "laura@gourmetgrill.com", User.Role.RESTAURANT);
        seedUser("David Miller", "david@driver.com", User.Role.DRIVER);
    }

    private void seedUser(String name, String email, User.Role role) {
        if (!userRepository.existsByEmail(email)) {
            User user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode("AdminPassword2026!"));
            user.setRole(role);
            user.setVerified(true);
            userRepository.save(user);
            System.out.println("Seeded user account (" + role + "): " + email);
        }
    }

    private void seedDatabase() {
        System.out.println("Seeding database with default restaurants, menu items, and orders...");

        // 1. Seed Restaurants
        Restaurant r1 = new Restaurant();
        r1.setName("Burger Palace");
        r1.setEmail("john@burgerpalace.com");
        r1.setOwnerName("John Smith");
        r1.setStatus(Restaurant.Status.ACTIVE);
        r1.setRating(4.8);
        r1.setCuisineType("Burgers & American");
        r1.setImage("https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400");
        restaurantRepository.save(r1);

        Restaurant r2 = new Restaurant();
        r2.setName("Pizza Di Roma");
        r2.setEmail("marco@pizzadiroma.com");
        r2.setOwnerName("Marco Rossi");
        r2.setStatus(Restaurant.Status.ACTIVE);
        r2.setRating(4.7);
        r2.setCuisineType("Pizza & Italian");
        r2.setImage("https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400");
        restaurantRepository.save(r2);

        Restaurant r3 = new Restaurant();
        r3.setName("Sushi Zen");
        r3.setEmail("yuki@sushizen.com");
        r3.setOwnerName("Yuki Tanaka");
        r3.setStatus(Restaurant.Status.ACTIVE);
        r3.setRating(4.9);
        r3.setCuisineType("Sushi & Japanese");
        r3.setImage("https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400");
        restaurantRepository.save(r3);

        Restaurant r4 = new Restaurant();
        r4.setName("Gourmet Grill");
        r4.setEmail("laura@gourmetgrill.com");
        r4.setOwnerName("Laura Vance");
        r4.setStatus(Restaurant.Status.PENDING_APPROVAL);
        r4.setRating(0.0);
        r4.setCuisineType("Grill & Steakhouse");
        r4.setImage("https://images.unsplash.com/photo-1544025162-d76694265947?w=400");
        restaurantRepository.save(r4);

        // 2. Seed Menu Items
        seedMenuItem(r1, "Cheese Burger", "Juicy beef patty, cheddar, lettuce, tomato, house sauce", new BigDecimal("10.50"), "Burgers");
        seedMenuItem(r1, "Veggie Burger", "Plant-based patty, avocado, lettuce, vegan mayo", new BigDecimal("9.50"), "Burgers");
        seedMenuItem(r1, "French Fries", "Crispy golden sea-salted potato fries", new BigDecimal("4.00"), "Desserts");

        seedMenuItem(r2, "Spicy Pepperoni Pizza", "Italian pepperoni, mozzarella, chili flakes, tomato sauce", new BigDecimal("14.90"), "Pizza");
        seedMenuItem(r2, "Margherita Pizza", "Fresh mozzarella, basil leaves, extra virgin olive oil", new BigDecimal("12.90"), "Pizza");
        seedMenuItem(r2, "Soda Can", "Chilled 330ml can of soda", new BigDecimal("2.50"), "Drinks");

        seedMenuItem(r3, "Salmon Nigiri (4pcs)", "Premium fresh salmon over seasoned rice", new BigDecimal("12.00"), "Asian");
        seedMenuItem(r3, "California Roll (8pcs)", "Crab stick, avocado, cucumber, sesame seeds", new BigDecimal("9.00"), "Asian");

        // 3. Seed Orders
        Order o1 = new Order();
        o1.setCustomerName("Sarah Jenkins");
        o1.setCustomerEmail("sarah@gmail.com");
        o1.setRestaurant(r1);
        o1.setDriverName("David Miller");
        o1.setStatus(Order.Status.DELIVERED);
        o1.setTotalPrice(new BigDecimal("25.00"));
        orderRepository.save(o1);

        seedOrderItem(o1, "Cheese Burger", 2, new BigDecimal("10.50"));
        seedOrderItem(o1, "French Fries", 1, new BigDecimal("4.00"));

        Order o2 = new Order();
        o2.setCustomerName("Michael Chang");
        o2.setCustomerEmail("michael@gmail.com");
        o2.setRestaurant(r2);
        o2.setDriverName("Jessica Taylor");
        o2.setStatus(Order.Status.PREPARING);
        o2.setTotalPrice(new BigDecimal("19.90"));
        orderRepository.save(o2);

        seedOrderItem(o2, "Spicy Pepperoni Pizza", 1, new BigDecimal("14.90"));
        seedOrderItem(o2, "Soda Can", 2, new BigDecimal("2.50"));

        System.out.println("Database seeding finished.");
    }

    private void seedMenuItem(Restaurant res, String name, String desc, BigDecimal price, String category) {
        MenuItem item = new MenuItem();
        item.setRestaurant(res);
        item.setName(name);
        item.setDescription(desc);
        item.setPrice(price);
        item.setImage("https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100");
        item.setCategory(category);
        menuItemRepository.save(item);
    }

    private void seedOrderItem(Order order, String name, int qty, BigDecimal price) {
        OrderItem item = new OrderItem();
        item.setOrder(order);
        item.setItemName(name);
        item.setQuantity(qty);
        item.setPrice(price);
        order.getItems().add(item);
        orderRepository.save(order);
    }
}
