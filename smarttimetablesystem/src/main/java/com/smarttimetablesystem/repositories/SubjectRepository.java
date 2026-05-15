package com.smarttimetablesystem.repositories;

import com.smarttimetablesystem.models.Subject;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SubjectRepository extends MongoRepository<Subject, String> {

    List<Subject> findByBranch(String branch);

    List<Subject> findByBranchAndSemester(String branch, String semester);

    List<Subject> findByTeacherId(String teacherId);

    // 🔥 NEW SEARCH METHOD
    List<Subject> findByNameContainingIgnoreCase(String name);
}
