import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import "./Login.css";
import logo from "../../../assets/mentorlink-logo.png";
import { userAPI } from "../../../services/api";
import { jwtDecode } from "jwt-decode";

// Import your images here
import img1 from "../../../assets/mentorlink-logo.png";
import img2 from "../../../assets/mentorlink-logo.png";
import img3 from "../../../assets/mentorlink-logo.png";

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const navigate = useNavigate();

  const images = [img1, img2, img3];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 3000); // Change image every 3 seconds
    return () => clearInterval(interval);
  }, [images.length]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await userAPI.login({ email, password });
      const token = data?.token;
      if (!token) throw new Error("No token returned from server");

      localStorage.setItem("token", token);

      const userData = data.user || {};
      if (!userData.id) {
        const payload = jwtDecode(token);
        userData.id = payload.id;
        userData.role = payload.role;
      }
      login(userData, token);

      setShowSuccess(false);
      const role = userData.role;
      if (role === 'student') navigate('/student-profile');
      else if (role === 'mentor') navigate('/mentor-profile');
      else if (role === 'organizer') navigate('/organizer-profile');
      else navigate('/home');
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          {/* Illustration Section */}
          <div className="illustration-section">
            <div className="image-slider">
              <img
                src={images[currentImage]}
                alt="Login Illustration"
                className="slider-image"
              />
            </div>
            <p className="login-caption">Where Guidance meets Opportunity</p>
          </div>

          {/* Login Form Section */}
          <div className="form-section">
            <div className="login-logo-brand">
              <img src={logo} alt="MentorLink" className="login-logo" />
              <span className="login-logo-text">MentorLink</span>
            </div>
            <h2 className="welcome-text">Welcome Back!</h2>
            <h3 className="welcome-subtext">
              Welcome to <span className="highlight">MENTOR LINK</span>
            </h3>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="input-container">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  className="login-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="input-container">
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                <a
                  href="/forgot-password"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset feature coming soon. Please contact support.');
                  }}
                  style={{ color: '#3b82f6', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
                >
                  Forgot password?
                </a>
              </div>

              {error && (
                <div style={{ color: "#b00020", fontSize: 14, marginBottom: 8 }}>{error}</div>
              )}

              <button type="submit" className="continue-btn" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="signup-text">
              Don't have an account?{" "}
              <a
                href="/signup"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/signup");
                }}
              >
                Sign up for free!
              </a>
            </p>
          </div>
        </div>
      </div>
      {showSuccess && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            background: "#10b981",
            color: "white",
            padding: "12px 16px",
            borderRadius: 8,
            boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
            zIndex: 9999,
          }}
        >
          Login successful! Redirecting...
        </div>
      )}
    </div>
  );
};

export default Login;
