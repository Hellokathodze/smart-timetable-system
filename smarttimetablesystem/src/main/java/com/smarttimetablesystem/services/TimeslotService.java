package com.smarttimetablesystem.services;

import com.smarttimetablesystem.models.Timeslot;
import com.smarttimetablesystem.repositories.TimeslotRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TimeslotService {

    private final TimeslotRepository timeslotRepository;

    public TimeslotService(TimeslotRepository timeslotRepository) {
        this.timeslotRepository = timeslotRepository;
    }

    // ======================
    // GET ALL
    // ======================
    public List<Timeslot> getAllTimeslots() {
        return timeslotRepository.findAll();
    }

    // ======================
    // SEARCH BY DAY (🔥 FIX)
    // ======================
    public List<Timeslot> getTimeslotsByDay(String day) {
        return timeslotRepository.findByDay(day.toUpperCase());
    }

    // ======================
    // SEARCH BY TYPE
    // ======================
    public List<Timeslot> getTimeslotsByType(String type) {
        return timeslotRepository.findByType(type);
    }

    // ======================
    // CREATE (🔥 FIX)
    // ======================
    public Timeslot addTimeslot(Timeslot timeslot) {

        // Normalize day
        timeslot.setDay(timeslot.getDay().toUpperCase());

        return timeslotRepository.save(timeslot);
    }

    // ======================
    // UPDATE (🔥 FIX)
    // ======================
    public Timeslot updateTimeslot(String id, Timeslot updated) {

        Timeslot existing = timeslotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Timeslot not found"));

        existing.setDay(updated.getDay().toUpperCase());
        existing.setSlotNumber(updated.getSlotNumber());
        existing.setStartTime(updated.getStartTime());
        existing.setEndTime(updated.getEndTime());
        existing.setType(updated.getType());

        return timeslotRepository.save(existing);
    }

    // ======================
    // DELETE
    // ======================
    public void deleteTimeslot(String id) {
        timeslotRepository.deleteById(id);
    }

    // ======================
    // GENERATE (🔥 FINAL FIX)
    // ======================
    public void generateWeeklyTimeslots() {

        String[] days = {"MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY"};

        String[][] timeRanges = {
                {"09:00","10:00"},
                {"10:00","11:00"},
                {"11:15","12:15"},
                {"12:15","13:15"},
                {"14:00","15:00"},
                {"15:00","16:00"}
        };

        for (String day : days) {

            for (int i = 0; i < timeRanges.length; i++) {

                int slotNumber = i + 1;

                // 🔥 DUPLICATE CHECK (CRITICAL)
                boolean exists = timeslotRepository
                        .findByDayAndSlotNumber(day, slotNumber)
                        .isPresent();

                if (exists) {
                    continue;
                }

                Timeslot slot = new Timeslot();

                slot.setDay(day); // already uppercase
                slot.setSlotNumber(slotNumber);
                slot.setStartTime(timeRanges[i][0]);
                slot.setEndTime(timeRanges[i][1]);
                slot.setType("LECTURE");

                timeslotRepository.save(slot);
            }
        }
    }
}