/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ On app load, rehydrate user from localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          const payload = jwtDecode(token);
          setUser({
            id: payload.id,
            role: payload.role,
          });
        }
      } catch (error) {
        console.error("Error restoring user:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    if (token) localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const isAuthenticated = () => !!user && !!localStorage.getItem("token");

  const hasRole = (role) => user?.role === role;

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* ✅ Don’t render children until loading is complete */}
      {loading ? <div>Loading...</div> : children}
    </AuthContext.Provider>
  );
};

// ✅ Role-based profile redirect
export const ProfileRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case "student":
      return <Navigate to="/student-profile" />;
    case "mentor":
      return <Navigate to="/mentor-profile" />;
    case "organizer":
      return <Navigate to="/organizer-profile" />;
    default:
      return <div>Invalid role</div>;
  }
};
