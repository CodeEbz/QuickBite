package com.quickbite.auth;

public class AuthDtos {

    public record RegisterRequest(String name, String email, String password, String role) {}

    public record LoginRequest(String email, String password) {}

    public record VerifyOtpRequest(String email, String otp) {}

    public record AuthResponse(String token, String role, String name) {}
}
