package com.smarttimetablesystem.repositories;

import com.smarttimetablesystem.models.Room;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface RoomRepository extends MongoRepository<Room, String> {

    List<Room> findByType(String type);

    List<Room> findByCapacityGreaterThanEqual(int capacity);
}