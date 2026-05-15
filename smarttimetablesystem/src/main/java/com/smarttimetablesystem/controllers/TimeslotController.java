package com.smarttimetablesystem.controllers;

import com.smarttimetablesystem.models.Timeslot;
import com.smarttimetablesystem.services.TimeslotService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/timeslots")
public class TimeslotController {

    private final TimeslotService timeslotService;

    public TimeslotController(TimeslotService timeslotService) {
        this.timeslotService = timeslotService;
    }

    // GET ALL
    @GetMapping
    public List<Timeslot> getAllTimeslots() {
        return timeslotService.getAllTimeslots();
    }

    // SEARCH BY DAY
    @GetMapping("/day/{day}")
    public List<Timeslot> getTimeslotsByDay(@PathVariable String day) {
        return timeslotService.getTimeslotsByDay(day);
    }

    // 🔥 SEARCH BY TYPE
    @GetMapping("/type/{type}")
    public List<Timeslot> getTimeslotsByType(@PathVariable String type) {
        return timeslotService.getTimeslotsByType(type);
    }

    // CREATE
    @PostMapping
    public Timeslot addTimeslot(@RequestBody Timeslot timeslot) {
        return timeslotService.addTimeslot(timeslot);
    }

    // UPDATE
    @PutMapping("/{id}")
    public Timeslot updateTimeslot(@PathVariable String id, @RequestBody Timeslot timeslot) {
        return timeslotService.updateTimeslot(id, timeslot);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public String deleteTimeslot(@PathVariable String id) {
        timeslotService.deleteTimeslot(id);
        return "Timeslot deleted successfully";
    }

    // GENERATE
    @PostMapping("/generate")
    public String generateSlots() {
        timeslotService.generateWeeklyTimeslots();
        return "Weekly timeslots generated successfully";
    }
}