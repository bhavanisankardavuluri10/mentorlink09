import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE } from '../../../config/api';
import HomeNavbar from '../../../components/layout/home-navbar/HomeNavbar';
import Sidebar from '../../../components/layout/sidebar/Sidebar';
import ScheduleSessionModal from '../../messages/schedule/ScheduleSessionModal';
import SessionHistory from '../../../components/chat/SessionHistory';
import Footer from '../../../components/layout/footer/Footer';
import { mentorAPI, connectionAPI, sessionAPI, userAPI, followAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useLayout } from '../../../contexts/LayoutContext';
import PageSkeleton from '../../../components/ui/page-skeleton/PageSkeleton';
import UserListModal from '../../../components/ui/user-list-modal/UserListModal';
import './MentorProfile.css';

// Material UI Icons
import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WorkIcon from '@mui/icons-material/Work';
import CodeIcon from '@mui/icons-material/Code';
import SchoolIcon from '@mui/icons-material/School';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ChatIcon from '@mui/icons-material/Chat';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HistoryIcon from '@mui/icons-material/History';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import StarIcon from '@mui/icons-material/Star';
import EmailIcon from '@mui/icons-material/Email';
import TimelineIcon from '@mui/icons-material/Timeline';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import EditIcon from '@mui/icons-material/Edit';
import PhoneIcon from '@mui/icons-material/Phone';
import SmsIcon from '@mui/icons-material/Sms';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import JavascriptIcon from '@mui/icons-material/Javascript';
import StorageIcon from '@mui/icons-material/Storage';
import CloudIcon from '@mui/icons-material/Cloud';
import DataObjectIcon from '@mui/icons-material/DataObject';
import LanguageIcon from '@mui/icons-material/Language';
import SecurityIcon from '@mui/icons-material/Security';
import DevicesIcon from '@mui/icons-material/Devices';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import VerifiedIcon from '@mui/icons-material/Verified';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import FilterListIcon from '@mui/icons-material/FilterList';
import { FaUserFriends, FaLink } from 'react-icons/fa';

const MentorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { sidebarCollapsed } = useLayout();

  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalFetch, setModalFetch] = useState(null);
  const [menteesCount, setMenteesCount] = useState(0);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [connecting, setConnecting] = useState(false);
  const [following, setFollowing] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [canMessage, setCanMessage] = useState(false);
  const [profileStrength, setProfileStrength] = useState(0);
  const [editForm, setEditForm] = useState({
    linkedin: '',
    role: '',
    primaryExperience: '',
    mentorshipExperience: '',
    mentoringStyle: [],
    weeklyAvailability: [],
    skills: [],
    about: '',
    headline: '',
  });

  // Dashboard-specific states
  const [requests, setRequests] = useState([]);
  const [activeMentees, setActiveMentees] = useState([]);
  const [pastMentees, setPastMentees] = useState([]);
  const [activeTab, setActiveTab] = useState('requests');
  const [requestsTab, setRequestsTab] = useState('pending');
  const [menteesTab, setMenteesTab] = useState('active');
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingMentees, setLoadingMentees] = useState(false);

  // Session scheduling states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState(null);

  // Sidebar states
  const [connections, setConnections] = useState([]);
  const [suggestedMentors, setSuggestedMentors] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  // Profile picture upload states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Calculate profile strength
  const calculateProfileStrength = (mentorData) => {
    let strength = 0;
    const checks = [
      mentorData?.user?.profileImage,
      mentorData?.user?.bio || mentorData?.user?.about,
      mentorData?.linkedin,
      mentorData?.skills?.length > 0,
      mentorData?.primaryDomain,
      mentorData?.role,
      mentorData?.mentorshipExperience,
      mentorData?.mentoringStyle?.length > 0,
      mentorData?.weeklyAvailability?.length > 0,
      mentorData?.primaryExperience,
    ];

    checks.forEach(check => {
      if (check) strength += 10;
    });

    return Math.min(strength, 100);
  };

  // Reset state when navigating between different profiles
  useEffect(() => {
    setIsConnected(false);
    setIsFollowing(false);
    setIsOwnProfile(false);
    setIsEditing(false);
    setConnecting(false);
    setFollowing(false);
    setRequests([]);
    setActiveMentees([]);
    setActiveTab('requests');
    setRequestsTab('pending');
    setEditForm({
      linkedin: '',
      role: '',
      primaryExperience: '',
      mentorshipExperience: '',
      mentoringStyle: [],
      weeklyAvailability: [],
      skills: [],
      about: '',
      headline: '',
    });
  }, [id]);

  useEffect(() => {
    const fetchMentorData = async () => {
      try {
        setLoading(true);

        // If no ID in URL, fetch authenticated user's profile
        if (!id) {
          const response = await mentorAPI.getProfile();
          setMentor(response.mentor);
          setConnectionsCount(response.mentor.user?.connectionsCount || 0);
          setFollowersCount(response.mentor.user?.followersCount || 0);
          setMenteesCount(response.mentor.menteesCount || response.mentor.activeMentees?.length || 0);
          setIsOwnProfile(true);

          const strength = calculateProfileStrength(response.mentor);
          setProfileStrength(strength);

          setEditForm({
            linkedin: response.mentor.linkedin || '',
            role: response.mentor.role || '',
            primaryExperience: response.mentor.primaryExperience || '',
            mentorshipExperience: response.mentor.mentorshipExperience || '',
            mentoringStyle: response.mentor.mentoringStyle || [],
            weeklyAvailability: response.mentor.weeklyAvailability || [],
            skills: response.mentor.skills || [],
            about: response.mentor.user?.bio || response.mentor.user?.about || '',
            headline: response.mentor.headline || `${response.mentor.role || 'Mentor'} | ${response.mentor.primaryExperience || 'Experienced Professional'}`,
          });

          setLoading(false);
          return;
        }

        // Fetch mentor details by ID
        const response = await mentorAPI.getMentorById(id);

        if (!response || !response.mentor) {
          throw new Error('Mentor not found');
        }

        setMentor(response.mentor);
        setConnectionsCount(response.mentor.user?.connectionsCount || 0);
        setFollowersCount(response.mentor.user?.followersCount || 0);
        setMenteesCount(response.mentor.menteesCount || response.mentor.activeMentees?.length || 0);

        const strength = calculateProfileStrength(response.mentor);
        setProfileStrength(strength);

        // Track profile view
        if (isAuthenticated()) {
          try {
            await followAPI.trackProfileView(response.mentor._id);
          } catch (error) {
            console.error('Error tracking view:', error);
          }
        }

        // Check if this is user's own profile
        if (user && response.mentor.user?._id === user._id) {
          setIsOwnProfile(true);
          setEditForm({
            linkedin: response.mentor.linkedin || '',
            role: response.mentor.role || '',
            primaryExperience: response.mentor.primaryExperience || '',
            mentorshipExperience: response.mentor.mentorshipExperience || '',
            mentoringStyle: response.mentor.mentoringStyle || [],
            weeklyAvailability: response.mentor.weeklyAvailability || [],
            skills: response.mentor.skills || [],
            about: response.mentor.user?.bio || response.mentor.user?.about || '',
            headline: response.mentor.headline || `${response.mentor.role || 'Mentor'} | ${response.mentor.primaryExperience || 'Experienced Professional'}`,
          });
        } else if (isAuthenticated()) {
          // Check if already connected (only if viewing someone else's profile)
          try {
            const connectionStatus = await connectionAPI.checkConnection(response.mentor.user?._id);
            setIsConnected(connectionStatus.isConnected);

            // Check follow status
            const followStatus = await followAPI.checkFollowStatus(response.mentor.user?._id);
            setIsFollowing(followStatus.isFollowing);
            setFollowersCount(followStatus.followersCount || 0);

            // Check mentorship status for messaging capability
            const mentorshipResponse = await fetch(
              `${API_BASE}/requests/check-mentorship-status/${response.mentor.user?._id}`,
              {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
              }
            );

            if (mentorshipResponse.ok) {
              const mentorshipData = await mentorshipResponse.json();
              setCanMessage(mentorshipData.canMessage);
            }
          } catch (error) {
            console.error('Error checking connection/follow/mentorship status:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching mentor:', error);
        const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
        alert(`Failed to load mentor profile: ${errorMsg}`);
        navigate('/mentors');
      } finally {
        setLoading(false);
      }
    };

    fetchMentorData();
  }, [id, navigate, isAuthenticated, user]);

  // Fetch requests when viewing own profile
  useEffect(() => {
    const fetchRequests = async () => {
      if (!isOwnProfile) return;

      try {
        setLoadingRequests(true);
        const response = await fetch(`${API_BASE}/requests?status=${requestsTab}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        setRequests(data.requests || []);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchRequests();
  }, [isOwnProfile, requestsTab]);

  // Fetch active mentees
  useEffect(() => {
    const fetchActiveMentees = async () => {
      if (!isOwnProfile) return;

      try {
        const response = await fetch(`${API_BASE}/mentors/my-mentees`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        setActiveMentees(data.mentees || []);
        setMenteesCount(data.mentees?.length || 0);
      } catch (error) {
        console.error('Error fetching active mentees:', error);
      }
    };

    fetchActiveMentees();
  }, [isOwnProfile]);

  // Fetch sidebar data: connections, suggested mentors, upcoming events
  useEffect(() => {
    if (!isOwnProfile || !mentor) return;

    const fetchSidebarData = async () => {
      try {
        const connRes = await connectionAPI.getConnections();
        const conns = connRes.connections || [];
        setConnections(conns);

        const mentorRes = await mentorAPI.getAllMentors();
        const allMentors = mentorRes.mentors || [];
        const connectedUserIds = conns.map(c => c._id || c.user?._id);

        const myDomains = [mentor.primaryDomain, mentor.secondaryDomain]
          .filter(Boolean).map(d => d.toLowerCase());
        const myRole = (mentor.role || '').toLowerCase();

        const suggested = allMentors.filter(m => {
          if (m.user?._id === user?._id) return false;
          if (connectedUserIds.includes(m.user?._id)) return false;
          const primary = (m.primaryDomain || '').toLowerCase();
          const secondary = (m.secondaryDomain || '').toLowerCase();
          const role = (m.role || '').toLowerCase();
          const domainMatch = myDomains.some(d =>
            primary.includes(d) || d.includes(primary) ||
            secondary.includes(d) || d.includes(secondary)
          );
          const roleMatch = myRole && role && (
            role.includes(myRole) || myRole.includes(role)
          );
          return domainMatch || roleMatch;
        }).slice(0, 5);

        setSuggestedMentors(suggested);

        const eventsRes = await userAPI.getEvents();
        const now = new Date();
        const upcoming = (eventsRes.events || [])
          .filter(e => new Date(e.startDate) > now)
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
          .slice(0, 4);
        setUpcomingEvents(upcoming);
      } catch (err) {
        console.error('Error fetching sidebar data:', err);
      }
    };

    fetchSidebarData();
  }, [isOwnProfile, mentor, user]);

  const handleFollow = async () => {
    if (!isAuthenticated()) {
      alert('Please login to follow mentors');
      navigate('/login');
      return;
    }

    if (!mentor?.user?._id) return;

    const wasFollowing = isFollowing;
    const originalFollowersCount = followersCount;

    try {
      setFollowing(true);
      setIsFollowing(!wasFollowing);
      setFollowersCount(prev => wasFollowing ? Math.max(0, prev - 1) : prev + 1);

      const response = await followAPI.toggleFollow(mentor.user._id);
      setIsFollowing(response.isFollowing);
      setFollowersCount(response.followersCount);

    } catch (error) {
      console.error('Error toggling follow:', error);
      setIsFollowing(wasFollowing);
      setFollowersCount(originalFollowersCount);
      alert('Failed to update follow status');
    } finally {
      setFollowing(false);
    }
  };

  const handleConnect = async () => {
    if (!isAuthenticated()) {
      alert('Please login to connect with mentors');
      navigate('/login');
      return;
    }

    if (!mentor?.user?._id) return;

    const wasConnected = isConnected;
    const originalConnectionsCount = connectionsCount;

    try {
      setConnecting(true);
      setIsConnected(!wasConnected);
      setConnectionsCount(prev => wasConnected ? prev - 1 : prev + 1);

      const response = await connectionAPI.toggleConnection(mentor.user._id);
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

  const handleAcceptRequest = async (requestId) => {
    try {
      const response = await fetch(`${API_BASE}/requests/${requestId}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        // Remove from pending requests
        setRequests(requests.filter(req => req._id !== requestId));

        // Refresh mentor profile and mentees list
        const mentorResponse = await mentorAPI.getProfile();
        setMentor(mentorResponse.mentor);
        setMenteesCount(mentorResponse.mentor.menteesCount || mentorResponse.mentor.activeMentees?.length || 0);

        // Refresh mentees list
        const menteesResponse = await fetch(`${API_BASE}/mentors/my-mentees`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const menteesData = await menteesResponse.json();
        setActiveMentees(menteesData.mentees || []);
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const response = await fetch(`${API_BASE}/requests/${requestId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        // Remove from pending requests
        setRequests(requests.filter(req => req._id !== requestId));
        alert('Request rejected successfully');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  };

  const handleViewRequest = (requestId) => {
    navigate(`/mentor-profile/requests/${requestId}`);
  };

  const handleScheduleSession = async (formData) => {
    if (!selectedMentee) return;

    try {
      await sessionAPI.createSession({
        studentId: selectedMentee._id,
        ...formData,
      });

      alert('Session scheduled successfully! The student has been notified.');
      setShowScheduleModal(false);
      setSelectedMentee(null);
    } catch (error) {
      console.error('Error scheduling session:', error);
      throw error;
    }
  };

  const openScheduleModal = (mentee) => {
    setSelectedMentee(mentee);
    setShowScheduleModal(true);
  };

  const openHistoryModal = (mentee) => {
    setSelectedMentee(mentee);
    setShowHistoryModal(true);
  };

  const handleSaveProfile = async () => {
    try {
      await mentorAPI.updateProfile(editForm);
      setMentor({
        ...mentor,
        ...editForm,
        user: {
          ...mentor.user,
          bio: editForm.about,
          about: editForm.about,
        }
      });
      setIsEditing(false);
      const newStrength = calculateProfileStrength({ ...mentor, ...editForm });
      setProfileStrength(newStrength);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      linkedin: mentor?.linkedin || '',
      role: mentor?.role || '',
      primaryExperience: mentor?.primaryExperience || '',
      mentorshipExperience: mentor?.mentorshipExperience || '',
      mentoringStyle: mentor?.mentoringStyle || [],
      weeklyAvailability: mentor?.weeklyAvailability || [],
      skills: mentor?.skills || [],
      about: mentor?.user?.bio || mentor?.user?.about || '',
      headline: mentor?.headline || `${mentor?.role || 'Mentor'} | ${mentor?.primaryExperience || 'Experienced Professional'}`,
    });
    setIsEditing(false);
  };

  const handleProfileImageClick = () => {
    if (isOwnProfile && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleCoverImageClick = () => {
    if (isOwnProfile && coverInputRef.current) {
      coverInputRef.current.click();
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

      // Update mentor state with new profile image
      setMentor({
        ...mentor,
        user: {
          ...mentor.user,
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

  const handleCoverImageChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size should not exceed 10MB');
      return;
    }

    try {
      setUploadingCover(true);
      // For now, we'll just preview it locally
      const reader = new FileReader();
      reader.onloadend = () => {
        setMentor({
          ...mentor,
          coverImage: reader.result,
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading cover image:', error);
      alert('Failed to upload cover image');
    } finally {
      setUploadingCover(false);
    }
  };

  const getProfileStrengthLabel = () => {
    if (profileStrength < 30) return 'Beginner';
    if (profileStrength < 60) return 'Intermediate';
    if (profileStrength < 90) return 'Advanced';
    return 'All-star';
  };

  const getProfileStrengthColor = () => {
    if (profileStrength < 30) return '#ff4444';
    if (profileStrength < 60) return '#ffaa00';
    if (profileStrength < 90) return '#44aaff';
    return '#00cc66';
  };

  // Circular Progress Component
  const CircularProgressWithLabel = ({ value }) => {
    return (
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
          variant="determinate"
          value={value}
          size={80}
          thickness={4}
          sx={{
            color: getProfileStrengthColor(),
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            },
          }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="caption"
            component="div"
            sx={{
              fontSize: '16px',
              fontWeight: 600,
              color: getProfileStrengthColor()
            }}
          >
            {`${Math.round(value)}%`}
          </Typography>
        </Box>
      </Box>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
      case 'accepted':
        return (
          <span className="status-badge status-approved">
            <CheckCircleIcon sx={{ fontSize: 16 }} />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="status-badge status-rejected">
            <CancelIcon sx={{ fontSize: 16 }} />
            Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="status-badge status-pending">
            <HourglassEmptyIcon sx={{ fontSize: 16 }} />
            Pending
          </span>
        );
    }
  };

  const getSkillIcon = (skill) => {
    const skillLower = skill?.toLowerCase() || '';

    // Programming languages
    if (skillLower.includes('javascript') || skillLower.includes('js') || skillLower.includes('typescript'))
      return <JavascriptIcon sx={{ fontSize: 18 }} />;
    if (skillLower.includes('python') || skillLower.includes('code') || skillLower.includes('programming'))
      return <CodeIcon sx={{ fontSize: 18 }} />;
    if (skillLower.includes('java') || skillLower.includes('c++') || skillLower.includes('c#'))
      return <DataObjectIcon sx={{ fontSize: 18 }} />;

    // Technologies
    if (skillLower.includes('cloud') || skillLower.includes('aws') || skillLower.includes('azure'))
      return <CloudIcon sx={{ fontSize: 18 }} />;
    if (skillLower.includes('database') || skillLower.includes('sql') || skillLower.includes('mongodb'))
      return <StorageIcon sx={{ fontSize: 18 }} />;
    if (skillLower.includes('web') || skillLower.includes('frontend') || skillLower.includes('backend'))
      return <LanguageIcon sx={{ fontSize: 18 }} />;
    if (skillLower.includes('security') || skillLower.includes('cyber'))
      return <SecurityIcon sx={{ fontSize: 18 }} />;
    if (skillLower.includes('mobile') || skillLower.includes('app') || skillLower.includes('responsive'))
      return <DevicesIcon sx={{ fontSize: 18 }} />;

    // Business & Design
    if (skillLower.includes('business') || skillLower.includes('management'))
      return <BusinessIcon sx={{ fontSize: 18 }} />;
    if (skillLower.includes('design') || skillLower.includes('ui') || skillLower.includes('ux'))
      return <StarIcon sx={{ fontSize: 18 }} />;

    // Default
    return <WorkIcon sx={{ fontSize: 18 }} />;
  };

  if (loading) {
    return (
      <div className="mentor-profile-page">
        <HomeNavbar />
        <div className={`app-container${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <Sidebar />
          <div className="main-content">
            <PageSkeleton variant="profile" />
          </div>
        </div>
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="mentor-profile-page">
        <HomeNavbar />
        <div className={`app-container${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
          <Sidebar />
          <div className="main-content">
            <div className="error-message">Mentor not found</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mentor-profile-page">
      <HomeNavbar />
      <div className={`app-container${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <Sidebar />
        <main className="mentor-profile-main">

          {/* 1. Banner - Full Width */}
          <div className="profile-banner-wrapper">
            <div
              className="cover-image-section"
              onClick={handleCoverImageClick}
              style={{ cursor: isOwnProfile ? 'pointer' : 'default' }}
            >
              {mentor.coverImage ? (
                <img
                  src={mentor.coverImage}
                  alt="Cover"
                  className="cover-image-fill"
                />
              ) : (
                <div className="cover-image-gradient" />
              )}
              {isOwnProfile && (
                <div className="cover-upload-overlay">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  {uploadingCover ? 'Uploading...' : 'Change cover'}
                </div>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverImageChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Two-Column Layout */}
          <div className="profile-cards-container">
            <div className={`profile-two-col${isOwnProfile ? ' has-sidebar' : ''}`}>
            <div className="profile-left-col">

            {/* 2. Profile Header Card */}
            <div className="profile-section-card profile-header-info-card">
              {isOwnProfile && (
                <Tooltip title="Edit Profile" arrow>
                  <span className="inline-edit-pencil card-edit-btn" onClick={() => setIsEditing(!isEditing)}>
                    <EditIcon sx={{ fontSize: 18 }} />
                  </span>
                </Tooltip>
              )}
              <div className="profile-top-section">
                <div className="profile-photo-wrapper" onClick={handleProfileImageClick}>
                  <img
                    src={mentor.user?.profileImage || 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png'}
                    alt={mentor.user?.name || 'Mentor'}
                    className="profile-photo-large"
                  />
                  {isOwnProfile && (
                    <div className="photo-edit-badge">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    style={{ display: 'none' }}
                  />
                </div>

                <div className="profile-name-section">
                  <h1 className="profile-name-large">
                    {mentor.user?.name || 'Mentor'}
                    {mentor.verified && (
                      <span className="verified-badge-large">
                        <CheckCircleIcon sx={{ fontSize: 24, color: '#0a66c2' }} />
                      </span>
                    )}
                  </h1>
                  <div className="profile-role-stats-row">
                    <div className="profile-designation">
                      <PersonIcon sx={{ fontSize: 18, marginRight: '6px' }} />
                      Mentor
                    </div>
                    <span className="role-stats-divider">·</span>
                    <Tooltip title="View Followers" arrow>
                      <span
                        className="inline-stat"
                        onClick={() => {
                          setModalTitle('Followers');
                          setModalFetch(() => () => followAPI.getFollowers(mentor.user._id).then(r => r.followers || []));
                          setModalOpen(true);
                        }}
                      >
                        <strong>{followersCount}</strong> Followers
                      </span>
                    </Tooltip>
                    <span className="role-stats-divider">·</span>
                    <Tooltip title="View Connections" arrow>
                      <span
                        className="inline-stat"
                        onClick={() => {
                          setModalTitle('Connections');
                          setModalFetch(() => () => connectionAPI.getConnections().then(r => r.connections || []));
                          setModalOpen(true);
                        }}
                      >
                        <strong>{connectionsCount}</strong> Connections
                      </span>
                    </Tooltip>
                  </div>
                  <p className="profile-headline-large">
                    {mentor.headline || `${mentor.role || 'Mentor'} | ${mentor.primaryExperience || 'Experienced Professional'}`}
                  </p>
                  {(mentor.user?.bio || mentor.user?.about) && (() => {
                    const tagline = mentor.user?.bio || mentor.user?.about || '';
                    return (
                      <p className="profile-tagline">
                        {tagline.length > 120 ? tagline.substring(0, 120) + '...' : tagline}
                      </p>
                    );
                  })()}
                </div>
              </div>

              {!isOwnProfile && (
                <div className="profile-action-buttons">
                  <button
                    className={`btn-follow-action ${isFollowing ? 'following' : ''}`}
                    onClick={handleFollow}
                    disabled={following}
                  >
                    {following ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <button
                    className="btn-connect-action"
                    onClick={handleConnect}
                    disabled={connecting}
                  >
                    {connecting ? 'Loading...' : isConnected ? 'Connected' : 'Connect'}
                  </button>
                  {canMessage && (
                    <Tooltip title="Send Message" arrow>
                      <button
                        className="btn-icon-action"
                        onClick={() => navigate(`/messages/${mentor.user?._id}`)}
                      >
                        <EmailIcon />
                      </button>
                    </Tooltip>
                  )}
                  {mentor.linkedin && (
                    <Tooltip title="View LinkedIn Profile" arrow>
                      <a
                        href={mentor.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-icon-action"
                      >
                        <LinkedInIcon />
                      </a>
                    </Tooltip>
                  )}
                </div>
              )}
            </div>

            {/* 3. About Card */}
            {(mentor.user?.bio || mentor.user?.about) && !isEditing && (
              <section className="profile-section-card about-section-card">
                <h3 className="section-title-main">About</h3>
                <p className="about-content">{mentor.user?.bio || mentor.user?.about}</p>
              </section>
            )}

            {/* 4. Skills & Domains Card */}
            {(mentor.skills?.length > 0 || mentor.primaryDomain || mentor.secondaryDomain) && (
              <div className="profile-section-card">
                <h3 className="section-title-main">
                  <CodeIcon sx={{ fontSize: 18, marginRight: '6px' }} />
                  Skills & Domains
                </h3>
                <div className="skills-chips-container">
                  {mentor.primaryDomain && (
                    <Tooltip title="Primary Domain" arrow>
                      <div className="skill-chip skill-chip-primary">
                        <StarIcon sx={{ fontSize: 18 }} />
                        {mentor.primaryDomain}
                      </div>
                    </Tooltip>
                  )}
                  {mentor.secondaryDomain && (
                    <Tooltip title="Secondary Domain" arrow>
                      <div className="skill-chip">
                        {getSkillIcon(mentor.secondaryDomain)}
                        {mentor.secondaryDomain}
                      </div>
                    </Tooltip>
                  )}
                  {mentor.skills?.map((skill, index) => (
                    <Tooltip key={index} title={skill} arrow>
                      <div className="skill-chip">
                        {getSkillIcon(skill)}
                        {skill}
                      </div>
                    </Tooltip>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Experience & Expertise Card */}
            <div className="profile-section-card">
              <h3 className="section-title-main">Experience & Expertise</h3>
              <div className="expertise-grid">
                {mentor.role && (
                  <div className="expertise-card">
                    <div className="expertise-card__icon expertise-card__icon--role">
                      <BusinessIcon sx={{ fontSize: 20 }} />
                    </div>
                    <div className="expertise-card__body">
                      <span className="expertise-card__label">Current Role</span>
                      <span className="expertise-card__value">{mentor.role}</span>
                    </div>
                  </div>
                )}
                {mentor.primaryExperience && (
                  <div className="expertise-card">
                    <div className="expertise-card__icon expertise-card__icon--exp">
                      <WorkHistoryIcon sx={{ fontSize: 20 }} />
                    </div>
                    <div className="expertise-card__body">
                      <span className="expertise-card__label">Industry Experience</span>
                      <span className="expertise-card__value">
                        {mentor.primaryExperience} {!isNaN(mentor.primaryExperience) ? 'Years' : ''}
                      </span>
                    </div>
                  </div>
                )}
                {mentor.mentorshipExperience && (
                  <div className="expertise-card">
                    <div className="expertise-card__icon expertise-card__icon--mentor">
                      <SchoolIcon sx={{ fontSize: 20 }} />
                    </div>
                    <div className="expertise-card__body">
                      <span className="expertise-card__label">Mentorship Experience</span>
                      <span className="expertise-card__value">
                        {mentor.mentorshipExperience} {!isNaN(mentor.mentorshipExperience) ? 'Years' : ''}
                      </span>
                    </div>
                  </div>
                )}
                {mentor.primaryDomain && (
                  <div className="expertise-card">
                    <div className="expertise-card__icon expertise-card__icon--domain">
                      <CodeIcon sx={{ fontSize: 20 }} />
                    </div>
                    <div className="expertise-card__body">
                      <span className="expertise-card__label">Primary Domain</span>
                      <span className="expertise-card__value">{mentor.primaryDomain}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 5. Availability Card */}
            {mentor.weeklyAvailability?.length > 0 && (
              <div className="profile-section-card">
                <h3 className="section-title-main">
                  <EventAvailableIcon sx={{ fontSize: 18, marginRight: '6px' }} />
                  Availability
                </h3>
                <div className="preference-tags-container">
                  {mentor.weeklyAvailability.map((avail, index) => (
                    <span key={index} className="preference-tag">
                      <AccessTimeIcon sx={{ fontSize: 14, marginRight: '4px' }} />
                      {avail}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Mentoring Style Card */}
            {mentor.mentoringStyle?.length > 0 && (
              <div className="profile-section-card">
                <h3 className="section-title-main">
                  <GroupsIcon sx={{ fontSize: 18, marginRight: '6px' }} />
                  Mentoring Style
                </h3>
                <div className="preference-tags-container">
                  {mentor.mentoringStyle.map((style, index) => (
                    <span key={index} className="preference-tag">{style}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Edit Form or Display Sections */}
            {isEditing ? (
              <div className="profile-section-card edit-profile-card">
                <h3 className="section-title-main">Edit Profile Information</h3>

                <div className="edit-form-grid-new">
                  <div className="form-group-new">
                    <label>Headline</label>
                    <input
                      type="text"
                      value={editForm.headline}
                      onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
                      placeholder="Your professional headline"
                      className="form-input-new"
                    />
                  </div>

                  <div className="form-group-new">
                    <label>Current Role</label>
                    <input
                      type="text"
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      placeholder="e.g., Senior Software Engineer"
                      className="form-input-new"
                    />
                  </div>

                  <div className="form-group-new">
                    <label>Years of Experience</label>
                    <input
                      type="text"
                      value={editForm.primaryExperience}
                      onChange={(e) => setEditForm({ ...editForm, primaryExperience: e.target.value })}
                      placeholder="e.g., 5+ years"
                      className="form-input-new"
                    />
                  </div>

                  <div className="form-group-new">
                    <label>Mentorship Experience</label>
                    <input
                      type="text"
                      value={editForm.mentorshipExperience}
                      onChange={(e) => setEditForm({ ...editForm, mentorshipExperience: e.target.value })}
                      placeholder="e.g., 3 years"
                      className="form-input-new"
                    />
                  </div>

                  <div className="form-group-new full-width">
                    <label>LinkedIn Profile</label>
                    <input
                      type="url"
                      value={editForm.linkedin}
                      onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="form-input-new"
                    />
                  </div>
                </div>

                <div className="edit-form-actions-new">
                  <button className="btn-cancel-new" onClick={handleCancelEdit}>Cancel</button>
                  <button className="btn-save-new" onClick={handleSaveProfile}>Save Changes</button>
                </div>
              </div>
            ) : (
              <>





              {/* Mentees Section (Own Profile Only) */}
              {isOwnProfile && !id && (
                <div className="mentorship-dashboard-card">
                  <div className="dashboard-tabs">
                    <button
                      className={`dashboard-tab ${menteesTab === 'active' ? 'active' : ''}`}
                      onClick={() => setMenteesTab('active')}
                    >
                      <GroupsIcon sx={{ fontSize: 18, marginRight: '6px' }} />
                      Active Mentees
                    </button>
                    <button
                      className={`dashboard-tab ${menteesTab === 'past' ? 'active' : ''}`}
                      onClick={() => setMenteesTab('past')}
                    >
                      <HistoryIcon sx={{ fontSize: 18, marginRight: '6px' }} />
                      Past Mentees
                    </button>
                  </div>

                  <div className="dashboard-content">
                    {loadingMentees ? (
                      <div className="loading-state">
                        <CircularProgress size={32} />
                        <p>Loading mentees...</p>
                      </div>
                    ) : (
                      <div className="mentees-grid-new">
                        {menteesTab === 'active' ? (
                          activeMentees.length === 0 ? (
                            <div className="empty-state-card">
                              <div className="empty-state-icon">
                                <GroupsIcon sx={{ fontSize: 56 }} />
                              </div>
                              <h4 className="empty-state-title">No active mentees yet</h4>
                              <p className="empty-state-message">
                                Accept requests from the sidebar to start mentoring!
                              </p>
                            </div>
                          ) : (
                            activeMentees.map((mentee) => (
                              <div key={mentee._id} className="mentee-card-new compact">
                                <div className="mentee-header">
                                  <img
                                    src={mentee.profileImage || 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png'}
                                    alt={mentee.name}
                                    className="mentee-avatar-new"
                                  />
                                  <div className="mentee-basic-info">
                                    <h4 className="mentee-name">{mentee.name}</h4>
                                    <p className="mentee-email">{mentee.email}</p>
                                    <span className="mentee-status-chip">
                                      <CalendarTodayIcon sx={{ fontSize: 12, marginRight: '4px' }} />
                                      Active Mentee
                                    </span>
                                  </div>
                                </div>

                                <div className="mentee-actions-new compact-actions">
                                  <Tooltip title="Chat with Mentee" arrow>
                                    <button
                                      className="btn-mentee-action"
                                      onClick={() => navigate(`/messages/${mentee._id}`)}
                                    >
                                      <ChatIcon sx={{ fontSize: 16 }} />
                                      Chat
                                    </button>
                                  </Tooltip>
                                  <Tooltip title="Schedule Session" arrow>
                                    <button
                                      className="btn-mentee-action"
                                      onClick={() => openScheduleModal(mentee)}
                                    >
                                      <CalendarTodayIcon sx={{ fontSize: 16 }} />
                                      Schedule
                                    </button>
                                  </Tooltip>
                                  <Tooltip title="View Session History" arrow>
                                    <button
                                      className="btn-mentee-action"
                                      onClick={() => openHistoryModal(mentee)}
                                    >
                                      <HistoryIcon sx={{ fontSize: 16 }} />
                                      History
                                    </button>
                                  </Tooltip>
                                  <Tooltip title="View Profile" arrow>
                                    <button
                                      className="btn-icon-action btn-view-profile"
                                      onClick={() => navigate(`/student/${mentee._id}`)}
                                    >
                                      <AccountCircleIcon sx={{ fontSize: 20 }} />
                                    </button>
                                  </Tooltip>
                                </div>
                              </div>
                            ))
                          )
                        ) : (
                          pastMentees.length === 0 ? (
                            <div className="empty-state-card">
                              <div className="empty-state-icon">
                                <HistoryIcon sx={{ fontSize: 56 }} />
                              </div>
                              <h4 className="empty-state-title">No past mentees</h4>
                              <p className="empty-state-message">
                                Completed mentorships will appear here once they're marked as finished.
                              </p>
                            </div>
                          ) : (
                            pastMentees.map((mentee) => (
                              <div key={mentee._id} className="mentee-card-new compact mentee-card-past">
                                <div className="mentee-header">
                                  <img
                                    src={mentee.profileImage || 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png'}
                                    alt={mentee.name}
                                    className="mentee-avatar-new"
                                  />
                                  <div className="mentee-basic-info">
                                    <h4 className="mentee-name">{mentee.name}</h4>
                                    <p className="mentee-email">{mentee.email}</p>
                                    <span className="mentee-status-chip completed">
                                      <CheckCircleIcon sx={{ fontSize: 12, marginRight: '4px' }} />
                                      Completed
                                    </span>
                                  </div>
                                </div>

                                <div className="mentee-actions-new compact-actions">
                                  <Tooltip title="View Session History" arrow>
                                    <button
                                      className="btn-mentee-action"
                                      onClick={() => openHistoryModal(mentee)}
                                    >
                                      <HistoryIcon sx={{ fontSize: 16 }} />
                                      History
                                    </button>
                                  </Tooltip>
                                  <Tooltip title="View Profile" arrow>
                                    <button
                                      className="btn-icon-action btn-view-profile"
                                      onClick={() => navigate(`/student/${mentee._id}`)}
                                    >
                                      <AccountCircleIcon sx={{ fontSize: 20 }} />
                                    </button>
                                  </Tooltip>
                                </div>
                              </div>
                            ))
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

            </div>{/* end profile-left-col */}

            {/* Right Column - Sidebar Cards */}
            {isOwnProfile && (
              <div className="profile-right-col">
                <div className="profile-right-sticky">

                  {/* 9. My Requests Card */}
                  <div className="profile-section-card sidebar-card sidebar-requests-card">
                  <div className="sidebar-requests-header">
                    <h3 className="sidebar-card-title">
                      <EmailIcon sx={{ fontSize: 18 }} />
                      My Requests
                      {requests.length > 0 && (
                        <span className="sidebar-card-count">{requests.length}</span>
                      )}
                    </h3>
                    <div className="sidebar-requests-dropdown">
                      <FilterListIcon sx={{ fontSize: 16, color: 'var(--text-secondary)' }} />
                      <select
                        value={requestsTab}
                        onChange={(e) => setRequestsTab(e.target.value)}
                        className="requests-filter-select"
                      >
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  <div className="sidebar-requests-list">
                    {loadingRequests ? (
                      <div className="sidebar-loading">
                        <CircularProgress size={24} />
                      </div>
                    ) : requests.length === 0 ? (
                      <p className="sidebar-empty-text">
                        No {requestsTab} requests
                      </p>
                    ) : (
                      requests.slice(0, 5).map((request) => (
                        <div key={request._id} className="sidebar-request-item">
                          <img
                            src={request.student?.profileImage || 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png'}
                            alt={request.student?.name}
                            className="sidebar-avatar"
                          />
                          <div className="sidebar-request-info">
                            <span className="sidebar-connection-name">
                              {request.student?.name || 'Student'}
                            </span>
                            <span className="sidebar-request-msg">
                              {request.message?.substring(0, 50)}...
                            </span>
                          </div>
                          {requestsTab === 'pending' && (
                            <div className="sidebar-request-actions">
                              <Tooltip title="Accept" arrow>
                                <button
                                  className="sidebar-req-btn sidebar-req-accept"
                                  onClick={() => handleAcceptRequest(request._id)}
                                >
                                  <CheckCircleIcon sx={{ fontSize: 18 }} />
                                </button>
                              </Tooltip>
                              <Tooltip title="Reject" arrow>
                                <button
                                  className="sidebar-req-btn sidebar-req-reject"
                                  onClick={() => handleRejectRequest(request._id)}
                                >
                                  <CancelIcon sx={{ fontSize: 18 }} />
                                </button>
                              </Tooltip>
                            </div>
                          )}
                          {requestsTab !== 'pending' && (
                            <div className="sidebar-request-status">
                              {getStatusBadge(request.status)}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    {requests.length > 5 && (
                      <button
                        className="sidebar-see-all"
                        onClick={() => navigate('/mentor-profile/requests')}
                      >
                        See all requests
                      </button>
                    )}
                  </div>
                </div>

                  {/* 10. Connections Card */}
                  <div className="profile-section-card sidebar-card">
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
                          <button className="sidebar-see-all" onClick={() => {
                            setModalTitle('Connections');
                            setModalFetch(() => () => connectionAPI.getConnections().then(r => r.connections || []));
                            setModalOpen(true);
                          }}>
                            See all connections
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 11. Suggested Mentors Card */}
                  <div className="profile-section-card sidebar-card">
                    <h3 className="sidebar-card-title">Suggested Mentors</h3>
                    {suggestedMentors.length === 0 ? (
                      <p className="sidebar-empty-text">No suggestions available</p>
                    ) : (
                      <div className="sidebar-connections-list">
                        {suggestedMentors.map((m) => (
                          <div
                            key={m._id}
                            className="sidebar-connection-item"
                            onClick={() => navigate(`/mentors/${m._id}`)}
                          >
                            <img
                              src={m.user?.profileImage || 'https://cdn-icons-png.flaticon.com/512/3177/3177440.png'}
                              alt={m.user?.name}
                              className="sidebar-avatar"
                            />
                            <div className="sidebar-connection-info">
                              <span className="sidebar-connection-name">{m.user?.name}</span>
                              <span className="sidebar-connection-role">{m.primaryDomain || m.role || 'Mentor'}</span>
                            </div>
                            <span className="sidebar-match-badge">Match</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 12. Upcoming Events Card */}
                  <div className="profile-section-card sidebar-card">
                    <h3 className="sidebar-card-title">Upcoming Events</h3>
                    {upcomingEvents.length === 0 ? (
                      <p className="sidebar-empty-text">No upcoming events</p>
                    ) : (
                      <div className="sidebar-connections-list">
                        {upcomingEvents.map((event) => (
                          <div
                            key={event._id}
                            className="sidebar-connection-item"
                            onClick={() => navigate(`/events/${event._id}`)}
                          >
                            <div className="sidebar-event-date">
                              <span className="sidebar-event-month">
                                {new Date(event.startDate).toLocaleString('default', { month: 'short' })}
                              </span>
                              <span className="sidebar-event-day">
                                {new Date(event.startDate).getDate()}
                              </span>
                            </div>
                            <div className="sidebar-connection-info">
                              <span className="sidebar-connection-name">{event.eventName}</span>
                              <span className="sidebar-connection-role">{event.eventType} · {event.eventMode}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}
            </div>
          </div>

          <Footer />
        </main>
      </div>

      {/* Modals */}
      <ScheduleSessionModal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setSelectedMentee(null);
        }}
        mentee={selectedMentee}
        onSchedule={handleScheduleSession}
      />

      <SessionHistory
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedMentee(null);
        }}
        mentee={selectedMentee}
      />
      {modalFetch && (
        <UserListModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={modalTitle}
          fetchUsers={modalFetch}
        />
      )}
    </div>
  );
};

export default MentorProfile;
