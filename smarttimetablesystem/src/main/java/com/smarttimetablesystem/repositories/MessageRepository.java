package com.smarttimetablesystem.repositories;

import com.smarttimetablesystem.models.Message;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface MessageRepository extends MongoRepository<Message, String> {

    List<Message> findByFromEmailOrderByCreatedAtDesc(String fromEmail);

    List<Message> findByStatusOrderByCreatedAtDesc(String status);

    List<Message> findAllByOrderByCreatedAtDesc();

    List<Message> findByTypeOrderByCreatedAtDesc(String type);

    List<Message> findByStatusInOrderByCreatedAtDesc(List<String> statuses);

    // ✅ Find messages targeted TO a specific teacher (notifications they received)
    List<Message> findByToTargetOrderByCreatedAtDesc(String toTarget);
}