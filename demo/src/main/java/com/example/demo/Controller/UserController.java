package com.example.demo.Controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.DTO.UserInfoResponse;
import com.example.demo.Entity.LoginActivity;
import com.example.demo.Entity.User;
import com.example.demo.Repository.FriendRequestRepository;
import com.example.demo.Repository.LoginActivityRepository;
import com.example.demo.Repository.UserRepository;
import com.example.demo.Service.UserService;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private FriendRequestRepository friendRequestRepository;

    @Autowired
    private LoginActivityRepository loginActivityRepository;


    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    
    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

   
    @GetMapping("/user/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    @GetMapping("/{id}")
    public ResponseEntity<UserInfoResponse> getUserById(@PathVariable Long id) {
    Optional<User> optionalUser = userRepository.findById(id);
    if (optionalUser.isEmpty()) {
        return ResponseEntity.notFound().build();
    }

    User user = optionalUser.get();
    int count = friendRequestRepository.countAcceptedFriends(id, "accepted");


    UserInfoResponse response = new UserInfoResponse();
    response.setId(user.getId());
    response.setUsername(user.getUsername());
    response.setEmail(user.getEmail());
    response.setName(user.getName());
    response.setProfilePicture(user.getProfilePicture());
    response.setDescription(user.getDescription());
    response.setCity(user.getCity());
    response.setCountry(user.getCountry());
    response.setDateOfBirth(user.getDateOfBirth());
    response.setFriendsCount(count);

    return ResponseEntity.ok(response);

}


   
    @PostMapping
    public User createUser(@RequestBody User user) {
        return userService.createUser(user);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        Optional<User> optionalUser = userRepository.findById(id);
        if (!optionalUser.isPresent()) {
            return ResponseEntity.notFound().build();
        }
    
        User user = optionalUser.get();
        user.setName(userDetails.getName());
        user.setDescription(userDetails.getDescription());
        user.setCity(userDetails.getCity());
        user.setCountry(userDetails.getCountry());
        user.setDateOfBirth(userDetails.getDateOfBirth());
        user.setZodiacSign(userDetails.getZodiacSign());
    
        if (userDetails.getProfilePicture() != null && !userDetails.getProfilePicture().isEmpty()) { 
            user.setProfilePicture(userDetails.getProfilePicture());
        }
    
        User updatedUser = userRepository.save(user);
        return ResponseEntity.ok(updatedUser);
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userService.deleteUser(id);
        return ResponseEntity.ok("User with ID " + id + " has been deleted successfully!");
    }

    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> loginRequest, HttpServletRequest request) {
        String email = loginRequest.get("email");
        String password = loginRequest.get("password");

        User user = userService.loginUser(email, password);

        if (user != null) {
            LoginActivity log = new LoginActivity(
            user.getId(),
            LocalDateTime.now(),
            request.getRemoteAddr(),
            request.getHeader("User-Agent")
        );
        
        loginActivityRepository.save(log);
            return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "name", user.getName(),
                "email", user.getEmail(),
                "message", "Login successful"
            ));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password"));
        }
    }


    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }

        userService.generatePasswordResetToken(email);
        return ResponseEntity.ok(Map.of("message", "If the email exists, a reset link has been sent."));
    }

    @GetMapping("/search")
public List<User> searchUsers(@RequestParam String username, @RequestParam Long currentUserId) {
    List<User> allMatchingUsers = userRepository.findByUsernameContainingIgnoreCase(username);

    List<User> friends = friendRequestRepository.findFriendsByUserId(currentUserId);
    List<Long> pendingIds = friendRequestRepository.findPendingFriendUserIds(currentUserId);

    return allMatchingUsers.stream()
        .filter(user -> !user.getId().equals(currentUserId)) 
        .filter(user -> friends.stream().noneMatch(friend -> friend.getId().equals(user.getId())))
        .filter(user -> !pendingIds.contains(user.getId()))
        .toList();
}
  


   
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");

        userService.resetPassword(token, newPassword);
        return ResponseEntity.ok(Map.of("message", "Password has been reset successfully."));
    }

    @GetMapping("/privacy-settings")
    public ResponseEntity<?> getPrivacySettings(@RequestParam String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        return ResponseEntity.ok(Map.of(
            "showOnlineStatus", user.isShowOnlineStatus(),
            "profileVisibility", user.getProfileVisibility()
        ));
    }

    @PostMapping("/privacy-settings")
    public ResponseEntity<?> updatePrivacySettings(@RequestParam String email, @RequestBody Map<String, Object> updates) {
        User user = userRepository.findByEmail(email).orElseThrow();

        if (updates.containsKey("showOnlineStatus")) {
            user.setShowOnlineStatus((Boolean) updates.get("showOnlineStatus"));
        }

        if (updates.containsKey("profileVisibility")) {
            user.setProfileVisibility((String) updates.get("profileVisibility"));
        }

        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Privacy settings updated successfully"));
    }

    @PutMapping("/privacy-settings")
public ResponseEntity<?> updatePrivacySettings(@RequestBody Map<String, Object> requestData) {
    String email = (String) requestData.get("email");
    boolean showOnlineStatus = (boolean) requestData.get("showOnlineStatus");
    String profileVisibility = (String) requestData.get("profileVisibility");

    Optional<User> userOptional = userRepository.findByEmail(email);
    if (userOptional.isEmpty()) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
    }

    User user = userOptional.get();
    user.setShowOnlineStatus(showOnlineStatus);
    user.setProfileVisibility(profileVisibility);

    userRepository.save(user);

    return ResponseEntity.ok("Privacy settings updated successfully.");
}

@GetMapping("/preview/{id}")
public ResponseEntity<?> getUserPreview(@PathVariable Long id, @RequestParam(required = false) Long viewerId) {
    Optional<User> userOpt = userRepository.findById(id);
    if (userOpt.isEmpty()) {
        return ResponseEntity.notFound().build();
    }

    User user = userOpt.get();
    Map<String, Object> preview = new HashMap<>();
    preview.put("id", user.getId());
    preview.put("username", user.getUsername());
    preview.put("name", user.getName());
    preview.put("description", user.getDescription());
    preview.put("profile_picture", user.getProfilePicture());
    preview.put("city", user.getCity());
    preview.put("country", user.getCountry());
    preview.put("dateOfBirth", user.getDateOfBirth());
    preview.put("show_online_status", user.isShowOnlineStatus());
    preview.put("is_online", user.getLastSeen() != null &&
        user.getLastSeen().isAfter(LocalDateTime.now().minusMinutes(5))); // Calculate online status

 
    String visibility = user.getProfileVisibility();
    boolean isFriend = viewerId != null && friendRequestRepository.countFriends(user.getId(), viewerId) > 0;
    boolean isSelf = viewerId != null && user.getId().equals(viewerId);



    String friendStatus = "not_friend";
if (isSelf) {
    friendStatus = "self";
} else if (friendRequestRepository.countFriends(user.getId(), viewerId) > 0) {
    friendStatus = "friend";
} else if (friendRequestRepository.findBySenderIdAndReceiverId(viewerId, user.getId())
            .filter(req -> "pending".equalsIgnoreCase(req.getStatus()))
            .isPresent()) {
    friendStatus = "pending";
}
preview.put("friendStatus", friendStatus);


    if (!isSelf && (
        "private".equalsIgnoreCase(visibility) ||
        ("friends".equalsIgnoreCase(visibility) && !isFriend)
    )) {
        preview.put("isPrivate", true);
        return ResponseEntity.ok(preview);
    }

    preview.put("isPrivate", false);
    return ResponseEntity.ok(preview);
}


@PostMapping("/ping")
public ResponseEntity<?> pingOnline(@RequestParam Long userId) {
    Optional<User> optionalUser = userRepository.findById(userId);
    if (optionalUser.isEmpty()) {
        return ResponseEntity.notFound().build();
    }

    User user = optionalUser.get();
    user.setLastSeen(LocalDateTime.now());
    userRepository.save(user);

    return ResponseEntity.ok(Map.of("status", "updated"));
}


@GetMapping("/preview-by-username/{username}")
public ResponseEntity<?> getUserPreviewByUsername(@PathVariable String username, @RequestParam(required = false) Long viewerId) {
    Optional<User> userOpt = userRepository.findByUsername(username);
    if (userOpt.isEmpty()) {
        return ResponseEntity.notFound().build();
    }

    User user = userOpt.get();
    Map<String, Object> preview = new HashMap<>();

    preview.put("id", user.getId());
    preview.put("username", user.getUsername());

    String visibility = user.getProfileVisibility();
    boolean isFriend = viewerId != null && friendRequestRepository.countFriends(user.getId(), viewerId) > 0;
    boolean isSelf = viewerId != null && user.getId().equals(viewerId); // ✅ key line

    if (!isSelf && (
        "private".equalsIgnoreCase(visibility) ||
        ("friends".equalsIgnoreCase(visibility) && !isFriend))
    ) {
        preview.put("isPrivate", true);
        return ResponseEntity.ok(preview);
    }

    preview.put("name", user.getName());
    preview.put("description", user.getDescription());
    preview.put("profile_picture", user.getProfilePicture());
    preview.put("profile_visibility", user.getProfileVisibility());
    preview.put("show_online_status", user.isShowOnlineStatus());

    boolean isOnline = user.getLastSeen() != null &&
        user.getLastSeen().isAfter(LocalDateTime.now().minusMinutes(5));
    preview.put("is_online", isOnline);

    preview.put("isPrivate", false);
    return ResponseEntity.ok(preview);
}

}