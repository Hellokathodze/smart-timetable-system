package com.smarttimetablesystem.controllers;

import com.smarttimetablesystem.dto.*;
import com.smarttimetablesystem.models.User;
import com.smarttimetablesystem.security.JwtUtil;
import com.smarttimetablesystem.services.AuthService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            User savedUser = authService.register(user);
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Registration failed");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        try {
            System.out.println("LOGIN ATTEMPT: " + request.getEmail());

            Optional<User> result =
                    authService.login(request.getEmail(), request.getPassword());

            if (result.isPresent()) {

                User user = result.get();

                System.out.println("USER FOUND: " + user.getEmail());

                if (user.getRole() == null) {
                    return ResponseEntity.status(500)
                            .body("User role is missing");
                }

                String token = jwtUtil.generateToken(
                        user.getEmail(),
                        user.getRole()
                );

                return ResponseEntity.ok(new AuthResponse(token));
            }

            return ResponseEntity.status(401).body("Invalid email or password");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Login failed: " + e.getMessage());
        }
    }

    // ✅ NEW: Change password (any authenticated user)
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody ChangePasswordRequest request,
            Authentication auth
    ) {
        try {
            String email = auth.getName(); // email from JWT

            boolean success = authService.changePassword(
                    email,
                    request.getCurrentPassword(),
                    request.getNewPassword()
            );

            if (success) {
                return ResponseEntity.ok(Map.of(
                        "message", "Password changed successfully"
                ));
            } else {
                return ResponseEntity.status(400).body(Map.of(
                        "message", "Current password is incorrect"
                ));
            }

        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(Map.of(
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "message", "Password change failed"
            ));
        }
    }
}