package com.example.demo.Entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;
    private String type;
    private String message;
    private LocalDateTime timestamp;
    private String actorUsername;
    private String commentText;
    private Long postId;
    private Long friendRequestId;

    @Column(name = "is_read")
    private boolean read;

    @Column(name = "handled")
    private boolean handled;

    public Notification() {}

    public Notification(Long userId, String type, String message, LocalDateTime timestamp, boolean read) {
        this.userId = userId;
        this.type = type;
        this.message = message;
        this.timestamp = timestamp;
        this.read = read;
    }

    public long getId() {return id;}
    public void setId(long id) {this.id = id;}

    public Long getUserId() {return userId;}
    public void setUserId(Long userId) {this.userId = userId;}

    public String getType() {return type;}
    public void setType(String type) {this.type = type;}

    public String getMessage() {return message;}
    public void setMessage(String message) {this.message = message;}

    public LocalDateTime getTimestamp() {return timestamp;}
    public void setTimestamp(LocalDateTime timestamp) {this.timestamp = timestamp;}

    public boolean isRead() {return read;}
    public void setRead(boolean read) {this.read = read;}

    public String getActorUsername() {return actorUsername;}
    public void setActorUsername(String actorUsername) {this.actorUsername = actorUsername;}

    public String getCommentText() {return commentText;}
    public void setCommentText(String commentText) {this.commentText = commentText;}
    
    public Long getPostId() {return postId;}
    public void setPostId(long postId) {this.postId = postId;}
    
    public Long getFriendRequestId() {return friendRequestId;}
    public void setFriendRequestId(long friendRequestId) {this.friendRequestId = friendRequestId;}

    public boolean isHandled() {return handled;}
    public void setHandled(boolean handled) {this.handled = handled;}
}