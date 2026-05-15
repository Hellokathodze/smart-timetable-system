package com.smarttimetablesystem.controllers;

import com.smarttimetablesystem.models.Message;
import com.smarttimetablesystem.models.Schedule;
import com.smarttimetablesystem.services.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/messages")
@CrossOrigin(origins = "*")
public class MessageController {

    @Autowired private MessageService messageService;

    @PostMapping
    public Message sendMessage(@RequestBody Message message, Authentication auth) {
        message.setFromEmail(auth.getName());
        message.setToTarget("HEAD_TEACHER");
        return messageService.sendMessage(message);
    }

    @PostMapping("/extension")
    public Message sendExtension(@RequestBody Message message, Authentication auth) {
        message.setFromEmail(auth.getName());
        message.setFromName(auth.getName());
        message.setToTarget("HEAD_TEACHER");
        return messageService.sendExtensionRequest(message);
    }

    @GetMapping("/my")
    public List<Message> getMyMessages(Authentication auth) { return messageService.getMyMessages(auth.getName()); }

    // ✅ Messages received BY this teacher (notifications)
    @GetMapping("/received")
    public List<Message> getReceivedMessages(Authentication auth) {
        return messageService.getReceivedMessages(auth.getName());
    }

    @GetMapping("/inbox")
    public List<Message> getInboxMessages() { return messageService.getInboxMessages(); }

    @GetMapping
    public List<Message> getAllMessages() { return messageService.getAllMessages(); }

    @PutMapping("/{id}/acknowledge")
    public ResponseEntity<?> acknowledge(@PathVariable String id, Authentication auth) {
        Message msg = messageService.acknowledgeMessage(id, auth.getName());
        return msg != null ? ResponseEntity.ok(msg) : ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<?> resolve(@PathVariable String id, @RequestBody Map<String, String> body, Authentication auth) {
        Message msg = messageService.resolveMessage(id, auth.getName(), body.getOrDefault("response", "Resolved"));
        return msg != null ? ResponseEntity.ok(msg) : ResponseEntity.notFound().build();
    }

    @GetMapping("/free-teachers")
    public List<Map<String, Object>> getFreeTeachers(@RequestParam String day, @RequestParam int slot) {
        return messageService.getFreeTeachers(day, slot);
    }

    @GetMapping("/slot-info")
    public List<Map<String, Object>> getSlotInfo(@RequestParam String day, @RequestParam List<Integer> slots) {
        return messageService.getSlotInfo(day, slots);
    }

    @PutMapping("/substitute")
    public ResponseEntity<?> substitute(@RequestBody Map<String, Object> body) {
        String messageId = (String) body.get("messageId");
        String scheduleId = (String) body.get("scheduleId");
        String newTeacherId = (String) body.get("newTeacherId");
        String day = (String) body.get("day");
        int slot = 0;
        try { Object so = body.get("slot"); slot = so instanceof Number ? ((Number) so).intValue() : Integer.parseInt(so.toString()); } catch (Exception e) {}
        if (newTeacherId == null) return ResponseEntity.badRequest().body(Map.of("error", "newTeacherId required"));
        Schedule updated = messageService.substituteAndTrack(messageId, scheduleId, day, slot, newTeacherId);
        return updated != null ? ResponseEntity.ok(Map.of("message", "Substituted", "newTeacher", updated.getTeacherName())) :
                ResponseEntity.badRequest().body(Map.of("error", "Failed"));
    }

    @PostMapping("/{id}/request-cancel-substitute")
    public ResponseEntity<?> requestCancelSub(@PathVariable String id, Authentication auth) {
        Message r = messageService.requestCancelSubstitute(id, auth.getName());
        return r != null ? ResponseEntity.ok(Map.of("message", "Request sent")) : ResponseEntity.badRequest().body(Map.of("error", "Failed"));
    }

    @PutMapping("/{id}/approve-cancel-substitute")
    public ResponseEntity<?> approveCancelSub(@PathVariable String id, Authentication auth) {
        Schedule r = messageService.approveCancelSubstitute(id, auth.getName());
        return r != null ? ResponseEntity.ok(Map.of("message", "Restored", "teacher", r.getTeacherName())) : ResponseEntity.badRequest().body(Map.of("error", "Failed"));
    }

    @PutMapping("/{id}/approve-extension")
    public ResponseEntity<?> approveExt(@PathVariable String id, Authentication auth) {
        boolean ok = messageService.approveExtension(id, auth.getName());
        return ok ? ResponseEntity.ok(Map.of("message", "Approved")) : ResponseEntity.badRequest().body(Map.of("error", "Failed"));
    }

    @PutMapping("/{id}/cancel-extension")
    public ResponseEntity<?> cancelExt(@PathVariable String id, Authentication auth) {
        boolean ok = messageService.cancelExtension(id, auth.getName());
        return ok ? ResponseEntity.ok(Map.of("message", "Cancelled")) : ResponseEntity.badRequest().body(Map.of("error", "Failed"));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> reject(@PathVariable String id, @RequestBody(required = false) Map<String, String> body, Authentication auth) {
        String reason = body != null ? body.getOrDefault("reason", "Rejected") : "Rejected";
        Message msg = messageService.rejectRequest(id, auth.getName(), reason);
        return msg != null ? ResponseEntity.ok(msg) : ResponseEntity.notFound().build();
    }
}