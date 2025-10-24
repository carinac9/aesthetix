import React, { useState, useEffect } from "react";
import { FaEdit, FaUserFriends,FaUsers } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/UserInfo.css";

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

    return zodiacSigns.find(z =>
        (month === parseInt(z.start.split("-")[0]) && day >= parseInt(z.start.split("-")[1])) ||
        (month === parseInt(z.end.split("-")[0]) && day <= parseInt(z.end.split("-")[1]))
    )?.sign || "N/A";
};

const UserInfo = ({ user, setUser }) => {
    const navigate = useNavigate();
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const [formData, setFormData] = useState({
        name: storedUser?.name || "",
        username: storedUser?.username || "",
        email: storedUser?.email || "",
        description: "",
        city: "",
        country: "",
        dateOfBirth: "",
        zodiacSign: "N/A",
        profilePicture: storedUser?.profilePicture || "/prf.jpg",
        friendsCount: 0,
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchPopup, setShowSearchPopup] = useState(false);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [showFriendsPopup, setShowFriendsPopup] = useState(false);
    const [friends, setFriends] = useState([]);

    const fetchFriends = async () => {
        try {
          const response = await axios.get(`http://localhost:8091/api/friend-requests/friends/${storedUser.id}`);
          setFriends(response.data);
          setShowFriendsPopup(true);
        } catch (error) {
          console.error("Error fetching friends list:", error);
        }
      };
      



    const [isEditing, setIsEditing] = useState(false);

    const fetchUserInfo = () => {
        axios.get(`http://localhost:8091/api/users/${storedUser.id}`)
          .then(response => {
            setFormData(prevData => ({
              ...prevData,
              ...response.data,
              zodiacSign: getZodiacSign(response.data.dateOfBirth),
              friendsCount: response.data.friendsCount || 0,
            }));
          })
          .catch(error => console.error("Error fetching user data:", error));
      };
      

    // Fetch user data from backend
    useEffect(() => {
        if (storedUser?.id) {
          fetchUserInfo();
        }
      
        const handleFriendAccepted = () => {
          fetchUserInfo();
          fetchFriends(); 
        };
      
        window.addEventListener("friendAccepted", handleFriendAccepted);
      
        return () => {
          window.removeEventListener("friendAccepted", handleFriendAccepted);
        };
      }, [storedUser?.id]);
      

    useEffect(() => {
        const fetchPendingRequests = async () => {
          try {
            const response = await axios.get(`http://localhost:8091/api/friend-requests/pending/${storedUser.id}`);
            setPendingRequests(response.data);  // Ensure this is set correctly
          } catch (error) {
            console.error("Error fetching pending requests:", error);
          }
        };
      
        fetchPendingRequests();
      }, [storedUser.id]);
      
    

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 2) {
            try {
              const response = await axios.get(`http://localhost:8091/api/users/search?username=${query}&currentUserId=${storedUser.id}`);
                console.log("Search Results:", response.data);
                setSearchResults(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error("Error searching users:", error);
                setSearchResults([]);
            }
        } else {
            setSearchResults([]);
        }
    };
    
    

    const sendFriendRequest = (friendId) => {
        axios.post(`http://localhost:8091/api/friend-requests/send?senderId=${storedUser.id}&receiverId=${friendId}`)
            .then(() => {
                setPendingRequests([...pendingRequests, friendId]); // Update UI immediately
            })
            .catch(error => console.error("Error sending friend request:", error));
    };
    
    
    

    // Handle input changes for text fields
    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "description" && value.length > 50) return;
        if (name === "dateOfBirth") {
            const today = new Date().toISOString().split("T")[0];
            if (value > today) return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: value,
            zodiacSign: name === "dateOfBirth" ? getZodiacSign(value) : prev.zodiacSign,
        }));
    };
    
    // Handle profile picture change
    const handleProfilePictureChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.readAsDataURL(file); 
        reader.onloadend = async () => {
            console.log("Uploading profile picture...");
            console.log("Base64 Data Length:", reader.result.length); 
    
            try {
                const response = await axios.put(
                    `http://localhost:8091/api/users/update/${storedUser.id}`,
                    { ...formData, profilePicture: reader.result }
                );
    
                console.log("Profile picture updated successfully:", response.data);
                setFormData(response.data);
                localStorage.setItem("user", JSON.stringify(response.data)); 
                setUser(response.data); 
            } catch (error) {
                console.error("Error updating profile picture:", error.response?.data || error.message);
            }
        };
    };
    

    const handleSave = () => {
        axios.put(`http://localhost:8091/api/users/update/${storedUser.id}`, formData)
            .then(response => {
                setIsEditing(false);
                
                fetchUserInfo();
                localStorage.setItem("user", JSON.stringify({ ...formData, ...response.data }));
                setUser({ ...formData, ...response.data });
            })
            .catch(error => console.error("Error updating user data:", error));
    };

    const handleUnfriend = async (friendId) => {
      try {
        await axios.post(`http://localhost:8091/api/friend-requests/unfriend`, {
          userId1: storedUser.id,
          userId2: friendId
        });
        alert("Friend removed!");
        setFriends(friends.filter(f => f.id !== friendId));
        setFormData(prev => ({ ...prev, friendsCount: prev.friendsCount - 1 }));
      } catch (err) {
        console.error("Error removing friend:", err);
      }
    };
    

    return (
        <div className={isEditing ? "user-info-edit" : "user-info-display"}>
            <div className="profile-picture-section">
                <div className="profile-picture-wrapper">
            <img src={formData.profilePicture ? formData.profilePicture : "/prf.jpg"} alt="Profile" className="profile-picture" />
                <label className="edit-icon">
                    <FaEdit />
                    <input type="file" accept="image/*" hidden onChange={handleProfilePictureChange} />
                </label>
                </div>
                <p className="profile-username">@{formData.username}</p>
                <div className="friends-actions">
                   
                <button className="friend-button" onClick={() => setShowSearchPopup(true)}>
                            <FaUserFriends /> Add Friend
                </button>
                    <span className="divider">|</span>
                    <button className="friend-list-button" onClick={fetchFriends}>
                        <FaUsers /> Friends
                    </button>

                </div>
                <p className="friends-count">
                    {formData.friendsCount !== undefined ? `${formData.friendsCount} Friends` : "0 Friends"}
                </p>

            </div>

            <div className="user-details">
                <div className="left-column">
                    <div className="info-item">
                        <strong>Name:</strong> 
                        {isEditing ? <input type="text" name="name" value={formData.name} onChange={handleChange} className="editable-input" /> : formData.name}
                    </div>
                    <div className="info-item">
                        <strong>Email:</strong> {formData.email}
                    </div>
                    <div className="info-item">
                        <strong>Description:</strong> 
                        {isEditing ? <textarea name="description" value={formData.description} onChange={handleChange} className="editable-input" /> : formData.description}
                    </div>
                </div>

                <div className="right-column">
                    <div className="info-item">
                        <strong>City:</strong> 
                        {isEditing ? <input type="text" name="city" value={formData.city} onChange={handleChange} className="editable-input" /> : formData.city}
                    </div>
                    <div className="info-item">
                        <strong>Country:</strong> 
                        {isEditing ? <input type="text" name="country" value={formData.country} onChange={handleChange} className="editable-input" /> : formData.country}
                    </div>
                    <div className="info-item">
                        <strong>Date of Birth:</strong> 
                        {isEditing ? <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} className="editable-input" max={new Date().toISOString().split("T")[0]} /> : formData.dateOfBirth}
                    </div>
                    <div className="info-item">
                        <strong>Zodiac Sign:</strong> {formData.zodiacSign}
                    </div>
                </div>
            </div>

            {showSearchPopup && (
  <>
    <div className="search-popup-overlay" onClick={() => setShowSearchPopup(false)}></div>

    <div className="search-popup">
      <div className="popup-content1">
        <button className="close-btn" onClick={() => setShowSearchPopup(false)}>X</button>
        <h3>Search Users</h3>
        <input
          type="text"
          placeholder="Enter username..."
          value={searchQuery}
          onChange={handleSearch}
        />
        {searchResults.length > 0 ? (
          <ul>
            {searchResults
              .filter(user =>
                user.id !== storedUser.id &&
                !friends.some(f => f.id == user.id)
              )
             .map((user) => (

              user.id !== storedUser.id && ( 
                <li key={user.id}>
                  <span
                    className="search-username"
                    onClick={() => navigate(`/profile/${user.id}`)}
                    style={{ cursor: "pointer", fontWeight: "bold" }}
                  >
                    @{user.username}
                  </span>
                  {friends.some(f => f.id == user.id) ? (
                    <button onClick={() => handleUnfriend(user.id)}>
                      Remove
                    </button>
                  ) : pendingRequests.includes(user.id) ? (
                    <button disabled>
                      Pending
                    </button>
                  ) : (
                    <button onClick={() => sendFriendRequest(user.id)}>
                      Add Friend
                    </button>
                  )}

                </li>
              )
            ))}
          </ul>
        ) : (
          <p>No users found</p>
        )}
      </div>
    </div>
  </>
)}

{showFriendsPopup && (
  <>
    <div className="search-popup-overlay" onClick={() => setShowFriendsPopup(false)}></div>
    <div className="search-popup">
      <div className="popup-content1">
        <button className="close-btn" onClick={() => setShowFriendsPopup(false)}>X</button>
        <h3>Your Friends</h3>
        {friends.length > 0 ? (
          <ul>
            {friends.map((friend) => (
  <li key={friend.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <span
      className="search-username"
      onClick={() => navigate(`/profile/${friend.id}`)}
      style={{ cursor: "pointer", fontWeight: "bold" }}
    >
      @{friend.username}
    </span>
    <button onClick={() => handleUnfriend(friend.id)}>
      Remove
    </button>
  </li>
))}

          </ul>
        ) : (
          <p>No friends yet 😢</p>
        )}
      </div>
    </div>
  </>
)}

            <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="edit-button">
                {isEditing ? "Save" : "Edit"}
            </button>
        </div>
    );
};

export default UserInfo;