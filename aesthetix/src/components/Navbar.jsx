import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; 
import PropTypes from "prop-types";
import { FaUserCircle, FaFolderOpen, FaHeart, FaImage } from "react-icons/fa";
import { MdArrowDropDown } from "react-icons/md";
import "../styles/Navbar.css";

const Navbar = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const toggleDropdown = (dropdownName) => {
    setOpenDropdown((prev) => (prev === dropdownName ? null : dropdownName));
  };

  // close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.removeItem("welcomeShown");
    navigate("/");
    window.location.reload();
  };

  return (
    <nav className="navbar" ref={dropdownRef}>
      {/* logo  */}
      <div className="logo" onClick={() => navigate("/home")}>
        aesthetix
      </div>

      <div className="nav-center">
        {/* gallery link */}
      <Link to="/gallery" className="nav-item">
          <FaImage /> Gallery
      </Link>

        {/* my projects dropdown */}
        <div className="dropdown">
          <div className="dropdown-toggle" onClick={() => toggleDropdown("projects")}>
            <FaFolderOpen /> My Projects <MdArrowDropDown />
          </div>
          {openDropdown === "projects" && (
            <div className="dropdown-menu">
              <Link to="/prettai">Try PrettAI</Link>
              <Link to="/saved-projects">Saved Projects</Link>
              <Link to="/new-project" onClick={() => localStorage.removeItem("roomProject")}>➕ Create New</Link>
            </div>
          )}
        </div>

        {/* favorites dropdown */}
        <div className="dropdown">
          <div className="dropdown-toggle" onClick={() => toggleDropdown("favorites")}>
            <FaHeart /> Favorites <MdArrowDropDown />
          </div>
          {openDropdown === "favorites" && (
            <div className="dropdown-menu">
              <Link to="/favorites">❤️ Liked Designs</Link>
              <Link to="/saved-templates">Saved Templates</Link>
            </div>
          )}
        </div>

        {/* account dropdown */}
        <div className="nav-right">
          <div className="account-section" onClick={() => toggleDropdown("account")}>
            <FaUserCircle size={24} />
            <MdArrowDropDown size={20} />
          </div>
          {openDropdown === "account" && (
            <div className="dropdown-menu">
              <Link to="/profile">My Profile</Link>
              <Link to="/about">About Us</Link>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
