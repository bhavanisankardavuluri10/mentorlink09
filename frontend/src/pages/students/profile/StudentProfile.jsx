import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../../../config/api';
import HomeNavbar from '../../../components/layout/home-navbar/HomeNavbar';
import Sidebar from '../../../components/layout/sidebar/Sidebar';
import SessionHistory from '../../../components/chat/SessionHistory';
import Footer from '../../../components/layout/footer/Footer';
import { studentAPI, connectionAPI, userAPI, mentorAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useLayout } from '../../../contexts/LayoutContext';
import PageSkeleton from '../../../components/ui/page-skeleton/PageSkeleton';
import UserListModal from '../../../components/ui/user-list-modal/UserListModal';
import { FaUserFriends } from 'react-icons/fa';
import './StudentProfile.css';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { sidebarCollapsed } = useLayout();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    goal: '',
    mentorshipField: [],
    experienceLevel: '',
    frequency: '',
    style: ''
  });

  // New states for requests and mentors
  const [myRequests, setMyRequests] = useState([]);
  const [myMentors, setMyMentors] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);

  // Sidebar states
  const [connections, setConnections] = useState([]);
  const [suggestedMentors, setSuggestedMentors] = useState([]);

  // Profile picture upload states
  const [, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Banner upload states
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerInputRef = useRef(null);

  // Reset state when navigating between different profiles
  useEffect(() => {
    setIsConnected(false);
    setIsOwnProfile(false);
    setIsEditing(false);
    setConnecting(false);
    setMyRequests([]);
    setMyMentors([]);
    setActiveTab('pending');
    setEditForm({
      goal: '',
      mentorshipField: [],
      experienceLevel: '',
      frequency: '',
      style: '',
      portfolio: '',
      mentorshipTypes: []
    });
  }, [id]);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);

        // If no ID in URL, fetch authenticated user's profile
        if (!id) {
          const response = await studentAPI.getProfile();
          setStudent(response.student);
          setConnectionsCount(response.student.user?.connectionsCount || 0);
          setIsOwnProfile(true);
          setEditForm({
            goal: response.student.goal || '',
            mentorshipField: response.student.mentorshipField || [],
            experienceLevel: response.student.experienceLevel || '',
            frequency: response.student.frequency || '',
            style: response.student.style || ''
          });
          setLoading(false);
          return;
        }

        // Fetch student details by ID
        const response = await studentAPI.getStudentById(id);

        if (!response || !response.student) {
          throw new Error('Student not found');
        }

        setStudent(response.student);
        setConnectionsCount(response.student.user?.connectionsCount || 0);

        // Check if this is user's own profile
        if (user && response.student.user?._id === user._id) {
          setIsOwnProfile(true);
          setEditForm({
            goal: response.student.goal || '',
            mentorshipField: response.student.mentorshipField || [],
            experienceLevel: response.student.experienceLevel || '',
            frequency: response.student.frequency || '',
            style: response.student.style || ''
          });
        } else if (isAuthenticated()) {
          // Check if already connected (only if viewing someone else's profile)
          try {
            const connectionStatus = await connectionAPI.checkConnection(response.student.user?._id);
            setIsConnected(connectionStatus.isConnected);
          } catch (error) {
            console.error('Error checking connection:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching student:', error);
        const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
        alert(`Failed to load student profile: ${errorMsg}`);
        navigate('/students');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [id, navigate, isAuthenticated, user]);

  // Fetch student's requests
  useEffect(() => {
    const fetchMyRequests = async () => {
      if (!isOwnProfile) return;

      try {
        setLoadingRequests(true);
        const response = await fetch(`${API_BASE}/requests/my-requests?status=${activeTab}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        setMyRequests(data.requests || []);
      } catch (error) {
        console.error('Error fetching my requests:', error);
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchMyRequests();
  }, [isOwnProfile, activeTab]);

  // Fetch student's mentors (accepted requests)
  useEffect(() => {
    const fetchMyMentors = async () => {
      if (!isOwnProfile) return;

      try {
        const response = await fetch(`${API_BASE}/requests/my-mentors`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        setMyMentors(data.mentors || []);
      } catch (error) {
        console.error('Error fetching my mentors:', error);
      }
    };

    fetchMyMentors();
  }, [isOwnProfile]);

  // Fetch sidebar data: connections + suggested mentors
  useEffect(() => {
    if (!isOwnProfile || !student) return;

    const fetchSidebarData = async () => {
      try {
        const connRes = await connectionAPI.getConnections();
        const conns = connRes.connections || [];
        setConnections(conns);

        const mentorRes = await mentorAPI.getAllMentors();
        const allMentors = mentorRes.mentors || [];

        const studentFields = (student.mentorshipField || []).map(f => f.toLowerCase());
        const connectedUserIds = conns.map(c => c._id || c.user?._id);

        const suggested = allMentors.filter(m => {
          if (m.user?._id === user?._id) return false;
          if (connectedUserIds.includes(m.user?._id)) return false;
          const primary = (m.primaryDomain || '').toLowerCase();
          const secondary = (m.secondaryDomain || '').toLowerCase();
          return studentFields.some(field =>
            primary.includes(field) || field.includes(primary) ||
            secondary.includes(field) || field.includes(secondary)
          );
        }).slice(0, 5);

        setSuggestedMentors(suggested);
      } catch (err) {
        console.error('Error fetching sidebar data:', err);
      }
    };

    fetchSidebarData();
  }, [isOwnProfile, student, user]);

  const handleConnect = async () => {
    if (!isAuthenticated()) {
      alert('Please login to connect with students');
      navigate('/login');
      return;
    }

    if (!student?.user?._id) return;

    const wasConnected = isConnected;
    const originalConnectionsCount = connectionsCount;

    try {
      setConnecting(true);
      setIsConnected(!wasConnected);
      setConnectionsCount(prev => wasConnected ? prev - 1 : prev + 1);

      const response = await connectionAPI.toggleConnection(student.user._id);
      setIsConnected(response.isConnected);
      setConnectionsCount(response.targetUserConnectionsCount);

    } catch (error) {
      console.error('Error toggling connection:', error);
      setIsConnected(wasConnected);
      setConnectionsCount(originalConnectionsCount);
      alert('Failed to update connection');
    } finally {
      setConnecting(false);
    }
  };

  const handleSaveProfile = async () => {
    // Validation
    if (!editForm.experienceLevel) {
      alert('Please select an Experience Level');
      return;
    }
    if (!editForm.frequency) {
      alert('Please select a Preferred Frequency');
      return;
    }
    if (!editForm.style) {
      alert('Please select a Communication Style');
      return;
    }

    try {
      await studentAPI.updateProfile(editForm);
      setStudent({
        ...student,
        ...editForm
      });
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      goal: student?.goal || '',
      mentorshipField: student?.mentorshipField || [],
      experienceLevel: student?.experienceLevel || '',
      frequency: student?.frequency || '',
      style: student?.style || '',
      portfolio: student?.portfolio || '',
      mentorshipTypes: student?.mentorshipTypes || []
    });
    setIsEditing(false);
  };

  const handleViewRequest = (requestId) => {
    navigate(`/connection-request/${requestId}`);
  };

  const openHistoryModal = (mentor) => {
    setSelectedMentor(mentor);
    setShowHistoryModal(true);
  };

  const handleProfileImageClick = () => {
    // ... existing code ...
    if (isOwnProfile && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleProfileImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should not exceed 5MB');
      return;
    }

    try {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await userAPI.uploadProfilePicture(formData);

      // Update student state with new profile image
      setStudent({
        ...student,
        user: {
          ...student.user,
          profileImage: response.profileImage,
        },
      });

      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert(error.message || 'Failed to upload profile picture');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleBannerClick = () => {
    if (isOwnProfile && bannerInputRef.current) {
      bannerInputRef.current.click();
    }
  };

  const handleBannerChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should not exceed 5MB');
      return;
    }

    try {
      setUploadingBanner(true);

      const formData = new FormData();
      formData.append('bannerImage', file);

      const response = await studentAPI.uploadBanner(formData);

      setStudent({
        ...student,
        bannerImage: response.student.bannerImage,
      });

      alert('Banner updated successfully!');
    } catch (error) {
      console.error('Error uploading banner:', error);
      alert(error.message || 'Failed to upload banner');
    } finally {
      setUploadingBanner(false);
    }
  };

  if (loading) {
    return (
      <div className="student-profile-page">
        <HomeNavbar />
        <div className={`app-container${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <Sidebar />
          <div className="student-profile-main">
            <PageSkeleton variant="profile" />
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="student-profile-page">
        <HomeNavbar />
        <div className={`app-container${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <Sidebar />
          <div className="student-profile-main">
            <div className="error-message">Student not found</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-profile-page">
      <HomeNavbar />
      <div className={`app-container${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <Sidebar />

        {/* Main Content Area - Anchored Single Surface */}
        <main className="student-profile-main">
          <div className={`profile-layout-grid${isOwnProfile ? ' has-sidebar' : ''}`}>
            <div className="profile-main-column">

          {/* Header Section: Banner + Profile Info */}
          <header className="profile-header-section">
            <div className="profile-banner">
              {student.bannerImage ? (
                <img src={student.bannerImage} alt="Banner" className="banner-image" />
              ) : (
                <div className="banner-placeholder"></div>
              )}
              {isOwnProfile && (
                <div
                  className="banner-upload-overlay"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBannerClick();
                  }}
                  title="Change Banner"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>{uploadingBanner ? 'Uploading...' : 'Change Banner'}</span>
                </div>
              )}
              <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleBannerChange} style={{ display: 'none' }} />
            </div>

            <div className="profile-header-row">
              <div className="profile-photo-wrapper" onClick={handleProfileImageClick} style={{ cursor: isOwnProfile ? 'pointer' : 'default' }}>
                <img
                  src={student.user?.profileImage || student.profileImage || 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png'}
                  alt={student.user?.name || 'Student'}
                  className="profile-photo-large"
                />
                {isOwnProfile && (
                  <div className="photo-upload-overlay">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleProfileImageChange} style={{ display: 'none' }} />
              </div>

              <div className="profile-header-info">
                <h1 className="student-name-large">{student.user?.name || 'Student'}</h1>
                <p className="student-headline">{student.roleStatus || 'Student'} · {student.experienceLevel || 'Beginner'}</p>
                {student.user?.location && <p className="student-location">{student.user.location}</p>}
                <div className="student-stats-section">
                  <div
                    className="student-stat-item stat-clickable"
                    onClick={() => setModalOpen(true)}
                  >
                    <div className="student-stat-icon">
                      <FaUserFriends />
                    </div>
                    <div className="student-stat-content">
                      <span className="student-stat-value">{connectionsCount}</span>
                      <span className="student-stat-label">Connections</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="profile-header-actions">
                {isOwnProfile ? (
                  <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
                ) : (
                  <button className={`connect-btn ${isConnected ? 'connected' : ''}`} onClick={handleConnect} disabled={connecting}>
                    {connecting ? 'Loading...' : isConnected ? 'Connected' : 'Connect'}
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* Edit Mode Section */}
          {isOwnProfile && isEditing && (
            <section className="profile-content-section">
              <h3 className="section-title">Edit Profile</h3>
              <div className="edit-grid">
                <div className="form-group">
                  <label>Goal / About</label>
                  <textarea
                    value={editForm.goal}
                    onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })}
                    placeholder="What are your learning goals?"
                    rows={3}
                    className="edit-textarea"
                  />
                </div>
                <div className="form-group">
                  <label>Experience Level <span className="required-star">*</span></label>
                  <select value={editForm.experienceLevel} onChange={(e) => setEditForm({ ...editForm, experienceLevel: e.target.value })} className="edit-input">
                    <option value="">Select Level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Preferred Frequency <span className="required-star">*</span></label>
                  <select value={editForm.frequency} onChange={(e) => setEditForm({ ...editForm, frequency: e.target.value })} className="edit-input">
                    <option value="">Select Frequency</option>
                    <option value="Once a week">Once a week</option>
                    <option value="Twice a month">Twice a month</option>
                    <option value="On-demand (as needed)">On-demand</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Communication Style <span className="required-star">*</span></label>
                  <select value={editForm.style} onChange={(e) => setEditForm({ ...editForm, style: e.target.value })} className="edit-input">
                    <option value="">Select Style</option>
                    <option value="Text">Text</option>
                    <option value="Call">Call</option>
                    <option value="Asynchronous">Asynchronous</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Portfolio URL</label>
                  <input type="url" value={editForm.portfolio || ''} onChange={(e) => setEditForm({ ...editForm, portfolio: e.target.value })} placeholder="https://your-portfolio.com" className="edit-input" />
                </div>
              </div>
              <div className="edit-actions">
                <button className="cancel-btn" onClick={handleCancelEdit}>Cancel</button>
                <button className="save-btn" onClick={handleSaveProfile}>Save Changes</button>
              </div>
            </section>
          )}

          {/* About Section */}
          {!isEditing && (student.goal || student.user?.about) && (
            <section className="profile-content-section">
              <h3 className="section-title">About</h3>
              <p className="about-text">{student.goal || student.user?.about}</p>
            </section>
          )}

          {/* Details Section */}
          {!isEditing && (
            <section className="profile-content-section">
              <h3 className="section-title">Details</h3>
              <div className="details-grid">
                {student.mentorshipField && student.mentorshipField.length > 0 && (
                  <div className="detail-item">
                    <span className="detail-label">Interested In</span>
                    <div className="tags-row">
                      {student.mentorshipField.map((field, i) => <span key={i} className="tag">{field}</span>)}
                    </div>
                  </div>
                )}
                {student.frequency && (
                  <div className="detail-item">
                    <span className="detail-label">Frequency</span>
                    <span className="detail-value">{student.frequency}</span>
                  </div>
                )}
                {student.style && (
                  <div className="detail-item">
                    <span className="detail-label">Communication</span>
                    <span className="detail-value">{student.style}</span>
                  </div>
                )}
                {student.mentorshipTypes && student.mentorshipTypes.length > 0 && (
                  <div className="detail-item full-width">
                    <span className="detail-label">Looking For</span>
                    <div className="tags-row">
                      {student.mentorshipTypes.map((type, i) => <span key={i} className="tag">{type}</span>)}
                    </div>
                  </div>
                )}
                {student.portfolio && (
                  <div className="detail-item full-width">
                    <span className="detail-label">Portfolio</span>
                    <a href={student.portfolio} target="_blank" rel="noopener noreferrer" className="portfolio-link">{student.portfolio}</a>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Mentorship Requests Section */}
          {isOwnProfile && !id && (
            <section className="profile-content-section">
              <h3 className="section-title">My Mentorship Requests</h3>
              <div className="tabs-row">
                <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>Pending</button>
                <button className={`tab-btn ${activeTab === 'accepted' ? 'active' : ''}`} onClick={() => setActiveTab('accepted')}>Accepted</button>
                <button className={`tab-btn ${activeTab === 'rejected' ? 'active' : ''}`} onClick={() => setActiveTab('rejected')}>Rejected</button>
              </div>
              <div className="requests-list">
                {loadingRequests ? (
                  <p className="empty-text">Loading requests...</p>
                ) : myRequests.length === 0 ? (
                  <p className="empty-text">No {activeTab} requests.</p>
                ) : (
                  myRequests.map((request) => (
                    <div key={request._id} className="request-row">
                      <img src={request.mentor?.user?.profileImage || 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png'} alt="" className="request-avatar" />
                      <div className="request-info">
                        <span className="request-name">{request.mentor?.user?.name || 'Mentor'}</span>
                        <span className="request-role">{request.mentor?.role || 'Mentor'}</span>
                        <span className="request-date">{new Date(request.createdAt).toLocaleDateString()}</span>
                      </div>
                      <button className="view-btn" onClick={() => handleViewRequest(request._id)}>View</button>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}

          {/* My Mentors Section */}
          {isOwnProfile && !id && (
            <section className="profile-content-section">
              <h3 className="section-title">My Mentors</h3>
              {myMentors.length === 0 ? (
                <p className="empty-text">You don't have any mentors yet.</p>
              ) : (
                <div className="mentors-grid">
                  {myMentors.map((mentor) => (
                    <div key={mentor._id} className="mentor-card">
                      <img src={mentor.user?.profileImage || 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png'} alt="" className="mentor-avatar" />
                      <div className="mentor-info">
                        <span className="mentor-name">{mentor.user?.name}</span>
                        <span className="mentor-role">{mentor.role || 'Mentor'}</span>
                      </div>
                      <div className="mentor-actions">
                        <button className="action-btn" onClick={() => openHistoryModal(mentor)}>History</button>
                        <button className="action-btn" onClick={() => navigate(`/mentors/${mentor._id}`)}>Profile</button>
                        <button className="action-btn primary" onClick={() => navigate(`/messages/${mentor.user?._id}`)}>Message</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

            </div>{/* end profile-main-column */}

            {/* Right Sidebar - Connections & Suggestions */}
            {isOwnProfile && (
              <aside className="profile-sidebar-column">
                <div className="profile-sidebar-sticky">
                  {/* Your Connections Card */}
                  <div className="sidebar-card">
                    <h3 className="sidebar-card-title">
                      <FaUserFriends />
                      Your Connections
                      <span className="sidebar-card-count">{connections.length}</span>
                    </h3>
                    {connections.length === 0 ? (
                      <p className="sidebar-empty-text">No connections yet</p>
                    ) : (
                      <div className="sidebar-connections-list">
                        {connections.slice(0, 8).map((conn) => (
                          <div
                            key={conn._id}
                            className="sidebar-connection-item"
                            onClick={() => navigate(`/profile/${conn._id}`)}
                          >
                            <img
                              src={conn.profileImage || 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png'}
                              alt={conn.name}
                              className="sidebar-avatar"
                            />
                            <div className="sidebar-connection-info">
                              <span className="sidebar-connection-name">{conn.name}</span>
                              <span className="sidebar-connection-role">{conn.role || 'User'}</span>
                            </div>
                          </div>
                        ))}
                        {connections.length > 8 && (
                          <button className="sidebar-see-all" onClick={() => setModalOpen(true)}>
                            See all connections
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Suggested Mentors Card */}
                  <div className="sidebar-card">
                    <h3 className="sidebar-card-title">Suggested Mentors</h3>
                    {suggestedMentors.length === 0 ? (
                      <p className="sidebar-empty-text">No suggestions available</p>
                    ) : (
                      <div className="sidebar-connections-list">
                        {suggestedMentors.map((mentor) => (
                          <div
                            key={mentor._id}
                            className="sidebar-connection-item"
                            onClick={() => navigate(`/mentors/${mentor._id}`)}
                          >
                            <img
                              src={mentor.user?.profileImage || 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png'}
                              alt={mentor.user?.name}
                              className="sidebar-avatar"
                            />
                            <div className="sidebar-connection-info">
                              <span className="sidebar-connection-name">{mentor.user?.name}</span>
                              <span className="sidebar-connection-role">{mentor.primaryDomain || mentor.role || 'Mentor'}</span>
                            </div>
                            <span className="sidebar-match-badge">Match</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </aside>
            )}
          </div>{/* end profile-layout-grid */}

          <Footer />
        </main>
      </div>

      {/* Session History Modal */}
      <SessionHistory
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedMentor(null);
        }}
        mentee={selectedMentor}
      />
      <UserListModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Connections"
        fetchUsers={() => connectionAPI.getConnections().then(r => r.connections || [])}
      />
    </div>
  );
};

export default StudentProfile;
