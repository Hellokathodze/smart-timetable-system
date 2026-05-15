package com.smarttimetablesystem.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

@Document(collection = "rooms")
public class Room {

    @Id
    private String id;

    // Unique room identifier
    @Indexed(unique = true)
    private String roomNumber;

    private String building;

    // Used in capacity search API
    @Indexed
    private int capacity;

    // Used in type search API
    @Indexed
    private String type;   // CLASSROOM or LAB

    private boolean lab;

    public Room() {}

    public Room(String roomNumber, String building, int capacity, String type, boolean lab) {
        this.roomNumber = roomNumber;
        this.building = building;
        this.capacity = capacity;
        this.type = type;
        this.lab = lab;
    }

    public String getId() {
        return id;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public String getBuilding() {
        return building;
    }

    public void setBuilding(String building) {
        this.building = building;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public boolean isLab() {
        return lab;
    }

    public void setLab(boolean lab) {
        this.lab = lab;
    }
}