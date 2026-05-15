package com.smarttimetablesystem.services;

import com.smarttimetablesystem.models.Message;
import com.smarttimetablesystem.models.Schedule;
import com.smarttimetablesystem.models.Teacher;
import com.smarttimetablesystem.repositories.MessageRepository;
import com.smarttimetablesystem.repositories.ScheduleRepository;
import com.smarttimetablesystem.repositories.TeacherRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class MessageService {

    @Autowired private MessageRepository messageRepository;
    @Autowired private ScheduleRepository scheduleRepository;
    @Autowired private TeacherRepository teacherRepository;

    public Message sendMessage(Message message) {
        message.setStatus("PENDING");
        message.setCreatedAt(System.currentTimeMillis());

        if ((message.getScheduleId() == null || message.getScheduleId().isEmpty())
                && message.getDay() != null && message.getSlotNumber() > 0) {
            String timeslotId = message.getDay().toUpperCase() + "-" + message.getSlotNumber();
            scheduleRepository.findAll().stream()
                    .filter(s -> timeslotId.equals(s.getTimeslotId()))
                    .filter(s -> !"BREAK".equals(s.getSubjectName()))
                    .findFirst()
                    .ifPresent(s -> {
                        message.setScheduleId(s.getId());
                        message.setOriginalTeacherId(s.getTeacherId());
                        message.setOriginalTeacherName(s.getTeacherName());
                    });
        }

        return messageRepository.save(message);
    }

    public Message sendExtensionRequest(Message message) {
        message.setType("EXTENSION");
        message.setStatus("PENDING");
        message.setCreatedAt(System.currentTimeMillis());

        String requesterName = message.getFromEmail();
        List<Teacher> requesters = teacherRepository.findByEmailContainingIgnoreCase(message.getFromEmail());
        if (!requesters.isEmpty()) {
            requesterName = requesters.get(0).getName();
            message.setFromName(requesterName);
        }

        if (message.getDay() != null && message.getExtensionSlots() != null) {
            List<String> affectedNames = new ArrayList<>();
            List<String> affectedEmails = new ArrayList<>();
            List<String> affectedScheduleIds = new ArrayList<>();

            for (int slot : message.getExtensionSlots()) {
                String timeslotId = message.getDay().toUpperCase() + "-" + slot;
                scheduleRepository.findAll().stream()
                        .filter(s -> timeslotId.equals(s.getTimeslotId()))
                        .filter(s -> !"BREAK".equals(s.getSubjectName()))
                        .findFirst()
                        .ifPresent(s -> {
                            affectedNames.add(s.getTeacherName());
                            affectedScheduleIds.add(s.getId());
                            Teacher t = teacherRepository.findById(s.getTeacherId()).orElse(null);
                            if (t != null) affectedEmails.add(t.getEmail());
                        });
            }

            message.setAffectedTeacherNames(affectedNames);
            message.setAffectedTeacherEmails(affectedEmails);
            message.setAffectedScheduleIds(affectedScheduleIds);

            final String finalRequesterName = requesterName;
            for (int i = 0; i < affectedEmails.size(); i++) {
                Message notification = new Message();
                notification.setFromEmail(message.getFromEmail());
                notification.setFromName(finalRequesterName);
                notification.setToTarget(affectedEmails.get(i));
                notification.setType("GENERAL");
                notification.setContent(
                        finalRequesterName + " has requested to extend their lecture (" +
                                (message.getSubjectName() != null ? message.getSubjectName() : "a subject") +
                                ") into your slot on " + message.getDay() + " Slot " +
                                message.getExtensionSlots().get(i) +
                                ". This request is pending approval from Head Teacher / Admin."
                );
                notification.setDay(message.getDay());
                notification.setSlotNumber(message.getExtensionSlots().get(i));
                notification.setSubjectName(i < affectedNames.size() ? affectedNames.get(i) : "");
                notification.setStatus("PENDING");
                notification.setCreatedAt(System.currentTimeMillis());
                messageRepository.save(notification);
            }
        }

        if (message.getDay() != null && message.getSlotNumber() > 0) {
            String tid = message.getDay().toUpperCase() + "-" + message.getSlotNumber();
            scheduleRepository.findAll().stream()
                    .filter(s -> tid.equals(s.getTimeslotId()) && !"BREAK".equals(s.getSubjectName()))
                    .findFirst()
                    .ifPresent(s -> message.setScheduleId(s.getId()));
        }

        return messageRepository.save(message);
    }

    public boolean approveExtension(String messageId, String approvedBy) {
        Message msg = messageRepository.findById(messageId).orElse(null);
        if (msg == null || !"EXTENSION".equals(msg.getType())) return false;

        List<Teacher> teachers = teacherRepository.findByEmailContainingIgnoreCase(msg.getFromEmail());
        if (teachers.isEmpty()) return false;
        Teacher requestingTeacher = teachers.get(0);

        Schedule originalSchedule = null;
        if (msg.getScheduleId() != null) {
            originalSchedule = scheduleRepository.findById(msg.getScheduleId()).orElse(null);
        }
        if (originalSchedule == null && msg.getDay() != null && msg.getSlotNumber() > 0) {
            String tid = msg.getDay().toUpperCase() + "-" + msg.getSlotNumber();
            originalSchedule = scheduleRepository.findAll().stream()
                    .filter(s -> tid.equals(s.getTimeslotId()) && !"BREAK".equals(s.getSubjectName()))
                    .findFirst().orElse(null);
        }

        if (originalSchedule == null) return false;

        final Schedule finalOriginalSchedule = originalSchedule;

        if (msg.getExtensionSlots() != null) {
            for (int slot : msg.getExtensionSlots()) {
                String timeslotId = msg.getDay().toUpperCase() + "-" + slot;
                scheduleRepository.findAll().stream()
                        .filter(s -> timeslotId.equals(s.getTimeslotId()) && !"BREAK".equals(s.getSubjectName()))
                        .findFirst()
                        .ifPresent(s -> {
                            s.setTeacherId(requestingTeacher.getId());
                            s.setTeacherName(requestingTeacher.getName());
                            s.setSubjectId(finalOriginalSchedule.getSubjectId());
                            s.setSubjectName(finalOriginalSchedule.getSubjectName() + " (Extended)");
                            scheduleRepository.save(s);
                        });
            }
        }

        if (msg.getAffectedTeacherEmails() != null) {
            for (int i = 0; i < msg.getAffectedTeacherEmails().size(); i++) {
                Message notification = new Message();
                notification.setFromEmail(approvedBy);
                notification.setFromName("Head Teacher / Admin");
                notification.setToTarget(msg.getAffectedTeacherEmails().get(i));
                notification.setType("GENERAL");
                notification.setContent(
                        "APPROVED: Your lecture on " + msg.getDay() + " Slot " +
                                (msg.getExtensionSlots() != null && i < msg.getExtensionSlots().size() ? msg.getExtensionSlots().get(i) : "?") +
                                " has been reassigned to " + requestingTeacher.getName() +
                                " for lecture extension of " + (msg.getSubjectName() != null ? msg.getSubjectName() : "a subject") +
                                ". Approved by " + approvedBy + "."
                );
                notification.setDay(msg.getDay());
                notification.setStatus("PENDING");
                notification.setCreatedAt(System.currentTimeMillis());
                messageRepository.save(notification);
            }
        }

        msg.setStatus("APPROVED");
        msg.setResolvedBy(approvedBy);
        msg.setResponse("Extension approved — " + msg.getExtensionSlots().size() + " slot(s) reassigned");
        msg.setResolvedAt(System.currentTimeMillis());
        messageRepository.save(msg);

        return true;
    }

    public boolean cancelExtension(String messageId, String cancelledBy) {
        Message msg = messageRepository.findById(messageId).orElse(null);
        if (msg == null || !"EXTENSION".equals(msg.getType())) return false;
        if (!"APPROVED".equals(msg.getStatus())) return false;

        if (msg.getAffectedScheduleIds() != null && msg.getAffectedTeacherNames() != null) {
            for (int i = 0; i < msg.getAffectedScheduleIds().size(); i++) {
                String schedId = msg.getAffectedScheduleIds().get(i);
                Schedule s = scheduleRepository.findById(schedId).orElse(null);
                if (s != null) {
                    String origName = i < msg.getAffectedTeacherNames().size() ? msg.getAffectedTeacherNames().get(i) : null;
                    if (origName != null) {
                        teacherRepository.findAll().stream()
                                .filter(t -> origName.equals(t.getName()))
                                .findFirst()
                                .ifPresent(t -> {
                                    s.setTeacherId(t.getId());
                                    s.setTeacherName(t.getName());
                                });
                        scheduleRepository.save(s);
                    }
                }
            }
        }

        if (msg.getAffectedTeacherEmails() != null) {
            for (int i = 0; i < msg.getAffectedTeacherEmails().size(); i++) {
                Message notification = new Message();
                notification.setFromEmail(cancelledBy);
                notification.setFromName("System");
                notification.setToTarget(msg.getAffectedTeacherEmails().get(i));
                notification.setType("GENERAL");
                notification.setContent(
                        "The lecture extension on " + msg.getDay() +
                                " Slot " + (msg.getExtensionSlots() != null && i < msg.getExtensionSlots().size() ? msg.getExtensionSlots().get(i) : "?") +
                                " has been CANCELLED. Your original slot has been restored."
                );
                notification.setDay(msg.getDay());
                notification.setStatus("PENDING");
                notification.setCreatedAt(System.currentTimeMillis());
                messageRepository.save(notification);
            }
        }

        msg.setStatus("CANCELLED");
        msg.setResponse("Extension cancelled — original teachers restored");
        msg.setResolvedAt(System.currentTimeMillis());
        messageRepository.save(msg);

        return true;
    }

    public Message requestCancelSubstitute(String originalMessageId, String requestedBy) {
        Message original = messageRepository.findById(originalMessageId).orElse(null);
        if (original == null) return null;

        Message cancelRequest = new Message();
        cancelRequest.setFromEmail(requestedBy);
        cancelRequest.setFromName(requestedBy);
        cancelRequest.setToTarget("HEAD_TEACHER");
        cancelRequest.setType("CANCEL_SUBSTITUTE");
        cancelRequest.setContent("Request to cancel substitute and restore original assignment for " +
                (original.getSubjectName() != null ? original.getSubjectName() : "lecture") +
                " on " + original.getDay() + " Slot " + original.getSlotNumber());
        cancelRequest.setDay(original.getDay());
        cancelRequest.setSlotNumber(original.getSlotNumber());
        cancelRequest.setSubjectName(original.getSubjectName());
        cancelRequest.setScheduleId(original.getScheduleId());
        cancelRequest.setOriginalTeacherId(original.getOriginalTeacherId());
        cancelRequest.setOriginalTeacherName(original.getOriginalTeacherName());
        cancelRequest.setSubstituteTeacherId(original.getSubstituteTeacherId());
        cancelRequest.setSubstituteTeacherName(original.getSubstituteTeacherName());
        cancelRequest.setRelatedMessageId(originalMessageId);
        cancelRequest.setStatus("PENDING");
        cancelRequest.setCreatedAt(System.currentTimeMillis());

        return messageRepository.save(cancelRequest);
    }

    public Schedule approveCancelSubstitute(String messageId, String approvedBy) {
        Message msg = messageRepository.findById(messageId).orElse(null);
        if (msg == null || !"CANCEL_SUBSTITUTE".equals(msg.getType())) return null;

        String scheduleId = msg.getScheduleId();
        String originalTeacherId = msg.getOriginalTeacherId();
        String originalTeacherName = msg.getOriginalTeacherName();

        if (scheduleId == null || originalTeacherId == null) return null;

        Schedule schedule = scheduleRepository.findById(scheduleId).orElse(null);
        if (schedule == null) return null;

        schedule.setTeacherId(originalTeacherId);
        schedule.setTeacherName(originalTeacherName);
        Schedule restored = scheduleRepository.save(schedule);

        msg.setStatus("APPROVED");
        msg.setResolvedBy(approvedBy);
        msg.setResponse("Approved — original teacher " + originalTeacherName + " restored");
        msg.setResolvedAt(System.currentTimeMillis());
        messageRepository.save(msg);

        if (msg.getRelatedMessageId() != null) {
            Message original = messageRepository.findById(msg.getRelatedMessageId()).orElse(null);
            if (original != null) {
                original.setStatus("CANCELLED");
                original.setResponse("Substitute cancelled — original teacher restored");
                messageRepository.save(original);
            }
        }

        return restored;
    }

    public Message rejectRequest(String messageId, String rejectedBy, String reason) {
        Message msg = messageRepository.findById(messageId).orElse(null);
        if (msg != null) {
            msg.setStatus("REJECTED");
            msg.setResolvedBy(rejectedBy);
            msg.setResponse(reason != null ? reason : "Request rejected");
            msg.setResolvedAt(System.currentTimeMillis());
            return messageRepository.save(msg);
        }
        return null;
    }

    public List<Message> getMyMessages(String email) {
        return messageRepository.findByFromEmailOrderByCreatedAtDesc(email);
    }

    // ✅ NEW: Get messages targeted TO this teacher (notifications they received)
    public List<Message> getReceivedMessages(String email) {
        return messageRepository.findByToTargetOrderByCreatedAtDesc(email);
    }

    public List<Message> getInboxMessages() {
        return messageRepository.findByStatusInOrderByCreatedAtDesc(Arrays.asList("PENDING", "ACKNOWLEDGED"));
    }

    public List<Message> getAllMessages() {
        return messageRepository.findAllByOrderByCreatedAtDesc();
    }

    public Message acknowledgeMessage(String messageId, String resolvedBy) {
        Message msg = messageRepository.findById(messageId).orElse(null);
        if (msg != null) { msg.setStatus("ACKNOWLEDGED"); msg.setResolvedBy(resolvedBy); msg.setResolvedAt(System.currentTimeMillis()); return messageRepository.save(msg); }
        return null;
    }

    public Message resolveMessage(String messageId, String resolvedBy, String response) {
        Message msg = messageRepository.findById(messageId).orElse(null);
        if (msg != null) { msg.setStatus("RESOLVED"); msg.setResolvedBy(resolvedBy); msg.setResponse(response); msg.setResolvedAt(System.currentTimeMillis()); return messageRepository.save(msg); }
        return null;
    }

    public List<Map<String, Object>> getFreeTeachers(String day, int slotNumber) {
        String timeslotId = day.toUpperCase() + "-" + slotNumber;
        List<Teacher> allTeachers = teacherRepository.findAll();
        Set<String> busyIds = new HashSet<>();
        Set<String> busyNames = new HashSet<>();
        scheduleRepository.findAll().stream()
                .filter(s -> timeslotId.equals(s.getTimeslotId()) && !"BREAK".equals(s.getSubjectName()))
                .forEach(s -> { busyIds.add(s.getTeacherId()); busyNames.add(s.getTeacherName()); });
        List<Map<String, Object>> free = new ArrayList<>();
        for (Teacher t : allTeachers) {
            if (!busyIds.contains(t.getId()) && !busyNames.contains(t.getName())) {
                Map<String, Object> e = new HashMap<>(); e.put("id", t.getId()); e.put("name", t.getName()); e.put("email", t.getEmail()); e.put("department", t.getDepartment()); free.add(e);
            }
        }
        return free;
    }

    public List<Map<String, Object>> getSlotInfo(String day, List<Integer> slots) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (int slot : slots) {
            String timeslotId = day.toUpperCase() + "-" + slot;
            Map<String, Object> info = new HashMap<>();
            info.put("slot", slot);
            Schedule s = scheduleRepository.findAll().stream()
                    .filter(sc -> timeslotId.equals(sc.getTimeslotId()) && !"BREAK".equals(sc.getSubjectName()))
                    .findFirst().orElse(null);
            if (s != null) {
                info.put("subject", s.getSubjectName()); info.put("teacher", s.getTeacherName()); info.put("scheduleId", s.getId()); info.put("occupied", true);
            } else {
                info.put("occupied", false);
            }
            result.add(info);
        }
        return result;
    }

    public Schedule substituteAndTrack(String messageId, String scheduleId, String day, int slot, String newTeacherId) {
        Schedule schedule = null;
        if (scheduleId != null && !scheduleId.isEmpty()) schedule = scheduleRepository.findById(scheduleId).orElse(null);
        if (schedule == null && day != null && slot > 0) {
            String tid = day.toUpperCase() + "-" + slot;
            schedule = scheduleRepository.findAll().stream().filter(s -> tid.equals(s.getTimeslotId()) && !"BREAK".equals(s.getSubjectName())).findFirst().orElse(null);
        }
        if (schedule == null) return null;

        Message msg = messageId != null ? messageRepository.findById(messageId).orElse(null) : null;
        if (msg != null) { msg.setOriginalTeacherId(schedule.getTeacherId()); msg.setOriginalTeacherName(schedule.getTeacherName()); }

        Teacher newTeacher = teacherRepository.findById(newTeacherId).orElse(null);
        if (newTeacher == null) return null;

        String timeslotId = schedule.getTimeslotId();
        boolean conflict = scheduleRepository.findAll().stream().filter(s -> timeslotId.equals(s.getTimeslotId()) && !"BREAK".equals(s.getSubjectName())).anyMatch(s -> newTeacherId.equals(s.getTeacherId()));
        if (conflict) return null;

        schedule.setTeacherId(newTeacherId); schedule.setTeacherName(newTeacher.getName());
        Schedule updated = scheduleRepository.save(schedule);

        if (msg != null) {
            msg.setSubstituteTeacherId(newTeacherId); msg.setSubstituteTeacherName(newTeacher.getName());
            msg.setScheduleId(updated.getId()); msg.setStatus("RESOLVED");
            msg.setResponse("Substituted with " + newTeacher.getName()); msg.setResolvedAt(System.currentTimeMillis());
            messageRepository.save(msg);
        }
        return updated;
    }
}