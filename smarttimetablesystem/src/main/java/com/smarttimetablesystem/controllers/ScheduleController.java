package com.smarttimetablesystem.controllers;

import com.smarttimetablesystem.services.ScheduleService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/schedule")
public class ScheduleController {

    private final ScheduleService scheduleService;

    public ScheduleController(ScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @GetMapping
    public List<?> getAllSchedules() {
        return scheduleService.getAllSchedules();
    }

    @GetMapping("/timetable")
    public Map<String, List<Map<String, Object>>> getTimetable(
            @RequestParam String branch,
            @RequestParam String division
    ) {
        return scheduleService.getGroupedTimetable(branch, division);
    }

    // ✅ NEW: My Timetable — reads email from JWT
    @GetMapping("/my-timetable")
    public Map<String, List<Map<String, Object>>> getMyTimetable(Authentication auth) {
        String email = auth.getName();
        return scheduleService.getTimetableByTeacherEmail(email);
    }

    @GetMapping("/teacher")
    public Map<String, List<Map<String, Object>>> getTeacherTimetable(
            @RequestParam String teacherId
    ) {
        return scheduleService.getTeacherTimetable(teacherId);
    }

    @GetMapping("/room")
    public Map<String, List<Map<String, Object>>> getRoomTimetable(
            @RequestParam String roomId
    ) {
        return scheduleService.getRoomTimetable(roomId);
    }

    @GetMapping("/all")
    public Map<String, Object> getSummary() {
        return scheduleService.getScheduleSummary();
    }

    @GetMapping("/stats/teacher-load")
    public Map<String, Integer> getTeacherLoad() {
        return scheduleService.getTeacherLoadStats();
    }

    @GetMapping("/stats/daily")
    public Map<String, Integer> getDailyStats() {
        return scheduleService.getDailyStats();
    }
}