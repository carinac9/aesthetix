import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Navbar from "./Navbar";
import "../styles/Home.css";

const Home = ({ user }) => {
  const [showNavbar, setShowNavbar] = useState(false);

  useEffect(() => {
    if (user) {
      setShowNavbar(true);
    }
  }, [user]);

  return (
    <div className="home-container">
      {showNavbar && <Navbar />}

      <div className="hero-container">
        <video className="background-video" autoPlay loop muted>
          <source src="/videos/hero.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="content-box">
          <p className="motto">Design. Create. Inspire.</p>
        </div>
        <p className="extra-text">
          Play around with styles, get smart AI suggestions, and build your perfect space in 3D. No experience needed—just your imagination!
        </p>
      </div>
    </div>
  );
};

Home.propTypes = {
  user: PropTypes.object,
};

export default Home;
