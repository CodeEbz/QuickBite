package com.quickbite.auth;

import com.quickbite.user.User;
import com.quickbite.user.UserRepository;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final JavaMailSender mailSender;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil, JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.mailSender = mailSender;
    }

    public String register(AuthDtos.RegisterRequest req) {
        if (userRepository.existsByEmail(req.email()))
            throw new RuntimeException("Email already in use");

        User user = new User();
        user.setName(req.name());
        user.setEmail(req.email());
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setRole(User.Role.valueOf(req.role().toUpperCase()));

        String otp = generateOtp();
        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));

        userRepository.save(user);
        sendOtp(user.getEmail(), otp);

        return "Registration successful. Check your email for OTP.";
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

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!user.isVerified())
            throw new RuntimeException("Please verify your email first");

        if (!passwordEncoder.matches(req.password(), user.getPassword()))
            throw new RuntimeException("Invalid credentials");

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthDtos.AuthResponse(token, user.getRole().name(), user.getName());
    }

    private String generateOtp() {
        return String.valueOf(new Random().nextInt(900000) + 100000);
    }

    private void sendOtp(String email, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("QuickBite - Verify Your Email");
        message.setText("Your OTP is: " + otp + "\nExpires in 10 minutes.");
        mailSender.send(message);
    }
}
