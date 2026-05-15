package com.smarttimetablesystem.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smarttimetablesystem.models.Schedule;
import com.smarttimetablesystem.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class AISchedulerService {

    private static final String AI_URL = "http://localhost:5000/generate";

    @Autowired private TeacherRepository teacherRepository;
    @Autowired private SubjectRepository subjectRepository;
    @Autowired private RoomRepository roomRepository;
    @Autowired private TimeslotRepository timeslotRepository;
    @Autowired private ScheduleRepository scheduleRepository;

    public ResponseEntity<?> generateSchedule() {

        try {

            var teachers = teacherRepository.findAll();
            var subjects = subjectRepository.findAll();
            var rooms = roomRepository.findAll();
            var timeslots = timeslotRepository.findAll();

            var teacherList = teachers.stream().map(t -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", t.getId());
                m.put("maxLoad", t.getMaxWeeklyLoad());
                return m;
            }).toList();

            var subjectList = subjects.stream().map(s -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", s.getId());
                m.put("name", s.getName());
                m.put("branch", s.getBranch());
                m.put("division", "A");
                m.put("weeklyHours", s.getWeeklyHours());
                m.put("type", s.getType());
                m.put("teacherId", s.getTeacherId());
                return m;
            }).toList();

            var roomList = rooms.stream().map(r -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", r.getId());
                m.put("type", r.getType());
                m.put("capacity", r.getCapacity());
                return m;
            }).toList();

            // 🔥 NOW INCLUDES startTime and endTime so Python knows which slots are 11-2
            var timeslotList = timeslots.stream().map(t -> {
                Map<String, Object> m = new HashMap<>();
                String key = t.getDay().toUpperCase() + "-" + t.getSlotNumber();
                m.put("id", key);
                m.put("day", t.getDay().toUpperCase());
                m.put("slotNumber", t.getSlotNumber());
                m.put("startTime", t.getStartTime());
                m.put("endTime", t.getEndTime());
                return m;
            }).toList();

            Map<String, Object> payload = new HashMap<>();
            payload.put("teachers", teacherList);
            payload.put("subjects", subjectList);
            payload.put("rooms", roomList);
            payload.put("timeslots", timeslotList);

            ObjectMapper mapper = new ObjectMapper();

            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(5000);
            factory.setReadTimeout(300000);

            RestTemplate restTemplate = new RestTemplate(factory);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request =
                    new HttpEntity<>(payload, headers);

            ResponseEntity<String> response =
                    restTemplate.postForEntity(AI_URL, request, String.class);

            Map<String, Object> aiResponse =
                    mapper.readValue(response.getBody(), Map.class);

            List<Map<String, Object>> timetable =
                    (List<Map<String, Object>>) aiResponse.get("timetable");

            // ✅ Read break slots from AI response: {"MONDAY": 4, "TUESDAY": 3, ...}
            Map<String, Object> breakSlots =
                    (Map<String, Object>) aiResponse.getOrDefault("breakSlots", new HashMap<>());

            scheduleRepository.deleteAll();

            List<Schedule> schedules = new ArrayList<>();

            // -----------------------------------------
            // 1. Save all teaching schedule entries
            // -----------------------------------------
            for (Map<String, Object> item : timetable) {

                String subjectId = (String) item.get("subject");
                String teacherId = (String) item.get("teacher");
                String roomId = (String) item.get("room");
                String timeslotKey = (String) item.get("timeslot");

                Schedule s = new Schedule();

                s.setSubjectId(subjectId);
                s.setTeacherId(teacherId);
                s.setRoomId(roomId);
                s.setTimeslotId(timeslotKey);

                s.setBranch("CE");
                s.setDivision("A");

                subjectRepository.findById(subjectId).ifPresent(sub ->
                        s.setSubjectName(sub.getName())
                );

                teacherRepository.findById(teacherId).ifPresent(t ->
                        s.setTeacherName(t.getName())
                );

                roomRepository.findById(roomId).ifPresent(r ->
                        s.setRoomNumber(r.getRoomNumber())
                );

                try {
                    String[] parts = timeslotKey.split("-");
                    s.setDay(parts[0].toUpperCase());
                    s.setSlotNumber(Integer.parseInt(parts[1]));
                } catch (Exception e) {
                    s.setDay("UNKNOWN");
                    s.setSlotNumber(0);
                }

                schedules.add(s);
            }

            // -----------------------------------------
            // 2. ✅ Save BREAK entries for each day
            // -----------------------------------------
            for (Map.Entry<String, Object> entry : breakSlots.entrySet()) {

                String day = entry.getKey().toUpperCase();
                int slotNumber;

                try {
                    slotNumber = ((Number) entry.getValue()).intValue();
                } catch (Exception e) {
                    continue;
                }

                String timeslotKey = day + "-" + slotNumber;

                Schedule breakSchedule = new Schedule();

                breakSchedule.setSubjectId("BREAK");
                breakSchedule.setSubjectName("BREAK");
                breakSchedule.setTeacherId("BREAK");
                breakSchedule.setTeacherName("—");
                breakSchedule.setRoomId("BREAK");
                breakSchedule.setRoomNumber("—");
                breakSchedule.setTimeslotId(timeslotKey);
                breakSchedule.setDay(day);
                breakSchedule.setSlotNumber(slotNumber);
                breakSchedule.setBranch("CE");
                breakSchedule.setDivision("A");

                schedules.add(breakSchedule);
            }

            scheduleRepository.saveAll(schedules);

            return ResponseEntity.ok(aiResponse);

        } catch (RestClientException e) {

            Map<String, Object> error = new HashMap<>();
            error.put("error", "AI Engine connection failed");
            error.put("details", e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);

        } catch (Exception e) {

            Map<String, Object> error = new HashMap<>();
            error.put("error", "Unexpected error");
            error.put("details", e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}