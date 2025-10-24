package com.example.demo.Service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.example.demo.DTO.CommentResponseDTO;
import com.example.demo.Entity.Comment;
import com.example.demo.Entity.Post;
import com.example.demo.Entity.User;
import com.example.demo.Repository.CommentRepository;
import com.example.demo.Repository.PostRepository;
import com.example.demo.Repository.UserRepository;

@Service
public class CommentService {
    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public CommentService(CommentRepository commentRepository, PostRepository postRepository, UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    public void deleteComment(Long commentId) {
        commentRepository.deleteById(commentId);
    }
    
    public Comment addComment(Long postId, Long userId, String commentText) {
        Optional<Post> post = postRepository.findById(postId);
        Optional<User> user = userRepository.findById(userId);

        if (post.isPresent() && user.isPresent()) {
            Comment comment = new Comment();
            comment.setPost(post.get());
            comment.setUser(user.get());
            comment.setCommentText(commentText);
            return commentRepository.save(comment);
        } else {
            throw new IllegalArgumentException("Post or User not found");
        }
    }

    public List<Comment> getCommentsForPost(Long postId) {
        return commentRepository.findByPostId(postId);
    }

    public List<CommentResponseDTO> getCommentsAsDTOs(Long postId) {
    List<Comment> comments = commentRepository.findByPostId(postId);
    return comments.stream().map(comment -> {
        CommentResponseDTO dto = new CommentResponseDTO();
        dto.setId(comment.getId());
        dto.setCommentText(comment.getCommentText());
        dto.setCreatedAt(comment.getCreatedAt());
        dto.setUserId(comment.getUser().getId());
        dto.setUsername(comment.getUser().getUsername());
        return dto;
    }).toList();
}

}