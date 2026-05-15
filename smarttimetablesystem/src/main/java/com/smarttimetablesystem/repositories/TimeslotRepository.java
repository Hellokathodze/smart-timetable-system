package com.smarttimetablesystem.repositories;

import com.smarttimetablesystem.models.Timeslot;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TimeslotRepository extends MongoRepository<Timeslot, String> {

    // SEARCH BY DAY
    List<Timeslot> findByDay(String day);

    // 🔥 REQUIRED FOR DUPLICATE CHECK
    Optional<Timeslot> findByDayAndSlotNumber(String day, int slotNumber);

    // SEARCH BY TYPE
    List<Timeslot> findByType(String type);

    // OPTIONAL SEARCH
    List<Timeslot> findByDayContainingIgnoreCase(String day);
}