package com.example.demo.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.example.demo.Entity.Favorite;
import com.example.demo.Entity.Post;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    Optional<Favorite> findByPostIdAndUserId(Long postId, Long userId);
    int countByPostId(Long postId);

    @Query("SELECT f.post FROM Favorite f WHERE f.user.id = :userId")
    List<Post> findFavoritesByUserId(Long userId);
}
