package com.smarttimetablesystem.controllers;

import com.smarttimetablesystem.dto.ApiResponse;
import com.smarttimetablesystem.models.Teacher;
import com.smarttimetablesystem.services.TeacherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/teachers")
@CrossOrigin(origins = "*")
public class TeacherController {

    @Autowired
    private TeacherService teacherService;

    // SEARCH
    @GetMapping("/search")
    public ApiResponse<List<Teacher>> searchTeachers(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String email
    ) {
        List<Teacher> result;

        if (name != null && !name.isEmpty()) {
            result = teacherService.searchByName(name);
        } else if (department != null && !department.isEmpty()) {
            result = teacherService.searchByDepartment(department);
        } else if (email != null && !email.isEmpty()) {
            result = teacherService.searchByEmail(email);
        } else {
            result = teacherService.getAllTeachers();
        }

        return new ApiResponse<>("Search completed successfully", result);
    }

    // CREATE
    @PostMapping
    public ApiResponse<Teacher> addTeacher(@RequestBody Teacher teacher) {
        Teacher saved = teacherService.addTeacher(teacher);
        return new ApiResponse<>("Teacher added successfully (login created with default password)", saved);
    }

    // READ ALL
    @GetMapping
    public ApiResponse<List<Teacher>> getAllTeachers() {
        return new ApiResponse<>("Teachers fetched successfully", teacherService.getAllTeachers());
    }

    // READ BY ID
    @GetMapping("/{id}")
    public ApiResponse<Teacher> getTeacherById(@PathVariable String id) {
        return new ApiResponse<>("Teacher fetched successfully", teacherService.getTeacherById(id));
    }

    // UPDATE
    @PutMapping("/{id}")
    public ApiResponse<Teacher> updateTeacher(@PathVariable String id, @RequestBody Teacher teacher) {
        Teacher updated = teacherService.updateTeacher(id, teacher);
        return new ApiResponse<>("Teacher updated successfully", updated);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ApiResponse<String> deleteTeacher(@PathVariable String id) {
        teacherService.deleteTeacher(id);
        return new ApiResponse<>("Teacher deleted successfully", "OK");
    }

    // ✅ BULK: Create login accounts for all existing teachers
    @PostMapping("/create-logins")
    public Map<String, Object> createLoginsForAll() {
        int created = teacherService.createLoginForAllTeachers();
        return Map.of(
                "message", "Login accounts created for teachers",
                "count", created
        );
    }

    // ✅ NEW: Toggle generate access (Admin grants/revokes Head Teacher power)
    @PutMapping("/{id}/toggle-generate")
    public ApiResponse<Teacher> toggleGenerate(
            @PathVariable String id,
            @RequestBody Map<String, Boolean> body
    ) {
        boolean canGenerate = body.getOrDefault("canGenerate", false);
        Teacher updated = teacherService.toggleGenerateAccess(id, canGenerate);

        if (updated != null) {
            String msg = canGenerate
                    ? "Head Teacher access granted — can now generate timetables"
                    : "Generate access revoked";
            return new ApiResponse<>(msg, updated);
        }

        return new ApiResponse<>("Teacher not found", null);
    }

    // ✅ NEW: Check if current faculty can generate (called by frontend)
    @GetMapping("/can-generate")
    public Map<String, Object> checkCanGenerate(@RequestParam String email) {
        boolean allowed = teacherService.canTeacherGenerate(email);
        return Map.of("canGenerate", allowed);
    }
}