import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import "../css/BottomNav.css";

export default function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const [isVisible, setIsVisible] = useState(true);
  const scrollTimeout = useRef(null); // ✅ persist timeout across renders

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(true);

      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      scrollTimeout.current = setTimeout(() => {
        setIsVisible(false);
      }, 2000); // ⏳ Hide after 2 seconds of no scroll
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  return (
    <div className={`bottom-nav ${isVisible ? "show" : "hide"}`}>
      <nav className="nav">
        <ul>
          <li>
            <Link to="/home" className={isActive("/home") ? "active" : ""}>
              <i className="fas fa-home"></i>
              <span>Home</span>
            </Link>
          </li>
          <li>
            <Link
              to="/explore"
              className={isActive("/explore") ? "active" : ""}
            >
              <i className="fas fa-compass"></i>
              <span>Explore</span>
            </Link>
          </li>
          <li>
            <Link
              to="/VideoCall"
              className={isActive("/VideoCall") ? "active" : ""}
            >
              <i className="fas fa-heartbeat"></i>
              <span>Match</span>
            </Link>
          </li>
          <li>
            <Link
              to="/profile"
              className={isActive("/profile") ? "active" : ""}
            >
              <i className="fas fa-user"></i>
              <span>Profile</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
