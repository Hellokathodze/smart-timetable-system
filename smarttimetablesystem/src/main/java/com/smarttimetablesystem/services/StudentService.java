package com.smarttimetablesystem.services;

import com.smarttimetablesystem.models.Student;
import com.smarttimetablesystem.models.User;
import com.smarttimetablesystem.repositories.StudentRepository;
import com.smarttimetablesystem.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    private static final String DEFAULT_PASSWORD = "password123";

    public Student addStudent(Student student) {
        Student saved = studentRepository.save(student);

        if (student.getEmail() != null && !student.getEmail().isEmpty()) {
            Optional<User> existingUser = userRepository.findByEmail(student.getEmail());
            if (existingUser.isEmpty()) {
                User user = new User();
                user.setName(student.getName());
                user.setEmail(student.getEmail());
                user.setPassword(encoder.encode(DEFAULT_PASSWORD));
                user.setRole("STUDENT");
                userRepository.save(user);
            }
        }

        return saved;
    }

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Student getStudentByRollNo(int rollNo) {
        return studentRepository.findByRollNo(rollNo)
                .orElseThrow(() -> new RuntimeException("Student not found"));
    }

    public List<Student> getStudentsByBranch(String branch) {
        return studentRepository.findByBranch(branch);
    }

    public Student getStudentById(String id) {
        return studentRepository.findById(id).orElse(null);
    }

    // ✅ FIXED: Update student AND sync User email/name if changed
    public Student updateStudent(String id, Student updated) {
        Student existing = studentRepository.findById(id).orElse(null);

        if (existing != null) {
            String oldEmail = existing.getEmail();
            String newEmail = updated.getEmail();
            String newName = updated.getName();

            existing.setName(newName);
            existing.setEmail(newEmail);
            existing.setRollNo(updated.getRollNo());
            existing.setBranch(updated.getBranch());
            existing.setDivision(updated.getDivision());
            existing.setSemester(updated.getSemester());

            Student saved = studentRepository.save(existing);

            // ✅ Sync User account if email or name changed
            if (oldEmail != null && !oldEmail.isEmpty()) {
                Optional<User> userOpt = userRepository.findByEmail(oldEmail);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    boolean changed = false;

                    if (newEmail != null && !newEmail.equals(oldEmail)) {
                        user.setEmail(newEmail);
                        changed = true;
                    }

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

    public void deleteStudent(String id) {
        Student student = studentRepository.findById(id).orElse(null);
        if (student != null && student.getEmail() != null) {
            userRepository.findByEmail(student.getEmail())
                    .ifPresent(user -> userRepository.delete(user));
        }
        studentRepository.deleteById(id);
    }

    public List<Student> searchByName(String name) {
        return studentRepository.findByNameContainingIgnoreCase(name);
    }

    public int createLoginForAllStudents() {
        List<Student> students = studentRepository.findAll();
        int created = 0;

        for (Student student : students) {
            if (student.getEmail() != null && !student.getEmail().isEmpty()) {
                Optional<User> existing = userRepository.findByEmail(student.getEmail());
                if (existing.isEmpty()) {
                    User user = new User();
                    user.setName(student.getName());
                    user.setEmail(student.getEmail());
                    user.setPassword(encoder.encode(DEFAULT_PASSWORD));
                    user.setRole("STUDENT");
                    userRepository.save(user);
                    created++;
                }
            }
        }

        return created;
    }
}