import React, { useState, useEffect } from "react";
import "../styles/Notifications.css";
import UserPopup from "./UserPopup";
import api from "../api";

const Notifications = ({ setUnreadCount }) => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const [notifications, setNotifications] = useState([]);
  const [postImages, setPostImages] = useState({});

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get(`/notifications/${storedUser.id}`);
        setNotifications(res.data);

        const postImageMap = {};
        await Promise.all(
          res.data.map(async (n) => {
            if (n.postId && !postImageMap[n.postId]) {
              const postRes = await api.get(`/posts/${n.postId}`);
              postImageMap[n.postId] = postRes.data.imageUrl;
            }
          })
        );
        setPostImages(postImageMap);

        fetchActorIds(res.data);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();

    const fetchActorIds = async (notifications) => {
      const updated = await Promise.all(
        notifications.map(async (n) => {
          if (n.actorUsername) {
            try {
              const res = await api.get(`/users/username/${n.actorUsername}`);
              return { ...n, actorId: res.data.id };
            } catch {
              return n;
            }
          }
          return n;
        })
      );
      setNotifications(updated);
    };
    
  }, [storedUser.id, setUnreadCount]);

  return (
    <div className="notifications-page">
      <div className="notifications-list">
        {notifications.length === 0 ? (
          <p className="empty-message">You're all caught up! 🎉</p>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`notification-item ${n.read ? "read" : "unread"}`}>
              <div className="notif-icon">
                {n.type === "like"}
                {n.type === "comment"}
                {n.type === "friend_request"}
                {n.type === "friend_accept"}
              </div>              <div className="notif-main-content">
                <div className="notif-text">
                  {n.actorUsername ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      <UserPopup userId={n.actorId} username={n.actorUsername}>
                        <strong>@{n.actorUsername}</strong>
                      </UserPopup>
                      <span>{n.message.replace(`@${n.actorUsername}`, "").trim()}</span>
                    </div>
                  ) : (
                    <p>{n.message}</p>
                  )}

                  {n.commentText && (
                    <p className="comment-preview">"{n.commentText}"</p>
                  )}
                  <div className="notif-time">
                    {new Date(n.timestamp).toLocaleString()}
                  </div>
                </div>                {n.postId && postImages[n.postId] && (
                  <img
                    src={postImages[n.postId]}
                    alt="post"
                    className="notif-post-image"
                  />
                )}

                {n.type === "friend_request" && !n.handled && (
                  <div className="friend-request-actions">
                    <button
                      onClick={async () => {
                        try {
                          await api.post(`/friend-requests/accept?requestId=${n.friendRequestId}`);
                          alert(`You are now friends with @${n.actorUsername}`);
                          setNotifications(prev =>
                            prev.map(notif =>
                              notif.id === n.id ? { ...notif, handled: true } : notif
                            )
                          );
                        } catch (err) {
                          console.error("Failed to accept request:", err);
                        }
                      }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await api.post(`/friend-requests/reject?requestId=${n.friendRequestId}`);
                          alert(`You rejected the friend request from @${n.actorUsername}`);
                          setNotifications(prev =>
                            prev.map(notif =>
                              notif.id === n.id ? { ...notif, handled: true } : notif
                            )
                          );
                        } catch (err) {
                          console.error("Failed to reject request:", err);
                        }
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}

                {n.type === "friend_request" && n.handled && (
                  <p className="friend-status-message">Request handled</p>
                )}

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
