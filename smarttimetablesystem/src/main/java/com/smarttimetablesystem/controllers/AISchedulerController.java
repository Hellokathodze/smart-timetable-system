package com.smarttimetablesystem.controllers;

import com.smarttimetablesystem.services.AISchedulerService;
import com.smarttimetablesystem.services.TeacherService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/ai")
@CrossOrigin(origins = "*")
public class AISchedulerController {

    private final AISchedulerService aiService;
    private final TeacherService teacherService;

    public AISchedulerController(AISchedulerService aiService, TeacherService teacherService) {
        this.aiService = aiService;
        this.teacherService = teacherService;
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generate(Authentication auth) {

        String email = auth.getName();

        // Check if user is ADMIN — always allowed
        boolean isAdmin = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_ADMIN"));

        if (!isAdmin) {
            // FACULTY — check canGenerate permission
            boolean canGenerate = teacherService.canTeacherGenerate(email);

            if (!canGenerate) {
                return ResponseEntity.status(403).body(Map.of(
                        "error", "You do not have permission to generate timetables",
                        "message", "Contact Admin to get Head Teacher access"
                ));
            }
        }

        return aiService.generateSchedule();
    }
}