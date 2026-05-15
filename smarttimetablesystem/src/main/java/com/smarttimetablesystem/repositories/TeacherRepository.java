package com.smarttimetablesystem.repositories;

import com.smarttimetablesystem.models.Teacher;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface TeacherRepository extends MongoRepository<Teacher, String> {

    List<Teacher> findByNameContainingIgnoreCase(String name);

    List<Teacher> findByDepartmentContainingIgnoreCase(String department);

    List<Teacher> findByEmailContainingIgnoreCase(String email);
}