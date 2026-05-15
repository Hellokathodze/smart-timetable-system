package com.smarttimetablesystem.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;

@Document(collection = "timeslots")

@CompoundIndexes({
        @CompoundIndex(
                name = "day_slot_unique",
                def = "{'day':1,'slotNumber':1}",
                unique = true
        )
})

public class Timeslot {

    @Id
    private String id;

    // Used in API: /timeslots/day/{day}
    @Indexed
    private String day;

    private int slotNumber;

    private String startTime;

    private String endTime;

    private String type; // THEORY / LAB / BREAK etc.

    public Timeslot() {}

    public Timeslot(String day, int slotNumber, String startTime, String endTime, String type) {
        this.day = day;
        this.slotNumber = slotNumber;
        this.startTime = startTime;
        this.endTime = endTime;
        this.type = type;
    }

    public String getId() {
        return id;
    }

    public String getDay() {
        return day;
    }

    public void setDay(String day) {
        this.day = day;
    }

    public int getSlotNumber() {
        return slotNumber;
    }

    public void setSlotNumber(int slotNumber) {
        this.slotNumber = slotNumber;
    }

    public String getStartTime() {
        return startTime;
    }

    public void setStartTime(String startTime) {
        this.startTime = startTime;
    }

    public String getEndTime() {
        return endTime;
    }

    public void setEndTime(String endTime) {
        this.endTime = endTime;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}