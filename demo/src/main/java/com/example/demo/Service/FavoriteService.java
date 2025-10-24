package com.example.demo.Service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.example.demo.Entity.Favorite;
import com.example.demo.Entity.Post;
import com.example.demo.Entity.User;
import com.example.demo.Repository.FavoriteRepository;
import com.example.demo.Repository.PostRepository;
import com.example.demo.Repository.UserRepository;

@Service
public class FavoriteService {
    private final FavoriteRepository favoriteRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public FavoriteService(FavoriteRepository favoriteRepository, PostRepository postRepository, UserRepository userRepository) {
        this.favoriteRepository = favoriteRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    public void favoritePost(Long postId, Long userId) {
        Optional<Post> post = postRepository.findById(postId);
        Optional<User> user = userRepository.findById(userId);

        if (post.isPresent() && user.isPresent()) {
            if (favoriteRepository.findByPostIdAndUserId(postId, userId).isEmpty()) {
                Favorite favorite = new Favorite();
                favorite.setPost(post.get());
                favorite.setUser(user.get());
                favoriteRepository.save(favorite);

                post.get().setFavoritesCount(post.get().getFavoritesCount() + 1);
                postRepository.save(post.get());
            }
        } else {
            throw new IllegalArgumentException("Post or User not found");
        }
    }

    public void unfavoritePost(Long postId, Long userId) {
        Optional<Favorite> favorite = favoriteRepository.findByPostIdAndUserId(postId, userId);
        favorite.ifPresent(f -> {
            favoriteRepository.delete(f);

            Post post = f.getPost();
            post.setFavoritesCount(post.getFavoritesCount() - 1);
            postRepository.save(post);
        });
    }

    public int getFavoriteCount(Long postId) {
        return favoriteRepository.countByPostId(postId);
    }

    public boolean hasUserFavoritedPost(Long postId, Long userId) {
        return favoriteRepository.findByPostIdAndUserId(postId, userId).isPresent();
    }
    
    public List<Post> getFavoritesByUserId(Long userId) {
        return favoriteRepository.findFavoritesByUserId(userId);
    }
}
