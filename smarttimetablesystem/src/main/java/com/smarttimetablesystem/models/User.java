package com.smarttimetablesystem.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

@Data
@Document(collection = "users")
public class User {

    @Id
    private String id;

    private String name;

    // Used for login
    @Indexed(unique = true)
    private String email;

    // Password should NOT be indexed
    private String password;

    // ADMIN / FACULTY / STUDENT
    @Indexed
    private String role;
}