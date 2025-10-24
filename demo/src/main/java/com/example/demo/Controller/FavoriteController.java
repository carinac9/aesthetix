package com.example.demo.Controller;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.Entity.Notification;
import com.example.demo.Entity.Post;
import com.example.demo.Entity.User;
import com.example.demo.Repository.NotificationRepository;
import com.example.demo.Repository.PostRepository;
import com.example.demo.Repository.UserRepository;
import com.example.demo.Service.FavoriteService;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {
    private final FavoriteService favoriteService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PostRepository postRepository;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @PostMapping("/add")
    public ResponseEntity<Integer> addFavorite(@RequestBody Map<String, Object> requestBody) {
        Long postId = Long.valueOf(requestBody.get("postId").toString());
        Long userId = Long.valueOf(requestBody.get("userId").toString());
    
        favoriteService.favoritePost(postId, userId);
    
        Post post = postRepository.findById(postId).orElse(null);
        if (post != null && !post.getUser().getId().equals(userId)) {
            User actorUser = userRepository.findById(userId).orElse(null);
            if (actorUser != null) {
                Notification notification = new Notification();
                notification.setUserId(post.getUser().getId()); 
                notification.setType("like");
                notification.setMessage("@" + actorUser.getUsername() + " liked your post.");
                notification.setTimestamp(LocalDateTime.now());
                notification.setRead(false);
                notification.setActorUsername(actorUser.getUsername());
                notification.setPostId(postId);
                notificationRepository.save(notification);
            }
        }
    
        int updatedCount = favoriteService.getFavoriteCount(postId);
        return ResponseEntity.ok(updatedCount);
    }
    
    @DeleteMapping("/remove")
    public ResponseEntity<Integer> unfavoritePost(@RequestParam Long postId, @RequestParam Long userId) {
        favoriteService.unfavoritePost(postId, userId);
        int updatedCount = favoriteService.getFavoriteCount(postId);
        return ResponseEntity.ok(updatedCount);
    }

    @GetMapping("/user/{userId}/post/{postId}")
    public ResponseEntity<Boolean> hasUserFavoritedPost(@PathVariable Long userId, @PathVariable Long postId) {
        boolean isFavorited = favoriteService.hasUserFavoritedPost(postId, userId);
        return ResponseEntity.ok(isFavorited);
    }

    @GetMapping("/count/{postId}")
    public ResponseEntity<Integer> getFavoriteCount(@PathVariable Long postId) {
        return ResponseEntity.ok(favoriteService.getFavoriteCount(postId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Post>> getFavoritePosts(@PathVariable Long userId) {
        List<Post> favorites = favoriteService.getFavoritesByUserId(userId);
        if (favorites.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.emptyList());
        }
        return ResponseEntity.ok(favorites);
    }

}