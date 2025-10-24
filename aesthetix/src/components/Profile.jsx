import React, { useState,useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import UserInfo from "../components/UserInfo";
import Posts from "./Posts";
import SecurityPrivacy from "../components/SecurityPrivacy";
import Notifications from "../components/Notifications";
import "../styles/Profile.css";
import api from "../api";

const Profile = ({ user, setUser, unreadCount, setUnreadCount }) => {
  const [activeSection, setActiveSection] = useState("User Info");


  const renderSection = () => {
    switch (activeSection) {
      case "User Info":
        return <UserInfo user={user} setUser={setUser} />;
      case "Posts":
        return <Posts />;
      case "Security & Privacy":
        return <SecurityPrivacy />;
      case "Notifications":
        return <Notifications setUnreadCount={setUnreadCount} />;
      default:
        return <UserInfo user={user} setUser={setUser} />;
    }
  };

  useEffect(() => {
    let timeout;
  
    const markNotificationsRead = async () => {
      if (activeSection === "Notifications" && unreadCount > 0) {
        timeout = setTimeout(async () => {
          const storedUser = JSON.parse(localStorage.getItem("user"));
          await api.put(`/notifications/${storedUser.id}/mark-all-read`);
          setUnreadCount(0); 
        }, 1000); 
      }
    };
  
    markNotificationsRead();
  
    return () => clearTimeout(timeout); 
  }, [activeSection]);
  

  return (
    <>
      <Navbar />
      <div className="profile-container">
        <Sidebar
          setActiveSection={setActiveSection}
          activeSection={activeSection}
          unreadCount={unreadCount} 
        />
        <main className="profile-content">{renderSection()}</main>
      </div>
    </>
  );
};

export default Profile;
