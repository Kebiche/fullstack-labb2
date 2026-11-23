package com.journal.message.controller;

import com.journal.message.entity.Message;
import com.journal.message.service.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping
    public ResponseEntity<Message> sendMessage(@RequestBody MessageRequest request) {
        Message message = messageService.sendMessage(
                request.senderId,
                request.receiverId,
                request.content
        );
        return ResponseEntity.ok(message);
    }

    @GetMapping("/sent/{userId}")
    public ResponseEntity<List<Message>> getSentMessages(@PathVariable Long userId) {
        return ResponseEntity.ok(messageService.getSentMessages(userId));
    }

    @GetMapping("/received/{userId}")
    public ResponseEntity<List<Message>> getReceivedMessages(@PathVariable Long userId) {
        return ResponseEntity.ok(messageService.getReceivedMessages(userId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Message>> getAllMessages(@PathVariable Long userId) {
        return ResponseEntity.ok(messageService.getAllMessagesForUser(userId));
    }

    static class MessageRequest {
        public Long senderId;
        public Long receiverId;
        public String content;
    }
}