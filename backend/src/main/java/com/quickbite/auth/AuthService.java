package com.quickbite.auth;

import com.quickbite.restaurant.Restaurant;
import com.quickbite.restaurant.RestaurantRepository;
import com.quickbite.user.User;
import com.quickbite.user.UserRepository;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final JavaMailSender mailSender;
    private final boolean autoVerifySignups;

    public AuthService(UserRepository userRepository, RestaurantRepository restaurantRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       JavaMailSender mailSender,
                       @Value("${auth.auto-verify-signups:false}") boolean autoVerifySignups) {
        this.userRepository = userRepository;
        this.restaurantRepository = restaurantRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.mailSender = mailSender;
        this.autoVerifySignups = autoVerifySignups;
    }

    public AuthDtos.RegisterResponse register(AuthDtos.RegisterRequest req) {
        if (userRepository.existsByEmail(req.email()))
            throw new RuntimeException("Email already in use");

        User.Role requestedRole = User.Role.valueOf(req.role().toUpperCase());
        if (requestedRole == User.Role.ADMIN) {
            throw new RuntimeException("Admin accounts cannot be created from public signup.");
        }
        if (requestedRole == User.Role.RESTAURANT) {
            throw new RuntimeException("Use merchant registration to create a restaurant account.");
        }

        User user = new User();
        user.setName(req.name());
        user.setEmail(req.email());
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setRole(requestedRole);

        if (autoVerifySignups) {
            user.setVerified(true);
            userRepository.save(user);
            String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
            AuthDtos.AuthResponse auth = new AuthDtos.AuthResponse(token, user.getRole().name(), user.getName(), user.getProfileImage());
            return new AuthDtos.RegisterResponse("Registration successful.", user.getEmail(), false, auth);
        }

        setOtp(user);

        userRepository.save(user);
        sendOtp(user.getEmail(), user.getOtp());

        return new AuthDtos.RegisterResponse("Registration successful. Check your email for OTP.", user.getEmail(), true, null);
    }

    public AuthDtos.AuthResponse registerMerchant(AuthDtos.RegisterMerchantRequest req) {
        if (userRepository.existsByEmail(req.email())) {
            throw new RuntimeException("Email already registered.");
        }

        // 1. Create User
        User user = new User();
        user.setName(req.ownerName());
        user.setEmail(req.email());
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setRole(User.Role.RESTAURANT);
        user.setVerified(true);
        userRepository.save(user);

        // 2. Create Restaurant profile
        Restaurant restaurant = new Restaurant();
        restaurant.setName(req.restaurantName());
        restaurant.setEmail(req.email());
        restaurant.setOwnerName(req.ownerName());
        restaurant.setCuisineType(req.cuisineType() != null && !req.cuisineType().isBlank() ? req.cuisineType() : "General");
        restaurant.setStatus(Restaurant.Status.PENDING_APPROVAL);
        restaurant.setImage("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400");
        restaurantRepository.save(restaurant);

        // 3. Issue Token
        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthDtos.AuthResponse(token, user.getRole().name(), user.getName(), user.getProfileImage());
    }

    public String verifyOtp(AuthDtos.VerifyOtpRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isVerified()) return "Already verified";

        if (!user.getOtp().equals(req.otp()))
            throw new RuntimeException("Invalid OTP");

        if (user.getOtpExpiry().isBefore(LocalDateTime.now()))
            throw new RuntimeException("OTP expired");

        user.setVerified(true);
        user.setOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        return "Email verified successfully";
    }

    public String resendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.isVerified()) {
            return "Account is already verified.";
        }
        setOtp(user);
        userRepository.save(user);
        sendOtp(user.getEmail(), user.getOtp());
        return "A new verification code has been sent.";
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!user.isVerified())
            throw new RuntimeException("Please verify your email first");

        if (!passwordEncoder.matches(req.password(), user.getPassword()))
            throw new RuntimeException("Invalid credentials");

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthDtos.AuthResponse(token, user.getRole().name(), user.getName(), user.getProfileImage());
    }

    private String generateOtp() {
        return String.valueOf(new Random().nextInt(900000) + 100000);
    }

    private void setOtp(User user) {
        String otp = generateOtp();
        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));
    }

    private void sendOtp(String email, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("QuickBite - Verify Your Email");
            message.setText("Your OTP is: " + otp + "\nExpires in 10 minutes.");
            mailSender.send(message);
            System.out.println("OTP email successfully sent to " + email);
        } catch (Exception e) {
            System.err.println("WARNING: Failed to send email (SMTP configurations might be missing/blank).");
            System.err.println(">>> OTP code for " + email + " is: " + otp + " <<<");
            System.err.println("SMTP Error details: " + e.getMessage());
        }
    }
}
