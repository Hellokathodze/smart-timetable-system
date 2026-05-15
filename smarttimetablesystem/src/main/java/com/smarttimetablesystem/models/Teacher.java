package com.smarttimetablesystem.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.util.List;

@Data
@Document(collection = "teachers")
public class Teacher {

    @Id
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    @Indexed
    private String department;

    @Indexed
    private List<String> subjects;

    private List<String> availability;

    private int maxWeeklyLoad;

    // ✅ NEW: Head Teacher — can generate timetable (granted by Admin)
    private boolean canGenerate;
}