package com.smarttimetablesystem.repositories;

import com.smarttimetablesystem.models.Schedule;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ScheduleRepository extends MongoRepository<Schedule, String> {

    List<Schedule> findByBranchAndDivision(String branch, String division);

    List<Schedule> findByTeacherId(String teacherId);

    List<Schedule> findByRoomId(String roomId);

    List<Schedule> findByDay(String day);

    // ✅ For my-timetable lookup by teacher name
    List<Schedule> findByTeacherName(String teacherName);
}