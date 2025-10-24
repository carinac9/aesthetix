import { useRef } from "react";
import PropTypes from "prop-types";
import "../styles/Landing.css";

const Landing = ({ onOpenSignUp }) => {
  const videoRef = useRef(null);

  return (
    <div className="landing-container">
      <video ref={videoRef} className="background-video" autoPlay muted>
        <source src="/videos/background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="content-box-l">
        <h1 className="title">aesthetix</h1>
        <p className="motto">Design. Create. Inspire.</p>
        <p className="description">
          Discover a new way to visualize and create stunning interior designs effortlessly.
        </p>

        {/* register button  */}
        <button className="cta-button" onClick={onOpenSignUp}>Register</button>
      </div>
    </div>
  );
};

Landing.propTypes = {
  onOpenSignUp: PropTypes.func.isRequired,
};

export default Landing;
