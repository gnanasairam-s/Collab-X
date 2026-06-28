import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import { TextField } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import { AuthContext } from '../contexts/AuthContext';
import './home.css';

function HomeComponent() {

    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const { addToUserHistory } = useContext(AuthContext);

    let handleJoinVideoCall = async () => {
        if (!meetingCode.trim()) return;
        await addToUserHistory(meetingCode);
        navigate(`/${meetingCode}`);
    }

    let handleCreateMeeting = () => {
        const randomCode = Math.random().toString(36).substring(2, 10);
        navigate(`/${randomCode}`);
    }

    let handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleJoinVideoCall();
        }
    }

    return (
        <div className="home-container">
            {/* Navbar */}
            <nav className="home-navbar">
                <div className="home-nav-left">
                    <img src="/logoX.png" alt="CollabX" />
                    <h2 className="home-logo">
                        <span className="teal">Collab</span><span className="blue">X</span>
                    </h2>
                </div>
                <div className="home-nav-right">
                    <button className="home-nav-link" onClick={() => navigate("/history")}>
                        <RestoreIcon fontSize="small" />
                        History
                    </button>
                    <button className="home-logout-btn" onClick={() => {
                        localStorage.removeItem("token");
                        navigate("/auth");
                    }}>
                        Logout
                    </button>
                </div>
            </nav>

            {/* Hero */}
            <div className="home-hero">
                <h1>
                    <span className="teal">Collaborate</span> Without <span className="blue">Limits</span>
                </h1>
                <p>HD video calls, screen sharing, and real-time chat — all in one place.</p>

                {/* Cards */}
                <div className="home-cards">
                    {/* Create Card */}
                    <div className="home-card">
                        <div className="home-card-icon">
                            <VideoCallIcon />
                        </div>
                        <h3>Create Meeting</h3>
                        <p>Start an instant meeting and invite others</p>
                        <button className="home-card-btn" onClick={handleCreateMeeting}>
                            Start Now
                        </button>
                    </div>

                    {/* Join Card */}
                    <div className="home-card">
                        <div className="home-card-icon">
                            <GroupAddIcon />
                        </div>
                        <h3>Join Meeting</h3>
                        <p>Enter a code to join an existing meeting</p>
                        <TextField 
                            className="home-card-input"
                            onChange={e => setMeetingCode(e.target.value)}
                            onKeyPress={handleKeyPress}
                            label="Meeting code" 
                            variant="outlined"
                            size="small"
                        />
                        <button className="home-card-btn" onClick={handleJoinVideoCall}>
                            Join Now
                        </button>
                    </div>
                </div>
            </div>

            {/* Features */}
            <div className="home-features">
                <div className="home-feature-item">
                    <span className="home-feature-dot"></span>
                    HD Video
                </div>
                <div className="home-feature-item">
                    <span className="home-feature-dot"></span>
                    Screen Share
                </div>
                <div className="home-feature-item">
                    <span className="home-feature-dot"></span>
                    Chat
                </div>
                <div className="home-feature-item">
                    <span className="home-feature-dot"></span>
                    Secure
                </div>
            </div>
        </div>
    )
}

export default withAuth(HomeComponent);