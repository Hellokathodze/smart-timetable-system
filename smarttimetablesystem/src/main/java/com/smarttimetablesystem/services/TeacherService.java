package com.smarttimetablesystem.services;

import com.smarttimetablesystem.models.Teacher;
import com.smarttimetablesystem.models.User;
import com.smarttimetablesystem.repositories.TeacherRepository;
import com.smarttimetablesystem.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TeacherService {

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    private static final String DEFAULT_PASSWORD = "password123";

    public Teacher addTeacher(Teacher teacher) {
        Teacher saved = teacherRepository.save(teacher);

        if (teacher.getEmail() != null && !teacher.getEmail().isEmpty()) {
            Optional<User> existingUser = userRepository.findByEmail(teacher.getEmail());
            if (existingUser.isEmpty()) {
                User user = new User();
                user.setName(teacher.getName());
                user.setEmail(teacher.getEmail());
                user.setPassword(encoder.encode(DEFAULT_PASSWORD));
                user.setRole("FACULTY");
                userRepository.save(user);
            }
        }

        return saved;
    }

    public List<Teacher> getAllTeachers() {
        return teacherRepository.findAll();
    }

    public Teacher getTeacherById(String id) {
        return teacherRepository.findById(id).orElse(null);
    }

    public Teacher getTeacherByEmail(String email) {
        List<Teacher> results = teacherRepository.findByEmailContainingIgnoreCase(email);
        return results.isEmpty() ? null : results.get(0);
    }

    // ✅ FIXED: Update teacher AND sync User email/name if changed
    public Teacher updateTeacher(String id, Teacher updatedTeacher) {
        Teacher existing = teacherRepository.findById(id).orElse(null);

        if (existing != null) {
            String oldEmail = existing.getEmail();
            String newEmail = updatedTeacher.getEmail();
            String newName = updatedTeacher.getName();

            // Update teacher fields
            existing.setName(newName);
            existing.setEmail(newEmail);
            existing.setDepartment(updatedTeacher.getDepartment());
            existing.setSubjects(updatedTeacher.getSubjects());
            existing.setAvailability(updatedTeacher.getAvailability());
            existing.setMaxWeeklyLoad(updatedTeacher.getMaxWeeklyLoad());
            existing.setCanGenerate(updatedTeacher.isCanGenerate());

            Teacher saved = teacherRepository.save(existing);

            // ✅ Sync User account if email or name changed
            if (oldEmail != null && !oldEmail.isEmpty()) {
                Optional<User> userOpt = userRepository.findByEmail(oldEmail);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    boolean changed = false;

                    // Update email if changed
                    if (newEmail != null && !newEmail.equals(oldEmail)) {
                        user.setEmail(newEmail);
                        changed = true;
                    }

                    // Update name if changed
                    if (newName != null && !newName.equals(user.getName())) {
                        user.setName(newName);
                        changed = true;
                    }

                    if (changed) {
                        userRepository.save(user);
                    }
                }
            }

            return saved;
        }

        return null;
    }

    public void deleteTeacher(String id) {
        Teacher teacher = teacherRepository.findById(id).orElse(null);
        if (teacher != null && teacher.getEmail() != null) {
            userRepository.findByEmail(teacher.getEmail())
                    .ifPresent(user -> userRepository.delete(user));
        }
        teacherRepository.deleteById(id);
    }

    public Teacher toggleGenerateAccess(String id, boolean canGenerate) {
        Teacher teacher = teacherRepository.findById(id).orElse(null);
        if (teacher != null) {
            teacher.setCanGenerate(canGenerate);
            return teacherRepository.save(teacher);
        }
        return null;
    }

    public boolean canTeacherGenerate(String email) {
        Teacher teacher = getTeacherByEmail(email);
        return teacher != null && teacher.isCanGenerate();
    }

    public List<Teacher> searchByName(String name) {
        return teacherRepository.findByNameContainingIgnoreCase(name);
    }

    public List<Teacher> searchByDepartment(String department) {
        return teacherRepository.findByDepartmentContainingIgnoreCase(department);
    }

    public List<Teacher> searchByEmail(String email) {
        return teacherRepository.findByEmailContainingIgnoreCase(email);
    }

    public int createLoginForAllTeachers() {
        List<Teacher> teachers = teacherRepository.findAll();
        int created = 0;

        for (Teacher teacher : teachers) {
            if (teacher.getEmail() != null && !teacher.getEmail().isEmpty()) {
                Optional<User> existing = userRepository.findByEmail(teacher.getEmail());
                if (existing.isEmpty()) {
                    User user = new User();
                    user.setName(teacher.getName());
                    user.setEmail(teacher.getEmail());
                    user.setPassword(encoder.encode(DEFAULT_PASSWORD));
                    user.setRole("FACULTY");
                    userRepository.save(user);
                    created++;
                }
            }
        }

        return created;
    }
}