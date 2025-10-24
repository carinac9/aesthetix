import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../styles/Gallery.css";
import "../styles/ProfilePage.css";
import axios from "axios";
import PostModal from "./PostModal";

const ProfilePage = () => {
  const { userId } = useParams();
  const viewerId = JSON.parse(localStorage.getItem("user"))?.id;

  const [userInfo, setUserInfo] = useState(null);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isFriend, setIsFriend] = useState(null);
  const [friendList, setFriendList] = useState([]);

  const fetchFriendList = async () => {
    try {
      const res = await axios.get(`http://localhost:8091/api/friend-requests/friends/${userId}`);
      setFriendList(res.data);
    } catch (err) {
      console.error("Error fetching friends:", err);
    }
  };
  

  useEffect(() => {
    const fetchData = async () => {
      if (!userId || !viewerId) return;

      try {
        const profileResponse = await axios.get(
          `http://localhost:8091/api/users/preview/${userId}`,
          { params: { viewerId } }
        );

        const profile = profileResponse.data;
        setUserInfo({
          ...profile,
          zodiacSign: getZodiacSign(profile.dateOfBirth),
        });
        setIsFriend(profile.friendStatus || "not_friend");

        const postsResponse = await axios.get(
          `http://localhost:8091/api/posts/user/${userId}`
        );

        fetchFriendList();

        const updatedPosts = await Promise.all(
          postsResponse.data.map(async (post) => {
            const [favoriteRes, likedRes] = await Promise.all([
              axios.get(`http://localhost:8091/api/favorites/count/${post.id}`),
              axios.get(`http://localhost:8091/api/favorites/user/${viewerId}/post/${post.id}`)
            ]);
            return {
              ...post,
              favoriteCount: favoriteRes.data,
              isFavorited: likedRes.data
            };
          })
        );

        setPosts(updatedPosts);
      } catch (error) {
        console.error("Error fetching profile or posts:", error.response?.data || error.message);
      }
    };

    fetchData();
  }, [userId, viewerId]);

  const handleFriendAction = async () => {
    try {
      if (isFriend === "not_friend") {
        await axios.post("http://localhost:8091/api/friend-requests/send", null, {
          params: {
            senderId: viewerId,
            receiverId: userId,
          },
        });
        setIsFriend("pending");
      } else if (isFriend === "friend") {
        await axios.post("http://localhost:8091/api/friend-requests/unfriend", {
          userId1: viewerId,
          userId2: userId,
        });
        setIsFriend("not_friend");
      }
    } catch (error) {
      console.error("Error handling friend action:", error.response?.data || error.message);
    }
  };
  
  

  const toggleFavorite = async (postId, isFavorited) => {
    try {
      if (!viewerId) return;
      let updatedCount;

      if (isFavorited) {
        await axios.delete(`http://localhost:8091/api/favorites/remove`, {
          params: { postId, userId: viewerId },
        });
        updatedCount = posts.find((p) => p.id === postId).favoriteCount - 1;
      } else {
        await axios.post(`http://localhost:8091/api/favorites/add`, {
          postId,
          userId: viewerId,
        });
        updatedCount = posts.find((p) => p.id === postId).favoriteCount + 1;
      }

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, isFavorited: !isFavorited, favoriteCount: updatedCount }
            : p
        )
      );
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const getZodiacSign = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;

    const zodiacSigns = [
      { sign: "Capricorn ♑︎", start: "12-22", end: "01-19" },
      { sign: "Aquarius ♒︎", start: "01-20", end: "02-18" },
      { sign: "Pisces ♓︎", start: "02-19", end: "03-20" },
      { sign: "Aries ♈︎", start: "03-21", end: "04-19" },
      { sign: "Taurus ♉︎", start: "04-20", end: "05-20" },
      { sign: "Gemini ♊︎", start: "05-21", end: "06-20" },
      { sign: "Cancer ♋︎", start: "06-21", end: "07-22" },
      { sign: "Leo ♌︎", start: "07-23", end: "08-22" },
      { sign: "Virgo ♍︎", start: "08-23", end: "09-22" },
      { sign: "Libra ♎︎", start: "09-23", end: "10-22" },
      { sign: "Scorpio ♏︎", start: "10-23", end: "11-21" },
      { sign: "Sagittarius ♐︎", start: "11-22", end: "12-21" },
    ];

    return zodiacSigns.find(
      (z) =>
        (month === parseInt(z.start.split("-")[0]) &&
          day >= parseInt(z.start.split("-")[1])) ||
        (month === parseInt(z.end.split("-")[0]) &&
          day <= parseInt(z.end.split("-")[1]))
    )?.sign || "N/A";
  };

  if (!userInfo) {
    return <div className="profile-page">Loading...</div>;
  }

  return (
    <div className={`profile-page ${userInfo.isPrivate ? "private-profile" : ""}`}>
      {userInfo.isPrivate ? (
        <div className="lock-overlay">
          <img src="/lock.png" alt="Locked Profile" className="lock-image" />
          <p className="private-message">This account is private.</p>
        </div>
      ) : (
        <>
          <div className="profile-left">
            <div className="profile-picture-wrapper">
              <img
                src={userInfo.profile_picture || "/prf.jpg"}
                alt={`${userInfo.name}'s profile`}
                className="profile-picture"
              />
            </div>
            <p className="profile-username">@{userInfo.username}</p>
            <p className="friends-count">Friends: {friendList.length}</p>
            {isFriend === "self" ? (
            <button className="friend-button" onClick={() => window.location.href = "/profile"}>
              Edit Profile
            </button>
          ) : isFriend === "friend" ? (
            <button className="friend-button" onClick={handleFriendAction}>
              Remove Friend
            </button>
          ) : isFriend === "pending" ? (
            <button className="friend-button" disabled>
              Pending
            </button>
          ) : (
            <button className="friend-button" onClick={handleFriendAction}>
            Add Friend
            </button>
          )}


            <div className="user-details">
              <p><strong>Name:</strong> {userInfo.name}</p>
              <p><strong>Description:</strong> {userInfo.description}</p>
              <p><strong>City:</strong> {userInfo.city}</p>
              <p><strong>Country:</strong> {userInfo.country}</p>
              <p><strong>Zodiac Sign:</strong> {userInfo.zodiacSign}</p>
            </div>
          </div>

          <div className="gallery-container">
            {posts.length === 0 ? (
              <p className="no-posts-message">This user has no posts yet.</p>
            ) : (
              <div className="gallery-grid">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="gallery-item"
                    onClick={() => setSelectedPost(post)}
                  >
                    <img
                      src={post.imageUrl}
                      alt="User Post"
                      className="gallery-image"
                    />
                    <div className="gallery-info">
                      <p className="gallery-username">@{post.username}</p>
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
            )}
          </div>

          {selectedPost && (
            <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
          )}
        </>
      )}
    </div>
  );
};

export default ProfilePage;
