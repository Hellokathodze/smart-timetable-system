package com.smarttimetablesystem.controllers;

import com.smarttimetablesystem.models.Student;
import com.smarttimetablesystem.services.StudentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/students")
@CrossOrigin(origins = "*")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    // CREATE
    @PostMapping
    public Student addStudent(@RequestBody Student student) {
        return studentService.addStudent(student);
    }

    // READ ALL
    @GetMapping
    public List<Student> getAllStudents() {
        return studentService.getAllStudents();
    }

    // READ BY ROLL NO
    @GetMapping("/roll/{rollNo}")
    public Student getStudent(@PathVariable int rollNo) {
        return studentService.getStudentByRollNo(rollNo);
    }

    // READ BY BRANCH
    @GetMapping("/branch/{branch}")
    public List<Student> getStudentsByBranch(@PathVariable String branch) {
        return studentService.getStudentsByBranch(branch);
    }

    // ✅ SEARCH
    @GetMapping("/search")
    public List<Student> searchStudents(@RequestParam(required = false) String name) {
        if (name != null && !name.isEmpty()) {
            return studentService.searchByName(name);
        }
        return studentService.getAllStudents();
    }

    // ✅ UPDATE
    @PutMapping("/{id}")
    public Student updateStudent(@PathVariable String id, @RequestBody Student student) {
        return studentService.updateStudent(id, student);
    }

    // ✅ DELETE
    @DeleteMapping("/{id}")
    public Map<String, String> deleteStudent(@PathVariable String id) {
        studentService.deleteStudent(id);
        return Map.of("message", "Student deleted successfully");
    }

    // ✅ BULK: Create login accounts for all existing students
    @PostMapping("/create-logins")
    public Map<String, Object> createLoginsForAll() {
        int created = studentService.createLoginForAllStudents();
        return Map.of(
                "message", "Login accounts created",
                "count", created
        );
    }
}