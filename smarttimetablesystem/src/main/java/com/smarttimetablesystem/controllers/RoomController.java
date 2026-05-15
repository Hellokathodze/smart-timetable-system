package com.smarttimetablesystem.controllers;

import com.smarttimetablesystem.models.Room;
import com.smarttimetablesystem.services.RoomService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    // CREATE
    @PostMapping
    public Room addRoom(@RequestBody Room room) {
        return roomService.addRoom(room);
    }

    // READ ALL
    @GetMapping
    public List<Room> getAllRooms() {
        return roomService.getAllRooms();
    }

    // UPDATE ✅
    @PutMapping("/{id}")
    public Room updateRoom(@PathVariable String id, @RequestBody Room room) {
        return roomService.updateRoom(id, room);
    }

    // DELETE ✅
    @DeleteMapping("/{id}")
    public String deleteRoom(@PathVariable String id) {
        roomService.deleteRoom(id);
        return "Room deleted successfully";
    }

    // SEARCH
    @GetMapping("/type/{type}")
    public List<Room> getRoomsByType(@PathVariable String type) {
        return roomService.getRoomsByType(type);
    }

    @GetMapping("/capacity/{capacity}")
    public List<Room> getRoomsByCapacity(@PathVariable int capacity) {
        return roomService.getRoomsByCapacity(capacity);
    }
}