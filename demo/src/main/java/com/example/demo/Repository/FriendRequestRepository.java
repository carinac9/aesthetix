package com.example.demo.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.demo.Entity.FriendRequest;
import com.example.demo.Entity.User;

@Repository
public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {

    Optional<FriendRequest> findBySenderIdAndReceiverId(Long senderId, Long receiverId);

    List<FriendRequest> findByReceiverIdAndStatus(Long receiverId, String status);

    List<FriendRequest> findBySenderId(Long senderId);

    List<FriendRequest> findBySenderIdAndStatus(Long senderId, String status);

    @Query("SELECT COUNT(fr) FROM FriendRequest fr WHERE (fr.senderId = :userId OR fr.receiverId = :userId) AND fr.status = :status")
        int countAcceptedFriends(@Param("userId") Long userId, @Param("status") String status);

    @Query("SELECT u FROM User u WHERE u.id IN (" +
       "SELECT CASE WHEN fr.senderId = :userId THEN fr.receiverId ELSE fr.senderId END " +
       "FROM FriendRequest fr WHERE (fr.senderId = :userId OR fr.receiverId = :userId) AND fr.status = 'accepted')")
    List<User> findFriendsByUserId(@Param("userId") Long userId);

    @Query("SELECT fr FROM FriendRequest fr WHERE " +
       "((fr.senderId = :user1 AND fr.receiverId = :user2) OR " +
       " (fr.senderId = :user2 AND fr.receiverId = :user1)) " +
       "AND fr.status = 'accepted'")
    Optional<FriendRequest> findAcceptedBetweenUsers(
        @Param("user1") Long user1,
        @Param("user2") Long user2);

    @Query("SELECT CASE WHEN fr.senderId = :userId THEN fr.receiverId ELSE fr.senderId END " +
        "FROM FriendRequest fr " +
        "WHERE (fr.senderId = :userId OR fr.receiverId = :userId) AND fr.status = 'pending'")
    List<Long> findPendingFriendUserIds(@Param("userId") Long userId);
 
    @Query("SELECT COUNT(fr) FROM FriendRequest fr WHERE " +
       "((fr.senderId = :userId AND fr.receiverId = :viewerId) OR " +
       "(fr.senderId = :viewerId AND fr.receiverId = :userId)) " +
       "AND fr.status = 'accepted'")
    Long countFriends(@Param("userId") Long userId, @Param("viewerId") Long viewerId);






}
