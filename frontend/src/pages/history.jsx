import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import axios from 'axios';
import server from '../environment';
import './history.css';

export default function History() {

    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const routeTo = useNavigate();

    const fetchHistory = async () => {
        try {
            const history = await getHistoryOfUser();
            setMeetings(history);
        } catch {
            setMeetings([]);
        }
    }

    useEffect(() => {
        fetchHistory();
        // eslint-disable-next-line
    }, []);

    let formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = { day: 'numeric', month: 'short', year: 'numeric' };
        return date.toLocaleDateString('en-GB', options);
    }

    let formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    let handleDelete = async (e, meetingId) => {
        e.stopPropagation();
        try {
            await axios.delete(`${server}/api/v1/users/delete_meeting`, {
                data: { meeting_id: meetingId }
            });
            setMeetings(meetings.filter(m => m._id !== meetingId));
        } catch (err) {
            console.log(err);
        }
    }

    return (
        <div className="history-container">
            <nav className="history-navbar">
                <div className="history-nav-left">
                    <img src="/logoX.png" alt="CollabX" />
                    <h2 className="history-logo">
                        <span className="teal">Collab</span><span className="blue">X</span>
                    </h2>
                </div>
                <div className="history-nav-right">
                    <button className="history-home-btn" onClick={() => routeTo("/home")}>
                        <HomeIcon fontSize="small" />
                        Home
                    </button>
                </div>
            </nav>

            <div className="history-content">
                <h1 className="history-title">Meeting History</h1>
                <p className="history-subtitle">Your recent meetings and activity</p>

                {meetings.length !== 0 ? (
                    <div className="history-cards">
                        {meetings.map((e, i) => (
                            <div key={i} className="history-card">
                                <div className="history-card-left">
                                    <span className="history-card-label">Meeting Code</span>
                                    <span className="history-card-code">{e.meetingCode}</span>
                                </div>
                                <div className="history-card-right">
                                    <span className="history-card-date">
                                        <CalendarTodayIcon sx={{ fontSize: 14 }} />
                                        {formatDate(e.date)}
                                    </span>
                                    <span className="history-card-time">
                                        {formatTime(e.date)}
                                    </span>
                                    <button 
                                        className="history-delete-btn"
                                        onClick={(event) => handleDelete(event, e._id)}
                                        title="Delete"
                                    >
                                        <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="history-empty">
                        <div className="history-empty-icon">
                            <VideoCallIcon />
                        </div>
                        <h3>No Meetings Yet</h3>
                        <p>Your meeting history will appear here</p>
                    </div>
                )}
            </div>
        </div>
    )
}