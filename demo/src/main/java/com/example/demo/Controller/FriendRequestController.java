package com.example.demo.Controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.Entity.FriendRequest;
import com.example.demo.Entity.Notification;
import com.example.demo.Entity.User;
import com.example.demo.Repository.FriendRequestRepository;
import com.example.demo.Repository.NotificationRepository;
import com.example.demo.Repository.UserRepository;
import com.example.demo.Service.FriendRequestService;


@RestController
@RequestMapping("/api/friend-requests")
public class FriendRequestController {

    @Autowired
    private FriendRequestService friendRequestService;

    @Autowired
    private FriendRequestRepository friendRequestRepository;


    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

  
    @PostMapping("/send")
    public String sendRequest(@RequestParam Long senderId, @RequestParam Long receiverId) {
        FriendRequest request = friendRequestService.sendAndReturnFriendRequest(senderId, receiverId);
    
        if (request != null) {
            User sender = userRepository.findById(senderId).orElse(null);
            if (sender != null) {
                Notification notification = new Notification();
                notification.setUserId(receiverId);
                notification.setType("friend_request");
                notification.setMessage("@" + sender.getUsername() + " sent you a friend request.");
                notification.setActorUsername(sender.getUsername());
                notification.setFriendRequestId(request.getId()); 
                notification.setTimestamp(LocalDateTime.now());
                notification.setRead(false);
                notificationRepository.save(notification);
            }
            return "Friend request sent successfully!";
        }
    
        return "Friend request already sent!";
    }

    @GetMapping("/friends/{userId}")
    public ResponseEntity<List<User>> getFriends(@PathVariable Long userId) {
        List<User> friends = friendRequestRepository.findFriendsByUserId(userId);
        return ResponseEntity.ok(friends);
    }


    
    @PostMapping("/accept")
    public String acceptRequest(@RequestParam Long requestId) {
        System.out.println("🔥 FriendRequest ACCEPT ID = " + requestId);
        String result = friendRequestService.acceptFriendRequest(requestId);
    
        Optional<FriendRequest> optionalRequest = friendRequestService.getRequestById(requestId);
        if (optionalRequest.isPresent()) {
            FriendRequest request = optionalRequest.get();
    
          
            notificationRepository.findByFriendRequestId(requestId).ifPresent(notification -> {
                notification.setHandled(true);
                notificationRepository.save(notification);
            });
    
   
            User receiver = userRepository.findById(request.getReceiverId()).orElse(null);
            if (receiver != null) {
                Notification notification = new Notification();
                notification.setUserId(request.getSenderId());
                notification.setType("friend_accept");
                notification.setMessage("@" + receiver.getUsername() + " accepted your friend request.");
                notification.setActorUsername(receiver.getUsername());
                notification.setTimestamp(LocalDateTime.now());
                notification.setRead(false);
                notificationRepository.save(notification);
            }
        }
    
        return result;
    }

 
    @PostMapping("/decline")
    public String declineRequest(@RequestParam Long requestId) {
        notificationRepository.findByFriendRequestId(requestId).ifPresent(notification -> {
            notification.setHandled(true);
            notificationRepository.save(notification);
        });
    
        return friendRequestService.declineFriendRequest(requestId);
    }

 
    @GetMapping("/pending/{userId}")
    public ResponseEntity<List<Long>> getPendingRequests(@PathVariable Long userId) {
        List<FriendRequest> requests = friendRequestService.getPendingRequests(userId);

        List<Long> pendingUserIds = requests.stream()
            .map(FriendRequest::getReceiverId)
            .collect(Collectors.toList());

        return ResponseEntity.ok(pendingUserIds);
    }

 
    @GetMapping("/sent/{senderId}")
    public List<FriendRequest> getSentRequests(@PathVariable Long senderId) {
        return friendRequestService.getSentRequests(senderId);
    }

    @PostMapping("/unfriend")
    public String unfriend(@RequestBody Map<String, Long> payload) {
        Long userId1 = payload.get("userId1");
        Long userId2 = payload.get("userId2");

        Optional<FriendRequest> optional = friendRequestRepository
            .findAcceptedBetweenUsers(userId1, userId2);

        if (optional.isPresent()) {
            friendRequestRepository.delete(optional.get());
            return "Friend removed.";
        } else {
            return "Friendship not found.";
        }
    }


}
