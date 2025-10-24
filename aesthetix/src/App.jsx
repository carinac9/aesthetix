import { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import axios from "axios";
import Navbar from "./components/Navbar";
import Modal from "./components/Modal";
import Landing from "./components/Landing";
import Home from "./components/Home";
import Profile from "./components/Profile";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./styles/App.css";
import "./styles/Transitions.css"; 
import Gallery from "./components/Gallery";
import Favorites from "./components/Favorites";
import ProfilePage from "./components/ProfilePage";
import About from "./components/About";
import RoomCreation from "./components/RoomCreation";
import SavedProjects from "./components/SavedProjects";
import PrettAI from "./components/PrettAI";
import SavedTemplates from "./components/SavedTemplates";

const fetchUnreadCount = async (userId, setUnreadCount) => {
    try {
      const res = await fetch(`http://localhost:8091/api/notifications/${userId}/unread-count`);
      const data = await res.json();
      setUnreadCount(data);
    } catch (err) {
      console.error("Failed to fetch unread notifications:", err);
      setUnreadCount(0);
    }
  };

function App() {
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user?.id) return;
  
    const ping = () => {
      axios.post("http://localhost:8091/api/users/ping", null, {
        params: { userId: user.id },
      }).catch(console.error);
    };
  
    ping(); 
    const interval = setInterval(ping, 30000); 
  
    return () => clearInterval(interval);
  }, []);
  
  

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      fetchUnreadCount(parsedUser.id, setUnreadCount); 
  
      fetch(`http://localhost:8091/api/notifications/${parsedUser.id}/unread-count`)
        .then(res => res.json())
        .then(data => setUnreadCount(data))
        .catch(err => {
          console.error("Failed to fetch unread count:", err);
          setUnreadCount(0); 
        });
    } else {
      setUser(null);
      setUnreadCount(0);
    }
  }, []);

  return (
    <Router>
      <AppContent user={user} setUser={setUser} unreadCount={unreadCount} setUnreadCount={setUnreadCount} />

    </Router>
  );
}

function AppContent({ user, setUser, unreadCount, setUnreadCount }) {
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("login");
  const navigate = useNavigate();
  const nodeRef = useRef(null);

  const handleAuthSuccess = (userData) => {
    console.log("Auth successful:", userData);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    fetchUnreadCount(userData.id, setUnreadCount);

    setTimeout(() => {
      navigate("/home");
    }, 500);

    setShowModal(false);
  };

  return (
    <div className="app">
      {user && location.pathname !== "/" && <Navbar />}

      <TransitionGroup>
        <CSSTransition key={location.key} classNames="page" timeout={400} nodeRef={nodeRef}>
          <Routes location={location}>
            <Route
              path="/"
              element={
                <Landing
                  onOpenSignUp={() => setModalType("signup") || setShowModal(true)}
                  onOpenLogin={() => setModalType("login") || setShowModal(true)}
                  onOpenForgotPassword={() => setModalType("forgot-password") || setShowModal(true)}
                />
              }
            />
            <Route path="/home" element={<Home user={user} />} />
            <Route path="/profile" element={user && unreadCount !== null ? (<Profile user={user} setUser={setUser} unreadCount={unreadCount} setUnreadCount={setUnreadCount}/>) : null }/>
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/about" element={<About />} />
            <Route path="/saved-projects" element={<SavedProjects />} />
            <Route path="/new-project" element={<RoomCreation key={location.pathname} />} />
            <Route path="/create-room" element={<RoomCreation key={location.pathname} />} />
            <Route path="/prettai" element={<PrettAI />} />
            <Route path="/saved-templates" element={<SavedTemplates />} />


          </Routes>
        </CSSTransition>
      </TransitionGroup>

      {showModal && <Modal onClose={() => setShowModal(false)} type={modalType} onAuthSuccess={handleAuthSuccess} />}
    </div>
  );
}

export default App;
