import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Gallery.css";
import PostModal from "./PostModal";
import Navbar from "./Navbar";

const Gallery = () => {
    const [posts, setPosts] = useState([]);
    const [selectedPost, setSelectedPost] = useState(null);
    const [commentInput, setCommentInput] = useState("");
    const [comments, setComments] = useState({});
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.id;

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const response = await axios.get("http://localhost:8091/api/posts");
            const fetchedPosts = response.data;

            const updatedPosts = await Promise.all(
                fetchedPosts.map(async (post) => {
                    try {
                        let username = post.username; 

                        if (!username) {
                            const userResponse = await axios.get(`http://localhost:8091/api/users/${post.userId}`);
                            username = userResponse.data.username;
                        }

                        const favoriteResponse = await axios.get(`http://localhost:8091/api/favorites/count/${post.id}`);
                        const isLiked = await axios.get(`http://localhost:8091/api/favorites/user/${userId}/post/${post.id}`);

                        return {
                            ...post,
                            username: username, 
                            favoriteCount: favoriteResponse.data,
                            isFavorited: isLiked.data
                        };
                    } catch (error) {
                        console.error("Error fetching user info:", error);
                        return post;
                    }
                })
            );

            setPosts(updatedPosts.sort((a, b) => b.id - a.id));

        } catch (error) {
            console.error("Error fetching posts:", error);
        }
    };

    const toggleFavorite = async (postId, isFavorited) => {
        try {
            if (!userId) return;

            let updatedCount;
            if (isFavorited) {
                await axios.delete(`http://localhost:8091/api/favorites/remove`, { params: { postId, userId } });
                updatedCount = posts.find(post => post.id === postId).favoriteCount - 1;
            } else {
                await axios.post(`http://localhost:8091/api/favorites/add`, { postId, userId });
                updatedCount = posts.find(post => post.id === postId).favoriteCount + 1;
            }

            setPosts(posts.map(post =>
                post.id === postId ? { ...post, isFavorited: !isFavorited, favoriteCount: updatedCount } : post
            ));
        } catch (error) {
            console.error("Error toggling favorite:", error);
        }
    };

    return (
        <div>
            <Navbar />
            <main className="gallery-container">
                <h1 className="gallery-title">User Gallery</h1>
                <div className="gallery-grid">
                    {posts.map(post => (
                        <div key={post.id} className="gallery-item" onClick={() => setSelectedPost(post)}>
                            <img 
                                src={post.imageUrl} 
                                alt="User Post" 
                                className="gallery-image"
                            />
                            <div className="gallery-info">
                                <p className="gallery-username">@{post.username || "Unknown"}</p>
                                <button
                                    className="favorite-btn"
                                    onClick={(e) => {
                                        e.stopPropagation(); 
                                        toggleFavorite(post.id, post.isFavorited);
                                    }}
                                >
                                    {post.isFavorited ? "❤️" : "🤍"} {post.favoriteCount}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
            {selectedPost &&  <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} /> }
        </div>
    );
};

export default Gallery;
