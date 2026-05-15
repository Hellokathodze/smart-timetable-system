package com.smarttimetablesystem.services;

import com.smarttimetablesystem.models.Subject;
import com.smarttimetablesystem.repositories.SubjectRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SubjectService {

    private final SubjectRepository subjectRepository;

    public SubjectService(SubjectRepository subjectRepository) {
        this.subjectRepository = subjectRepository;
    }

    // CREATE
    public Subject addSubject(Subject subject) {
        return subjectRepository.save(subject);
    }

    // READ ALL
    public List<Subject> getAllSubjects() {
        return subjectRepository.findAll();
    }

    // READ BY ID
    public Subject getById(String id) {
        return subjectRepository.findById(id).orElse(null);
    }

    // UPDATE
    public Subject updateSubject(String id, Subject subject) {
        subject.setId(id);
        return subjectRepository.save(subject);
    }

    // DELETE
    public void deleteSubject(String id) {
        subjectRepository.deleteById(id);
    }

    // SEARCH
    public List<Subject> searchSubjects(String name) {
        return subjectRepository.findByNameContainingIgnoreCase(name);
    }

    // FILTER
    public List<Subject> getSubjectsByBranch(String branch) {
        return subjectRepository.findByBranch(branch);
    }

    public List<Subject> getSubjectsByBranchAndSemester(String branch, String semester) {
        return subjectRepository.findByBranchAndSemester(branch, semester);
    }
}