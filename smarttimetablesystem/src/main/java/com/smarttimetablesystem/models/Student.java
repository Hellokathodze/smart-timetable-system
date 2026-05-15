package com.smarttimetablesystem.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;

@Data
@Document(collection = "students")

@CompoundIndexes({
        @CompoundIndex(
                name = "class_group_index",
                def = "{'branch':1,'semester':1,'division':1}"
        )
})

public class Student {

    @Id
    private String id;

    private String name;

    // Used in API: /students/roll/{rollNo}
    @Indexed(unique = true)
    private int rollNo;

    private String branch;

    private String division;

    private String semester;

    @Indexed(unique = true)
    private String email;
}