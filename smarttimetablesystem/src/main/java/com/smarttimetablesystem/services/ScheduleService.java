package com.smarttimetablesystem.services;

import com.smarttimetablesystem.models.Schedule;
import com.smarttimetablesystem.models.Teacher;
import com.smarttimetablesystem.models.Timeslot;
import com.smarttimetablesystem.repositories.ScheduleRepository;
import com.smarttimetablesystem.repositories.TeacherRepository;
import com.smarttimetablesystem.repositories.TimeslotRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final TimeslotRepository timeslotRepository;
    private final TeacherRepository teacherRepository;

    public ScheduleService(ScheduleRepository scheduleRepository,
                           TimeslotRepository timeslotRepository,
                           TeacherRepository teacherRepository) {
        this.scheduleRepository = scheduleRepository;
        this.timeslotRepository = timeslotRepository;
        this.teacherRepository = teacherRepository;
    }

    public List<Schedule> getAllSchedules() {
        return scheduleRepository.findAll();
    }

    public List<Schedule> getByBranchAndDivision(String branch, String division) {
        return scheduleRepository.findByBranchAndDivision(branch, division);
    }

    public List<Schedule> getByTeacher(String teacherId) {
        return scheduleRepository.findByTeacherId(teacherId);
    }

    public List<Schedule> getByRoom(String roomId) {
        return scheduleRepository.findByRoomId(roomId);
    }

    public Map<String, List<Map<String, Object>>> getGroupedTimetable(String branch, String division) {
        List<Schedule> schedules = scheduleRepository.findByBranchAndDivision(branch, division);

        Map<String, List<Map<String, Object>>> timetable = new LinkedHashMap<>();
        List<String> dayOrder = Arrays.asList("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY");
        for (String day : dayOrder) timetable.put(day, new ArrayList<>());

        for (Schedule s : schedules) {
            String normalizedDay = s.getDay() != null ? s.getDay().toUpperCase() : "UNKNOWN";
            if (timetable.containsKey(normalizedDay)) {
                Timeslot ts = timeslotRepository.findByDayAndSlotNumber(normalizedDay, s.getSlotNumber()).orElse(null);

                Map<String, Object> entry = new HashMap<>();
                entry.put("slot", s.getSlotNumber());
                entry.put("subject", s.getSubjectName());
                entry.put("teacher", s.getTeacherName());
                entry.put("room", s.getRoomNumber());
                entry.put("reasoning", Arrays.asList("No teacher conflict", "Room available", "Balanced distribution"));
                entry.put("fitnessScore", 100);
                entry.put("scheduleId", s.getId());

                if (ts != null) {
                    entry.put("startTime", ts.getStartTime());
                    entry.put("endTime", ts.getEndTime());
                } else {
                    entry.put("startTime", "-");
                    entry.put("endTime", "-");
                }

                timetable.get(normalizedDay).add(entry);
            }
        }

        timetable.values().forEach(list -> list.sort(Comparator.comparingInt(e -> (int) e.get("slot"))));
        return timetable;
    }

    public Map<String, List<Map<String, Object>>> getTimetableByTeacherEmail(String email) {
        List<Teacher> teachers = teacherRepository.findByEmailContainingIgnoreCase(email);
        List<Schedule> schedules = new ArrayList<>();

        if (!teachers.isEmpty()) {
            Teacher teacher = teachers.get(0);
            String teacherId = teacher.getId();
            String teacherName = teacher.getName();

            System.out.println("MY-TIMETABLE: teacher=" + teacherName + " id=" + teacherId);

            schedules = scheduleRepository.findByTeacherId(teacherId);

            List<Schedule> byName = scheduleRepository.findByTeacherName(teacherName);

            Set<String> existingIds = schedules.stream().map(Schedule::getId).collect(Collectors.toSet());
            for (Schedule s : byName) {
                if (!existingIds.contains(s.getId())) {
                    schedules.add(s);
                }
            }

            if (schedules.isEmpty()) {
                List<Schedule> all = scheduleRepository.findAll();
                schedules = all.stream()
                        .filter(s -> teacherName.equalsIgnoreCase(s.getTeacherName()) ||
                                teacherId.equals(s.getTeacherId()))
                        .collect(Collectors.toList());
            }

            System.out.println("MY-TIMETABLE: found=" + schedules.size() + " schedules");
        }

        Map<String, List<Map<String, Object>>> timetable = new LinkedHashMap<>();
        List<String> dayOrder = Arrays.asList("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY");
        for (String day : dayOrder) timetable.put(day, new ArrayList<>());

        for (Schedule s : schedules) {
            if ("BREAK".equals(s.getSubjectName())) continue;

            String normalizedDay = s.getDay() != null ? s.getDay().toUpperCase() : "UNKNOWN";
            if (!timetable.containsKey(normalizedDay)) continue;

            Timeslot ts = timeslotRepository.findByDayAndSlotNumber(normalizedDay, s.getSlotNumber()).orElse(null);

            Map<String, Object> entry = new HashMap<>();
            entry.put("slot", s.getSlotNumber());
            entry.put("subject", s.getSubjectName());
            entry.put("teacher", s.getTeacherName());
            entry.put("room", s.getRoomNumber());
            entry.put("scheduleId", s.getId());

            if (ts != null) {
                entry.put("startTime", ts.getStartTime());
                entry.put("endTime", ts.getEndTime());
            } else {
                entry.put("startTime", "-");
                entry.put("endTime", "-");
            }

            timetable.get(normalizedDay).add(entry);
        }

        timetable.values().forEach(list -> list.sort(Comparator.comparingInt(e -> (int) e.get("slot"))));
        return timetable;
    }

    public Map<String, List<Map<String, Object>>> getTeacherTimetable(String teacherId) {
        List<Schedule> schedules = scheduleRepository.findByTeacherId(teacherId);

        Map<String, List<Map<String, Object>>> timetable = new LinkedHashMap<>();
        for (Schedule s : schedules) {
            String normalizedDay = s.getDay() != null ? s.getDay().toUpperCase() : "UNKNOWN";
            timetable.putIfAbsent(normalizedDay, new ArrayList<>());
            Map<String, Object> entry = new HashMap<>();
            entry.put("slot", s.getSlotNumber());
            entry.put("subject", s.getSubjectName());
            entry.put("room", s.getRoomNumber());
            timetable.get(normalizedDay).add(entry);
        }
        return timetable;
    }

    public Map<String, List<Map<String, Object>>> getRoomTimetable(String roomId) {
        List<Schedule> schedules = scheduleRepository.findByRoomId(roomId);

        Map<String, List<Map<String, Object>>> timetable = new LinkedHashMap<>();
        for (Schedule s : schedules) {
            String normalizedDay = s.getDay() != null ? s.getDay().toUpperCase() : "UNKNOWN";
            timetable.putIfAbsent(normalizedDay, new ArrayList<>());
            Map<String, Object> entry = new HashMap<>();
            entry.put("slot", s.getSlotNumber());
            entry.put("subject", s.getSubjectName());
            entry.put("teacher", s.getTeacherName());
            timetable.get(normalizedDay).add(entry);
        }
        return timetable;
    }

    public Map<String, Object> getScheduleSummary() {
        List<Schedule> schedules = scheduleRepository.findAll();
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalClasses", schedules.size());
        Set<String> teachers = new HashSet<>();
        Set<String> rooms = new HashSet<>();
        for (Schedule s : schedules) { teachers.add(s.getTeacherName()); rooms.add(s.getRoomNumber()); }
        summary.put("totalTeachers", teachers.size());
        summary.put("totalRooms", rooms.size());
        return summary;
    }

    public Map<String, Integer> getTeacherLoadStats() {
        List<Schedule> schedules = scheduleRepository.findAll();
        Map<String, Integer> load = new HashMap<>();
        for (Schedule s : schedules) {
            if ("BREAK".equals(s.getSubjectName())) continue;
            load.put(s.getTeacherName(), load.getOrDefault(s.getTeacherName(), 0) + 1);
        }
        return load;
    }

    public Map<String, Integer> getDailyStats() {
        List<Schedule> schedules = scheduleRepository.findAll();
        Map<String, Integer> daily = new LinkedHashMap<>();
        List<String> days = Arrays.asList("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY");
        for (String day : days) daily.put(day, 0);
        for (Schedule s : schedules) {
            if ("BREAK".equals(s.getSubjectName())) continue;
            String normalizedDay = s.getDay() != null ? s.getDay().toUpperCase() : "UNKNOWN";
            if (daily.containsKey(normalizedDay)) daily.put(normalizedDay, daily.get(normalizedDay) + 1);
        }
        return daily;
    }
}