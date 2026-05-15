package com.smarttimetablesystem.controllers;

import com.smarttimetablesystem.models.Subject;
import com.smarttimetablesystem.services.SubjectService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/subjects")
public class SubjectController {

    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    // CREATE
    @PostMapping
    public Subject addSubject(@RequestBody Subject subject) {
        return subjectService.addSubject(subject);
    }

    // READ ALL
    @GetMapping
    public List<Subject> getAllSubjects() {
        return subjectService.getAllSubjects();
    }

    // READ BY ID
    @GetMapping("/{id}")
    public Subject getById(@PathVariable String id) {
        return subjectService.getById(id);
    }

    // UPDATE
    @PutMapping("/{id}")
    public Subject updateSubject(@PathVariable String id, @RequestBody Subject subject) {
        return subjectService.updateSubject(id, subject);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public String deleteSubject(@PathVariable String id) {
        subjectService.deleteSubject(id);
        return "Subject deleted successfully";
    }

    // SEARCH
    @GetMapping("/search")
    public List<Subject> searchSubjects(@RequestParam String name) {
        return subjectService.searchSubjects(name);
    }

    // FILTERS
    @GetMapping("/branch/{branch}")
    public List<Subject> getSubjectsByBranch(@PathVariable String branch) {
        return subjectService.getSubjectsByBranch(branch);
    }

    @GetMapping("/branch/{branch}/semester/{semester}")
    public List<Subject> getSubjectsByBranchAndSemester(
            @PathVariable String branch,
            @PathVariable String semester) {

        return subjectService.getSubjectsByBranchAndSemester(branch, semester);
    }
}