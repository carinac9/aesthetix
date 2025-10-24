package com.example.demo.Controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.DTO.CommentResponseDTO;
import com.example.demo.Entity.Comment;
import com.example.demo.Entity.Notification;
import com.example.demo.Entity.Post;
import com.example.demo.Entity.User;
import com.example.demo.Repository.NotificationRepository;
import com.example.demo.Repository.PostRepository;
import com.example.demo.Repository.UserRepository;
import com.example.demo.Service.CommentService;

@RestController
@RequestMapping("/api/comments")
public class CommentController {
    private final CommentService commentService;

    @Autowired
    private UserRepository userRepository;


    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PostRepository postRepository;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping("/add")
    public ResponseEntity<Comment> addComment(@RequestBody Map<String, Object> requestBody) {
        Long postId = Long.valueOf(requestBody.get("postId").toString());
        Long userId = Long.valueOf(requestBody.get("userId").toString());
        String commentText = requestBody.get("commentText").toString();
    
        Comment createdComment = commentService.addComment(postId, userId, commentText);
    
        Post post = postRepository.findById(postId).orElse(null);
        User commentingUser = userRepository.findById(userId).orElse(null);
    
        if (post != null && commentingUser != null && !post.getUser().getId().equals(userId)) {
            Notification notification = new Notification();
            notification.setUserId(post.getUser().getId()); // post owner
            notification.setType("comment");
            notification.setMessage(" commented on your post.");
            notification.setActorUsername(commentingUser.getUsername()); // show @username
            notification.setPostId(postId);
            notification.setCommentText(commentText); // content of the comment
            notification.setTimestamp(LocalDateTime.now());
            notification.setRead(false);
    
            notificationRepository.save(notification);
        }
    
        return ResponseEntity.ok(createdComment);
    }

    @GetMapping("/{postId}")
    public ResponseEntity<List<CommentResponseDTO>> getCommentsForPost(@PathVariable Long postId) {
    return ResponseEntity.ok(commentService.getCommentsAsDTOs(postId));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId) {
        commentService.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }
}
