package com.example.demo.Controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.Entity.Notification;
import com.example.demo.Repository.NotificationRepository;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

   
    @GetMapping("/{userId}")
    public ResponseEntity<List<Notification>> getNotifications(@PathVariable Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByTimestampDesc(userId);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/{userId}/unread-count")
    public ResponseEntity<Long> getUnreadCount(@PathVariable Long userId) {
        long count = notificationRepository.countByUserIdAndReadFalse(userId);
        return ResponseEntity.ok(count);
    }

    
    @PutMapping("/{userId}/mark-all-read")
    public ResponseEntity<String> markAllAsRead(@PathVariable Long userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByTimestampDesc(userId);
        notifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifications);
        return ResponseEntity.ok("All notifications marked as read");
    }


    @PostMapping("/create")
    public ResponseEntity<Notification> createNotification(@RequestBody NotificationRequest request) {
        Notification notification = new Notification();
        notification.setUserId(request.getUserId());
        notification.setType(request.getType());
        notification.setMessage(request.getMessage());
        notification.setTimestamp(LocalDateTime.now());
        notification.setRead(false);
    

        notification.setActorUsername(request.getActorUsername());
        notification.setPostId(request.getPostId());
        notification.setCommentText(request.getCommentText());
    
        return ResponseEntity.ok(notificationRepository.save(notification));
    }




    public static class NotificationRequest {
        private Long userId;
        private String type;
        private String message;
        private String actorUsername;
        private Long postId;
        private String commentText;
    
      
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
    
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
    
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    
        public String getActorUsername() { return actorUsername; }
        public void setActorUsername(String actorUsername) { this.actorUsername = actorUsername; }
    
        public Long getPostId() { return postId; }
        public void setPostId(Long postId) { this.postId = postId; }
    
        public String getCommentText() { return commentText; }
        public void setCommentText(String commentText) { this.commentText = commentText; }
    }    
}
