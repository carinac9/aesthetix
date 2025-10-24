import React, { useState, useEffect } from "react";
import axios from "axios";
import UserPopup from "./UserPopup";
import "../styles/Posts.css";

const Posts = () => {
    const [posts, setPosts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [imageBase64, setImageBase64] = useState(null);
    const [errors, setErrors] = useState({});
    const [wordCount, setWordCount] = useState(0);
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.id;
    const maxWords = 150;
    const [comments, setComments] = useState({});
    const [commentInput, setCommentInput] = useState({});
    const [showCommentSection, setShowCommentSection] = useState({});

    const handleDescriptionChange = (e) => {
        const words = e.target.value
            .split(/\s+/)
            .filter((word) => word.length > 0);
        if (words.length <= maxWords) {
            setDescription(e.target.value);
            setWordCount(words.length);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);    const fetchPosts = async () => {
        try {
            if (!userId) return;

            const response = await axios.get(`http://localhost:8091/api/posts/user/${userId}`);
            let sortedPosts = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // fetch favorite state for each post
            sortedPosts = await Promise.all(sortedPosts.map(async (post) => {
                try {
                    // get favorite count
                    const countResponse = await axios.get(`http://localhost:8091/api/favorites/count/${post.id}`);
                    
                    // check if the current user has favorited this post
                    const userFavoritedResponse = await axios.get(`http://localhost:8091/api/favorites/user/${userId}/post/${post.id}`);
                    
                    return { 
                        ...post, 
                        favoriteCount: countResponse.data, 
                        isFavorited: userFavoritedResponse.data 
                    };
                } catch (error) {
                    console.error(`Error fetching favorite data for post ${post.id}:`, error);
                    return post;  
                }
            }));

            setPosts(sortedPosts);
        } catch (error) {
            console.error("Error fetching posts:", error);
        }
    };
  

    const fetchComments = async (postId) => {
        try {
            const response = await axios.get(
                `http://localhost:8091/api/comments/${postId}`
            );
            setComments((prev) => ({ ...prev, [postId]: response.data || [] }));
        } catch (error) {
            console.error("Error fetching comments:", error);
        }
    };    const handleAddComment = async (postId) => {
        if (!commentInput[postId]) return;
        try {
            await axios.post(
                "http://localhost:8091/api/comments/add",
                {
                    postId,
                    userId,
                    commentText: commentInput[postId],
                }
            );
            setCommentInput((prev) => ({ ...prev, [postId]: "" }));
            fetchComments(postId); // full comment list 
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };
      

    const handleDeleteComment = async (commentId, postId) => {
        try {
            await axios.delete(
                `http://localhost:8091/api/comments/${commentId}`
            );
            setComments((prev) => ({
                ...prev,
                [postId]: prev[postId].filter(
                    (comment) => comment.id !== commentId
                ),
            }));
        } catch (error) {
            console.error("Error deleting comment:", error);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            if (reader.result.length > 500000) {
                alert("Image size too large. Please upload a smaller image.");
            } else {
                setImageBase64(reader.result);
            }
        };
    };

    const handleAddPost = async () => {
        let newErrors = {};
        if (!title.trim()) newErrors.title = "Title is required.";
        if (!description.trim())
            newErrors.description = "Description is required.";
        if (!imageBase64) newErrors.image = "Image is required.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        if (!userId) {
            alert("User ID is missing!");
            return;
        }

        const formData = new FormData();
        formData.append("userId", userId);
        formData.append("title", title);
        formData.append("description", description);
        formData.append("imageUrl", imageBase64);

        try {
            await axios.post(
                "http://localhost:8091/api/posts/create",
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            setTitle("");
            setDescription("");
            setImageBase64(null);
            setShowForm(false);
            setErrors({});
            fetchPosts();
        } catch (error) {
            console.error(
                "Error adding post:",
                error.response ? error.response.data : error.message
            );
        }
    };

    const handleDeletePost = async (postId) => {
        try {
            await axios.delete(`http://localhost:8091/api/posts/${postId}`);
            fetchPosts();
        } catch (error) {
            console.error("Error deleting post:", error);
        }
    };    const toggleFavorite = async (postId, isFavorited) => {
        try {
            if (!userId) {
                console.error("User ID is missing!");
                return;
            }

            let updatedCount;

            if (isFavorited) {
                // remove favorite API
                const response = await axios.delete(`http://localhost:8091/api/favorites/remove`, {
                    params: { postId, userId },
                });
                updatedCount = response.data;
            } else {
                // add favorite API
                const response = await axios.post(`http://localhost:8091/api/favorites/add`, { postId, userId });
                updatedCount = response.data;
            }

            // new favorite count and state
            setPosts((prevPosts) =>
                prevPosts.map((post) =>
                    post.id === postId
                        ? { ...post, isFavorited: !isFavorited, favoriteCount: updatedCount }
                        : post
                )
            );

        } catch (error) {
            console.error("Error toggling favorite:", error);
        }
    };
  
    return (
        <div className="posts-container">
            {/* add post button */}
            <button className="add-post-btn" onClick={() => setShowForm(true)}>
                +
            </button>

            {/* post form modal */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Add a New Post</h2>
                        <label>Title</label>
                        <input
                            type="text"
                            placeholder="Enter title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        {errors.title && (
                            <p className="error">{errors.title}</p>
                        )}

                        <label>Description</label>
                        <textarea
                            placeholder="Enter description (max 150 words)"
                            value={description}
                            onChange={handleDescriptionChange}
                        />
                        <p
                            className={`word-count ${
                                wordCount >= maxWords ? "limit-reached" : ""
                            }`}
                        >
                            {wordCount}/{maxWords} words
                        </p>
                        {wordCount >= maxWords && (
                            <p className="error">Word limit reached!</p>
                        )}

                        <label>Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        {errors.image && (
                            <p className="error">{errors.image}</p>
                        )}

                        <div className="modal-buttons">
                            <button
                                className="submit-btn"
                                onClick={handleAddPost}
                            >
                                Submit
                            </button>
                            <button
                                className="cancel-btn"
                                onClick={() => setShowForm(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* posts display */}
            {posts.map((post) => (
                <div
                    key={post.id}
                    className={`post-card ${
                        showCommentSection[post.id] ? "comment-mode" : ""
                    }`}
                >
                    {/* image section */}
                    <div className="post-image">
                        {post.imageUrl ? (
                            <img
                                src={post.imageUrl}
                                alt="Post"
                                onError={(e) =>
                                    (e.target.src = "/default-image.jpg")
                                }
                            />
                        ) : (
                            <p>No Image</p>
                        )}                        {/* favorite button & count */}
                        <div className="favorite-container" onClick={() => toggleFavorite(post.id, post.isFavorited, post.favoriteCount)}>
                            <span className="favorite-heart">{post.isFavorited ? "❤️" : "🤍"}</span>
                            <span className="favorite-count">{isNaN(post.favoriteCount) ? 0 : post.favoriteCount}</span>
                        </div>
                    </div>

                    {/* post content */}
                    <div className="post-content">
                        <button
                            className="comment-btn"
                            onClick={() => {
                                setShowCommentSection((prev) => ({
                                    ...prev,
                                    [post.id]: !prev[post.id],
                                }));
                                if (!showCommentSection[post.id])
                                    fetchComments(post.id);
                            }}
                        >
                            💬 Comment
                        </button>

                        {/* title & description */}
                        <h3>{post.title}</h3>
                        <p>{post.description}</p>

                        {/* posted date */}
                        <p className="post-date">
                            Posted at:{" "}
                            {new Date(post.createdAt).toLocaleString()}
                        </p>                        {/* delete button */}
                        <button
                            className="delete-btn"
                            onClick={() => handleDeletePost(post.id)}
                        >
                            🗑️
                        </button>

                        {/* comment section */}
                        {showCommentSection[post.id] && (
                            <div className="comment-section">
                                {/* close button */}
                                <button
                                    className="close-comments-btn1"
                                    onClick={() =>
                                        setShowCommentSection((prev) => ({
                                            ...prev,
                                            [post.id]: false,
                                        }))
                                    }
                                >
                                    ✖
                                </button>

                                <div className="comment-section-title">Comments</div>

                                <div className="comment-space">
                                    {(comments[post.id] || [])
                                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                        .map((comment) => (
                                            <div key={comment.id} className="comment">
                                                <div className="comment-left comment-text">
                                                    {comment.userId ? (
                                                        <UserPopup userId={comment.userId} username={comment.username || "Unknown"}>
                                                            <strong>@{comment.username || "Unknown"}</strong>
                                                        </UserPopup>
                                                    ) : (
                                                        <strong>@Unknown</strong>
                                                    )}
                                                    <div className="comment-message">{comment.commentText}</div>
                                                </div>

                                                <div className="comment-right">
                                                    <span className="comment-date">
                                                        {new Date(comment.createdAt).toLocaleString()}
                                                    </span>
                                                    {Number(comment.userId) === Number(userId) && (
                                                        <span
                                                            className="delete-icon"
                                                            onClick={() => handleDeleteComment(comment.id, post.id)}
                                                        >
                                                            🗑️
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                </div>

                                {/* comment input */}
                                <input
                                    type="text"
                                    className="comment-input"
                                    placeholder="Write a comment..."
                                    value={commentInput[post.id] || ""}
                                    onChange={(e) =>
                                        setCommentInput((prev) => ({
                                            ...prev,
                                            [post.id]: e.target.value,
                                        }))
                                    }
                                    onKeyDown={(e) => e.key === "Enter" && handleAddComment(post.id)}
                                />
                            </div>
                        )}

                    </div>
                </div>
            ))}
        </div>
    );
};

export default Posts;