import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import UserPopup from "./UserPopup";
import axios from "axios";
import "../styles/PostModal.css";

const PostModal = ({ post, onClose }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (post) {
      fetchComments();
    }
  }, [post, showComments]);

  const fetchComments = async () => {
    try {
      const response = await axios.get(`http://localhost:8091/api/comments/${post.id}`);
      const sortedComments = (response.data || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setComments(sortedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setComments([]);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`http://localhost:8091/api/comments/${commentId}`);
      setComments(comments.filter((comment) => comment.id !== commentId));
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      await axios.post("http://localhost:8091/api/comments/add", {
        postId: post.id,
        userId: user.id,
        commentText: newComment,
      });
      setNewComment("");
      fetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  if (!post) return null;

  return ReactDOM.createPortal(
    <div className="pmodal-overlay">
      <div className="pmodal-container">
        <div className="pmodal-content">
          {!showComments ? (
            <button className="pclose-btn" onClick={onClose}>✖</button>
          ) : (
            <button className="pcomment-back-btn" onClick={() => setShowComments(false)}>← Back</button>
          )}

          {!showComments ? (
            <div className="pmodal-layout">
              <div className="pmodal-left">
                <img src={post.imageUrl} alt="Post" className="ppost-image" />
                <div style={{ display: "inline-block" }}>
                  <UserPopup userId={post.userId} username={post.username}>
                    <p className="ppost-user">@{post.username}</p>
                  </UserPopup>
                </div>
              </div>

              <div className="pmodal-right">
                <h2 className="pmodal-title">{post.title}</h2>
                <p className="ppost-description">{post.description}</p>
                <button className="pcomment-toggle-btn" onClick={() => setShowComments(true)}>
                  💬 View Comments
                </button>
              </div>
            </div>
          ) : (
            <div className="pcomment-section">
              <h3 className="comment-section-title">Comments</h3>
              <div className="pcomments-list">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="comment">
                      <div className="comment-left comment-text">
                        {comment.userId ? (
                          <UserPopup userId={comment.userId} username={comment.username}>
                          <strong>@{comment.username || "Unknown"}</strong>
                          </UserPopup>
                        ) : (
                           <strong>@Unknown</strong>
                        )}
                      <div className="comment-message">{comment.commentText}</div>
                    </div>
                      <div className="comment-footer">
                        <span className="comment-date">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                        {comment.userId === JSON.parse(localStorage.getItem("user"))?.id && (
                          <span
                            className="delete-icon"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            🗑️
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-comments">No comments yet.</p>
                )}
              </div>
              <input
                type="text"
                className="comment-input"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddComment();
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PostModal;
