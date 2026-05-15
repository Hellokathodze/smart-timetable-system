package com.smarttimetablesystem.repositories;

import com.smarttimetablesystem.models.Student;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends MongoRepository<Student, String> {

    Optional<Student> findByRollNo(int rollNo);

    List<Student> findByBranch(String branch);

    List<Student> findByBranchAndDivision(String branch, String division);

    // ✅ NEW: Search by name
    List<Student> findByNameContainingIgnoreCase(String name);

    // ✅ NEW: Find by email
    Optional<Student> findByEmail(String email);
}