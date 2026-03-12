import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut, FiMoon, FiSun, FiMessageCircle } from "react-icons/fi";
import { useAuth } from "../../../contexts/AuthContext";
import { useChat } from "../../../contexts/ChatContext";
import logoImage from "../../../assets/mentorlink-logo.png";
import NotificationBell from "../notifications/NotificationBell";
import "./HomeNavbar.css";

const HomeNavbar = () => {
  const navigate = useNavigate();
  const { user, logout: authLogout } = useAuth();
  const { unreadCount } = useChat();
  const [dark, setDark] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  // Load dark mode preference
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme === "dark";
    setDark(isDark);
    document.body.classList.toggle("dark-mode", isDark);
  }, []);

  // Fetch profile image based on role
  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        if (user?.role === "student") {
          const { studentAPI } = await import("../../../services/api");
          const response = await studentAPI.getProfile();
          if (response.student?.profileImage) {
            setProfileImage(response.student.profileImage);
          }
        } else if (user?.role === "mentor") {
          const { mentorAPI } = await import("../../../services/api");
          const response = await mentorAPI.getProfile();
          if (response.mentor?.profileImage) {
            setProfileImage(response.mentor.profileImage);
          }
        } else if (user?.role === "organizer") {
          const { organizerAPI } = await import("../../../services/api");
          const response = await organizerAPI.getProfile();
          if (response.organizer?.profileImage) {
            setProfileImage(response.organizer.profileImage);
          }
        }
      } catch (error) {
        // Profile image fetch failed silently
      }
    };
    if (user?.role) fetchProfileImage();
  }, [user?.role]);

  // Toggle dark/light mode
  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.body.classList.toggle("dark-mode", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  // Logout
  const logout = () => {
    authLogout();
    navigate("/login");
  };

  // Navigate to user's profile page based on role
  const onProfileClick = () => {
    if (user?.role === "admin") return;
    if (user?.role === "student") navigate("/student-profile");
    else if (user?.role === "organizer") navigate("/organizer-profile");
    else if (user?.role === "mentor") navigate("/mentor-profile");
    else navigate("/home");
  };

  // Navigate to home
  const goHome = () => navigate("/home");

  // Get user initials for avatar fallback
  const getInitials = () => {
    const nameStr = user?.name || user?.firstName || user?.username;
    if (nameStr) {
      const parts = nameStr.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return '?';
  };


  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Left: Logo */}
        <div className="navbar-left">
          <div
            className="navbar-logo"
            onClick={goHome}
            role="button"
            tabIndex={0}
          >
            <img src={logoImage} alt="MentorLink" className="logo-icon" />
            <span className="logo-text">MentorLink</span>
          </div>
        </div>

        {/* Right: Icons + Profile */}
        <div className="navbar-right">
          {/* Messages */}
          <button
            className="icon-btn messages-btn"
            onClick={() => navigate("/messages")}
            aria-label="Messages"
          >
            <FiMessageCircle size={20} />
            {unreadCount > 0 && (
              <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </button>

          {/* Notifications */}
          <NotificationBell />

          {/* Dark Mode Toggle */}
          <button
            className="icon-btn theme-toggle"
            onClick={toggleDark}
            aria-label="Toggle dark mode"
          >
            {dark ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>

          {/* Logout - hidden on small mobile */}
          <button className="btn btn--ghost logout-btn hide-on-mobile" onClick={logout}>
            <FiLogOut size={18} />
          </button>

          {/* Profile Avatar */}
          <button className="avatar" onClick={onProfileClick} aria-label="Profile">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="avatar-img" />
            ) : (
              <span className="avatar-initials">{getInitials()}</span>
            )}
          </button>
        </div>
      </div>

    </header>
  );
};

export default HomeNavbar;
