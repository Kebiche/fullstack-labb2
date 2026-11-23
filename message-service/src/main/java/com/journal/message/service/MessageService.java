package com.journal.message.service;

import com.journal.message.entity.Message;
import com.journal.message.repository.MessageRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class MessageService {

    private final MessageRepository messageRepository;

    public MessageService(MessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }

    public Message sendMessage(Long senderId, Long receiverId, String content) {
        Message message = new Message(senderId, receiverId, content);
        message.setDate(LocalDate.now());
        return messageRepository.save(message);
    }

    public List<Message> getSentMessages(Long userId) {
        return messageRepository.findBySenderId(userId);
    }

    public List<Message> getReceivedMessages(Long userId) {
        return messageRepository.findByReceiverId(userId);
    }

    public List<Message> getAllMessagesForUser(Long userId) {
        List<Message> sent = messageRepository.findBySenderId(userId);
        List<Message> received = messageRepository.findByReceiverId(userId);
        sent.addAll(received);
        return sent;
    }
}