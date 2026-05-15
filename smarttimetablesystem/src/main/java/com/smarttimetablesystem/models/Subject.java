package com.smarttimetablesystem.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;

import java.util.List;

@Data
@Document(collection = "subjects")
@CompoundIndexes({
        @CompoundIndex(name = "branch_semester_index", def = "{'branch': 1, 'semester': 1}")
})
public class Subject {

    @Id
    private String id;

    @Indexed(unique = true)
    private String code;

    private String name;

    @Indexed
    private String branch;

    private String semester;

    @Indexed
    private String teacherId;

    private int credits;

    private int weeklyHours;

    private String type;

    private boolean labRequired;

    private List<String> preferredRooms;

    private List<String> preferredSlots;

    private int maxStudents;
}