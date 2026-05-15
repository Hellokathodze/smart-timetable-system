package com.smarttimetablesystem.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.CompoundIndex;

@Data
@Document(collection = "reviews")
@CompoundIndex(name = "schedule_teacher_unique", def = "{'scheduleId':1, 'teacherEmail':1}", unique = true)
public class Review {

    @Id
    private String id;

    private String scheduleId;
    private String teacherEmail;
    private String teacherName;
    private String day;
    private int slotNumber;
    private String subjectName;

    // 1 = Approved, 2 = Disapproved
    private int rating;

    private long createdAt;
}