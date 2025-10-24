import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import PostModal from "../components/PostModal";
import axios from "axios";
import "../styles/Gallery.css"; 

const Favorites = () => {
    const [favoritePosts, setFavoritePosts] = useState([]); // list of favorited posts
    const [selectedPost, setSelectedPost] = useState(null); // post clicked to show in modal
    const user = JSON.parse(localStorage.getItem("user")); // current logged-in user

    // load favorites on mount
    useEffect(() => {
        fetchFavorites();
    }, []);

    // get user's favorites and their like counts
    const fetchFavorites = async () => {
        try {
            if (!user?.id) return;
            const response = await axios.get(`http://localhost:8091/api/favorites/user/${user.id}`);
            const posts = response.data || [];
    
            // get favorite count for each post
            const updatedPosts = await Promise.all(
                posts.map(async (post) => {
                    const countRes = await axios.get(`http://localhost:8091/api/favorites/count/${post.id}`);
                    return {
                        ...post,
                        favoriteCount: countRes.data,
                    };
                })
            );
            setFavoritePosts(updatedPosts.sort((a, b) => b.id - a.id));
        } catch (error) {
            console.error("Error fetching favorite posts:", error);
        }
    };

    // add or remove post from favorites
    const toggleFavorite = async (postId, isFavorited) => {
        try {
            if (!user?.id) return;

            if (isFavorited) {
                await axios.delete(`http://localhost:8091/api/favorites/remove`, {
                    params: { postId, userId: user.id }
                });
            } else {
                await axios.post(`http://localhost:8091/api/favorites/add`, { postId, userId: user.id });
            }
            setFavoritePosts((prev) => prev.filter((post) => post.id !== postId));
        } catch (error) {
            console.error("Error toggling favorite:", error);
        }
    };

    return (
        <div> 
            <Navbar /> 
            <main className="gallery-container">
                <h1 className="gallery-title">My Favorites</h1>
                <div className="gallery-grid">
                    {favoritePosts.length > 0 ? (
                        favoritePosts.map(post => (
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
                                            toggleFavorite(post.id, true);
                                        }}
                                    >
                                        ❤️ {post.favoriteCount}
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-favorites">You have no favorited posts yet.</p> 
                    )}
                </div>
            </main>
            {selectedPost && <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />}
        </div>
    );
};

export default Favorites;
