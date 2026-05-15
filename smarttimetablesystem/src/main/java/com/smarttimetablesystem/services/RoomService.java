package com.smarttimetablesystem.services;

import com.smarttimetablesystem.models.Room;
import com.smarttimetablesystem.repositories.RoomRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoomService {

    private final RoomRepository roomRepository;

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    public Room addRoom(Room room) {
        return roomRepository.save(room);
    }

    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    // UPDATE ✅
    public Room updateRoom(String id, Room updatedRoom) {
        Room existing = roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        existing.setRoomNumber(updatedRoom.getRoomNumber());
        existing.setBuilding(updatedRoom.getBuilding());
        existing.setCapacity(updatedRoom.getCapacity());
        existing.setType(updatedRoom.getType());
        existing.setLab(updatedRoom.isLab());

        return roomRepository.save(existing);
    }

    // DELETE ✅
    public void deleteRoom(String id) {
        roomRepository.deleteById(id);
    }

    public List<Room> getRoomsByType(String type) {
        return roomRepository.findByType(type);
    }

    public List<Room> getRoomsByCapacity(int capacity) {
        return roomRepository.findByCapacityGreaterThanEqual(capacity);
    }
}