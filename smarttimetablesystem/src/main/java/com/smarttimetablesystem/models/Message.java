package com.smarttimetablesystem.models;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.util.List;

@Data
@Document(collection = "messages")
public class Message {

    @Id
    private String id;

    @Indexed
    private String fromEmail;
    private String fromName;

    @Indexed
    private String toTarget;

    // CANCELLATION / SUBSTITUTE_REQUEST / GENERAL / CANCEL_SUBSTITUTE / EXTENSION
    @Indexed
    private String type;

    private String content;

    private String scheduleId;
    private String day;
    private int slotNumber;
    private String subjectName;

    // PENDING / ACKNOWLEDGED / RESOLVED / CANCELLED / APPROVED / REJECTED
    @Indexed
    private String status;

    private long createdAt;

    private String response;
    private String resolvedBy;
    private long resolvedAt;

    // Track original teacher for substitute undo
    private String originalTeacherId;
    private String originalTeacherName;

    // Track substitute teacher
    private String substituteTeacherId;
    private String substituteTeacherName;

    // ✅ For CANCEL_SUBSTITUTE — reference to the original substitute message
    private String relatedMessageId;

    // ✅ For EXTENSION — which slots to extend into
    private List<Integer> extensionSlots;

    // ✅ For EXTENSION — affected teachers (whose slots will be taken)
    private List<String> affectedTeacherNames;
    private List<String> affectedTeacherEmails;
    private List<String> affectedScheduleIds;
}