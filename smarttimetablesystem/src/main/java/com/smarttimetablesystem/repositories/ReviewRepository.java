package com.smarttimetablesystem.repositories;

import com.smarttimetablesystem.models.Review;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends MongoRepository<Review, String> {

    List<Review> findByTeacherEmail(String teacherEmail);

    Optional<Review> findByScheduleIdAndTeacherEmail(String scheduleId, String teacherEmail);

    List<Review> findAll();
}