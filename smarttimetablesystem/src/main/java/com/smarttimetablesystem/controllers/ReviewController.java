package com.smarttimetablesystem.controllers;

import com.smarttimetablesystem.models.Review;
import com.smarttimetablesystem.repositories.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    // ✅ Submit or update review (teacher submits 1=approve or 2=disapprove)
    @PostMapping
    public ResponseEntity<?> submitReview(@RequestBody Review review, Authentication auth) {
        String email = auth.getName();
        review.setTeacherEmail(email);
        review.setCreatedAt(System.currentTimeMillis());

        // Check if review already exists for this schedule+teacher
        Optional<Review> existing = reviewRepository.findByScheduleIdAndTeacherEmail(
                review.getScheduleId(), email);

        if (existing.isPresent()) {
            // Update existing review
            Review r = existing.get();
            r.setRating(review.getRating());
            r.setCreatedAt(System.currentTimeMillis());
            reviewRepository.save(r);
            return ResponseEntity.ok(Map.of("message", "Review updated", "review", r));
        }

        Review saved = reviewRepository.save(review);
        return ResponseEntity.ok(Map.of("message", "Review submitted", "review", saved));
    }

    // ✅ Get my reviews (teacher sees their own)
    @GetMapping("/my")
    public List<Review> getMyReviews(Authentication auth) {
        return reviewRepository.findByTeacherEmail(auth.getName());
    }

    // ✅ Get all reviews (admin/head teacher only — frontend controls visibility)
    @GetMapping
    public List<Review> getAllReviews() {
        return reviewRepository.findAll();
    }
}