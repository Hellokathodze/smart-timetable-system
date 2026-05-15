package com.smarttimetablesystem.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;

@Document(collection = "schedules")

@CompoundIndexes({

        // Prevent same class having two lectures at same time
        @CompoundIndex(
                name = "class_slot_unique",
                def = "{'branch':1,'division':1,'timeslotId':1}",
                unique = true
        ),

        // Prevent teacher teaching two classes at same time
        @CompoundIndex(
                name = "teacher_slot_unique",
                def = "{'teacherId':1,'timeslotId':1}",
                unique = true
        ),

        // Prevent room being used twice at same time
        @CompoundIndex(
                name = "room_slot_unique",
                def = "{'roomId':1,'timeslotId':1}",
                unique = true
        )
})

public class Schedule {

    @Id
    private String id;

    @Indexed
    private String branch;

    @Indexed
    private String division;

    private String semester;

    private String subjectId;
    private String subjectName;

    @Indexed
    private String teacherId;

    private String teacherName;

    @Indexed
    private String roomId;

    private String roomNumber;

    @Indexed
    private String timeslotId;

    private String day;

    private int slotNumber;

    public Schedule() {}

    public String getId() {
        return id;
    }

    public String getBranch() {
        return branch;
    }

    public void setBranch(String branch) {
        this.branch = branch;
    }

    public String getDivision() {
        return division;
    }

    public void setDivision(String division) {
        this.division = division;
    }

    public String getSemester() {
        return semester;
    }

    public void setSemester(String semester) {
        this.semester = semester;
    }

    public String getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(String subjectId) {
        this.subjectId = subjectId;
    }

    public String getSubjectName() {
        return subjectName;
    }

    public void setSubjectName(String subjectName) {
        this.subjectName = subjectName;
    }

    public String getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(String teacherId) {
        this.teacherId = teacherId;
    }

    public String getTeacherName() {
        return teacherName;
    }

    public void setTeacherName(String teacherName) {
        this.teacherName = teacherName;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getRoomNumber() {
        return roomNumber;
    }

    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public String getTimeslotId() {
        return timeslotId;
    }

    public void setTimeslotId(String timeslotId) {
        this.timeslotId = timeslotId;
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
}