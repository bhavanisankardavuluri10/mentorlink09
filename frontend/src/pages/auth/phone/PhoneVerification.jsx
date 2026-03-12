import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./PhoneVerification.css";
import logo from "../../../assets/mentorlink-logo.png";

// Slider images
import img1 from "../../../assets/mentorlink-logo.png";
import img2 from "../../../assets/mentorlink-logo.png";
import img3 from "../../../assets/mentorlink-logo.png";

const PhoneVerification = () => {
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [currentImage, setCurrentImage] = useState(0);
  const navigate = useNavigate();

  const images = [img1, img2, img3];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [images.length]);

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/otp");
  };

  return (
    <div className="verification-page">
      <div className="verification-container">
        {/* Left Side */}
        <div className="illustration-section">
          <div className="image-slider">
            <img
              src={images[currentImage]}
              alt="Verification"
              className="slider-image"
            />
          </div>
          <p className="login-caption">Secure and fast verification</p>
        </div>

        {/* Right Side */}
        <div className="form-section">
          <div className="login-logo-brand">
            <img src={logo} alt="MentorLink" className="login-logo" />
            <span className="login-logo-text">MentorLink</span>
          </div>

          <h2 className="welcome-text">Enter your phone number</h2>
          <p className="welcome-subtext">
            We’ll send you a <span className="highlight">verification code</span>
          </p>

          <div className="divider">or</div>

          <button
            className="google-btn"
            onClick={(e) => {
              e.preventDefault();
              navigate("/login");
            }}
          >
            <span>📧 Use Email</span>
          </button>

          <div className="divider">or</div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-container phone-input-wrapper">
              <select
                className="country-code-select"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
              >
                <option value="+91">+91 IN</option>
                <option value="+1">+1 US</option>
                <option value="+44">+44 UK</option>
                <option value="+61">+61 AU</option>
              </select>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Phone number"
                className="login-input phone-input"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setPhone(value);
                }}
                onFocus={(e) => {
                  // Ensure input is scrolled into view on mobile
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 100);
                }}
                required
              />
            </div>

            <button type="submit" className="continue-btn">
              Send Code
            </button>
          </form>

          <p className="verification-footer">
            By continuing, you agree to our{" "}
            <a href="#">Terms of Service</a> and{" "}
            <a href="#">Privacy Policy</a>.
          </p>

          <p className="signup-text">
            Don’t have an account?
            <a
              href="/signup"
              onClick={(e) => {
                e.preventDefault();
                navigate("/signup");
              }}
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PhoneVerification;
