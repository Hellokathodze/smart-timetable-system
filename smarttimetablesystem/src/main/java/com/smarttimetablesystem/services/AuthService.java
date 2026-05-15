package com.smarttimetablesystem.services;

import com.smarttimetablesystem.models.User;
import com.smarttimetablesystem.repositories.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public User register(User user) {

        if (user.getEmail() == null || user.getPassword() == null) {
            throw new RuntimeException("Email or password cannot be null");
        }

        if (user.getRole() == null) {
            user.setRole("FACULTY");
        }

        user.setPassword(encoder.encode(user.getPassword()));

        return userRepository.save(user);
    }

    public Optional<User> login(String email, String password) {

        Optional<User> user = userRepository.findByEmail(email);

        if (user.isPresent()) {

            System.out.println("Checking password for: " + email);

            if (encoder.matches(password, user.get().getPassword())) {
                return user;
            } else {
                System.out.println("Password mismatch");
            }
        } else {
            System.out.println("User not found");
        }

        return Optional.empty();
    }

    // ✅ NEW: Change password for the logged-in user
    public boolean changePassword(String email, String currentPassword, String newPassword) {

        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();

        // Verify current password
        if (!encoder.matches(currentPassword, user.getPassword())) {
            return false;
        }

        // Validate new password
        if (newPassword == null || newPassword.length() < 4) {
            throw new RuntimeException("New password must be at least 4 characters");
        }

        // Update password
        user.setPassword(encoder.encode(newPassword));
        userRepository.save(user);

        return true;
    }
}