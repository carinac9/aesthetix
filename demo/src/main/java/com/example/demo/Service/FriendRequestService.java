package com.example.demo.Service;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.demo.Entity.FriendRequest;
import com.example.demo.Repository.FriendRequestRepository;

@Service
public class FriendRequestService {

    @Autowired
    private FriendRequestRepository friendRequestRepository;

    public String sendFriendRequest(Long senderId, Long receiverId) {
        if (friendRequestRepository.findBySenderIdAndReceiverId(senderId, receiverId).isPresent()) {
            return "Friend request already sent!";
        }

        FriendRequest request = new FriendRequest(senderId, receiverId, "pending");
        friendRequestRepository.save(request);
        return "Friend request sent successfully!";
    }

    public String acceptFriendRequest(Long requestId) {
        Optional<FriendRequest> requestOpt = friendRequestRepository.findById(requestId);
        if (requestOpt.isPresent()) {
            FriendRequest request = requestOpt.get();
            request.setStatus("accepted");
            friendRequestRepository.save(request);
            return "Friend request accepted!";
        }
        return "Friend request not found!";
    }

    public String declineFriendRequest(Long requestId) {
        Optional<FriendRequest> requestOpt = friendRequestRepository.findById(requestId);
        if (requestOpt.isPresent()) {
            FriendRequest request = requestOpt.get();
            request.setStatus("declined");
            friendRequestRepository.save(request);
            return "Friend request declined!";
        }
        return "Friend request not found!";
    }

    public List<FriendRequest> getSentRequests(Long senderId) {
        return friendRequestRepository.findBySenderId(senderId);
    }

    public List<FriendRequest> getPendingRequests(Long userId) {
        return friendRequestRepository.findBySenderIdAndStatus(userId, "pending");
    }
    
    public Optional<FriendRequest> getRequestById(Long requestId) {
        return friendRequestRepository.findById(requestId);
    }

    public FriendRequest sendAndReturnFriendRequest(Long senderId, Long receiverId) {
        if (friendRequestRepository.findBySenderIdAndReceiverId(senderId, receiverId).isPresent()) {
            return null;
        }
        FriendRequest request = new FriendRequest(senderId, receiverId, "pending");
        return friendRequestRepository.save(request);
    }
    
    
    

}