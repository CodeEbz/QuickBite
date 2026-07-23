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
        // Always ensure documented demo user accounts exist in the users table.
        seedDemoUsers();
        seedDemoRestaurantsAndMenus();
        seedStarterOrders();
    }

    private void seedDemoUsers() {
        seedUser("QuickBite Admin", "admin@quickbite.com", User.Role.ADMIN, "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=240");

        seedUser("Sarah Jenkins", "sarah@gmail.com", User.Role.CUSTOMER, "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240");
        seedUser("Maya Okafor", "maya@quickbite.com", User.Role.CUSTOMER, "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=240");
        seedUser("Noah Bennett", "noah@quickbite.com", User.Role.CUSTOMER, "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240");
        seedUser("Ava Chen", "ava@quickbite.com", User.Role.CUSTOMER, "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=240");

        seedUser("John Smith", "john@burgerpalace.com", User.Role.RESTAURANT, "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=240");
        seedUser("Marco Rossi", "marco@pizzadiroma.com", User.Role.RESTAURANT, "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=240");
        seedUser("Yuki Tanaka", "yuki@sushizen.com", User.Role.RESTAURANT, "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=240");
        seedUser("Laura Vance", "laura@gourmetgrill.com", User.Role.RESTAURANT, "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=240");
        seedUser("Amara Cole", "amara@sweetcrate.com", User.Role.RESTAURANT, "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=240");
        seedUser("Ravi Patel", "ravi@spicebowl.com", User.Role.RESTAURANT, "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=240");
        seedUser("Nina Brooks", "nina@freshpress.com", User.Role.RESTAURANT, "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240");

        seedUser("David Miller", "david@driver.com", User.Role.DRIVER, "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=240");
        seedUser("Jessica Taylor", "jessica@driver.com", User.Role.DRIVER, "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240");
        seedUser("Omar Reed", "omar@driver.com", User.Role.DRIVER, "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=240");
        seedUser("Lena Wright", "lena@driver.com", User.Role.DRIVER, "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240");
    }

    private void seedUser(String name, String email, User.Role role, String profileImage) {
        User user = userRepository.findByEmail(email).orElseGet(User::new);
        boolean isNew = user.getId() == null;

        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode("AdminPassword2026!"));
        user.setRole(role);
        user.setVerified(true);
        user.setOtp(null);
        user.setOtpExpiry(null);
        user.setProfileImage(profileImage);
        userRepository.save(user);

        String action = isNew ? "Seeded" : "Updated";
        System.out.println(action + " demo user account (" + role + "): " + email);
    }

    private void seedDemoRestaurantsAndMenus() {
        Restaurant r1 = seedRestaurant("Burger Palace", "john@burgerpalace.com", "John Smith", Restaurant.Status.ACTIVE, 4.8, "Burgers & American", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600");
        Restaurant r2 = seedRestaurant("Pizza Di Roma", "marco@pizzadiroma.com", "Marco Rossi", Restaurant.Status.ACTIVE, 4.7, "Pizza & Italian", "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600");
        Restaurant r3 = seedRestaurant("Sushi Zen", "yuki@sushizen.com", "Yuki Tanaka", Restaurant.Status.ACTIVE, 4.9, "Asian & Japanese", "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600");
        Restaurant r4 = seedRestaurant("Gourmet Grill", "laura@gourmetgrill.com", "Laura Vance", Restaurant.Status.PENDING_APPROVAL, 0.0, "Grill & Steakhouse", "https://images.unsplash.com/photo-1544025162-d76694265947?w=600");
        Restaurant r5 = seedRestaurant("Sweet Crate", "amara@sweetcrate.com", "Amara Cole", Restaurant.Status.ACTIVE, 4.6, "Desserts & Bakery", "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600");
        Restaurant r6 = seedRestaurant("Spice Bowl", "ravi@spicebowl.com", "Ravi Patel", Restaurant.Status.ACTIVE, 4.8, "Asian & Indian", "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600");
        Restaurant r7 = seedRestaurant("Fresh Press", "nina@freshpress.com", "Nina Brooks", Restaurant.Status.ACTIVE, 4.5, "Drinks & Smoothies", "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600");

        seedMenuIfEmpty(r1, new Object[][]{
                {"Cheese Burger", "Juicy beef patty, cheddar, lettuce, tomato, house sauce", "10.50", "Burgers", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300"},
                {"Veggie Burger", "Plant-based patty, avocado, lettuce, vegan mayo", "9.50", "Burgers", "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=300"},
                {"French Fries", "Crispy golden sea-salted potato fries", "4.00", "Desserts", "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=300"},
                {"Chocolate Milkshake", "Thick vanilla ice cream blended with cocoa and cream", "5.50", "Drinks", "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=300"},
        });
        seedMenuIfEmpty(r2, new Object[][]{
                {"Spicy Pepperoni Pizza", "Italian pepperoni, mozzarella, chili flakes, tomato sauce", "14.90", "Pizza", "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=300"},
                {"Margherita Pizza", "Fresh mozzarella, basil leaves, extra virgin olive oil", "12.90", "Pizza", "https://images.unsplash.com/photo-1598023696416-0193a0bcd302?w=300"},
                {"Tiramisu Cup", "Espresso-soaked ladyfingers, mascarpone cream, cocoa", "6.00", "Desserts", "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300"},
                {"Sparkling Lemonade", "Chilled citrus soda with fresh lemon", "3.25", "Drinks", "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=300"},
        });
        seedMenuIfEmpty(r3, new Object[][]{
                {"Salmon Nigiri (4pcs)", "Premium fresh salmon over seasoned rice", "12.00", "Asian", "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=300"},
                {"California Roll (8pcs)", "Crab stick, avocado, cucumber, sesame seeds", "9.00", "Asian", "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=300"},
                {"Miso Soup", "Warm soybean broth with tofu, wakame, and scallions", "4.50", "Asian", "https://images.unsplash.com/photo-1607301406259-dfb186e15de8?w=300"},
                {"Iced Matcha Latte", "Ceremonial matcha over milk and ice", "5.25", "Drinks", "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=300"},
        });
        seedMenuIfEmpty(r4, new Object[][]{
                {"Ribeye Steak", "Char-grilled ribeye with herb butter", "24.00", "Grill", "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300"},
                {"Smoked Chicken", "Slow-smoked chicken with pepper glaze", "16.50", "Grill", "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=300"},
        });
        seedMenuIfEmpty(r5, new Object[][]{
                {"Strawberry Cheesecake", "Creamy cheesecake with strawberry compote", "7.25", "Desserts", "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=300"},
                {"Triple Chocolate Brownie", "Dense cocoa brownie with ganache", "5.75", "Desserts", "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300"},
                {"Vanilla Cold Brew", "Cold brew coffee with vanilla cream", "4.95", "Drinks", "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=300"},
        });
        seedMenuIfEmpty(r6, new Object[][]{
                {"Butter Chicken Bowl", "Tomato cream curry, basmati rice, pickled onions", "13.75", "Asian", "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300"},
                {"Paneer Tikka Wrap", "Charred paneer, mint chutney, crunchy salad", "10.25", "Asian", "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300"},
                {"Mango Lassi", "Chilled yogurt drink with ripe mango", "4.50", "Drinks", "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=300"},
        });
        seedMenuIfEmpty(r7, new Object[][]{
                {"Green Glow Smoothie", "Spinach, pineapple, banana, ginger", "6.75", "Drinks", "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=300"},
                {"Berry Protein Shake", "Mixed berries, yogurt, whey, almond milk", "7.25", "Drinks", "https://images.unsplash.com/photo-1553787499-6f9133860278?w=300"},
                {"Citrus Fruit Cup", "Orange, melon, grapes, and mint", "5.50", "Desserts", "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=300"},
        });
    }

    private void seedStarterOrders() {
        if (orderRepository.count() > 0) {
            return;
        }

        Restaurant r1 = restaurantRepository.findByEmail("john@burgerpalace.com").orElseThrow();
        Restaurant r2 = restaurantRepository.findByEmail("marco@pizzadiroma.com").orElseThrow();

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

    private Restaurant seedRestaurant(String name, String email, String ownerName, Restaurant.Status status, double rating, String cuisineType, String image) {
        Restaurant restaurant = restaurantRepository.findByEmail(email).orElseGet(Restaurant::new);
        restaurant.setName(name);
        restaurant.setEmail(email);
        restaurant.setOwnerName(ownerName);
        restaurant.setStatus(status);
        restaurant.setRating(rating);
        restaurant.setCuisineType(cuisineType);
        restaurant.setImage(image);
        return restaurantRepository.save(restaurant);
    }

    private void seedMenuIfEmpty(Restaurant restaurant, Object[][] items) {
        if (!menuItemRepository.findByRestaurantId(restaurant.getId()).isEmpty()) {
            return;
        }

        for (Object[] item : items) {
            seedMenuItem(
                    restaurant,
                    (String) item[0],
                    (String) item[1],
                    new BigDecimal((String) item[2]),
                    (String) item[3],
                    (String) item[4]
            );
        }
    }

    private void seedMenuItem(Restaurant res, String name, String desc, BigDecimal price, String category, String image) {
        MenuItem item = new MenuItem();
        item.setRestaurant(res);
        item.setName(name);
        item.setDescription(desc);
        item.setPrice(price);
        item.setImage(image);
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
