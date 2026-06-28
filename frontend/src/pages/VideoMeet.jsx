/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import InfoIcon from '@mui/icons-material/Info';
import PeopleIcon from '@mui/icons-material/People';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import PanToolIcon from '@mui/icons-material/PanTool';
import PersonIcon from '@mui/icons-material/Person';
import styles from "../styles/videoComponent.module.css";
import server from '../environment';
import './lobby.css';

const server_url = server;
var connections = {};
var dataChannels = {};

const peerConfigConnections = {
    "iceServers": [{ "urls": "stun:stun.l.google.com:19302" }]
}

const REACTIONS = ['👍', '❤️', '🎉', '😮', '👏', '🔥'];

export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();
    let localVideoref = useRef();
    let previewStreamRef = useRef(null);
    let chatDisplayRef = useRef(null);
    let hostIdRef = useRef(null);
    let isHostRef = useRef(false);
    let participantNames = useRef({});
    let usernameRef = useRef("");

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);
    let [video, setVideo] = useState(true);
    let [audio, setAudio] = useState(true);
    let [screen, setScreen] = useState(false);
    let [showChat, setShowChat] = useState(false);
    let [showParticipants, setShowParticipants] = useState(false);
    let [showReactions, setShowReactions] = useState(false);
    let [screenAvailable, setScreenAvailable] = useState(false);
    let [messages, setMessages] = useState([]);
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(0);
    let [inCall, setInCall] = useState(false);
    let [username, setUsername] = useState("");
    let [meetCode, setMeetCode] = useState("");
    let [showShareModal, setShowShareModal] = useState(false);
    let [copied, setCopied] = useState(false);
    let [raisedHands, setRaisedHands] = useState({});
    let [floatingReaction, setFloatingReaction] = useState(null);
    let [participants, setParticipants] = useState([]);
    let [videos, setVideos] = useState([]);
    const meetingUrl = window.location.href;

    const isGuestPath = window.location.pathname === '/guest-join';
    const hasToken = !!localStorage.getItem("token");
    const isGuest = isGuestPath || !hasToken;
    const [startedAsGuest] = useState(isGuestPath || !hasToken);

    useEffect(() => { usernameRef.current = username; }, [username]);

    useEffect(() => {
        const path = window.location.pathname.replace('/', '');
        const params = new URLSearchParams(window.location.search);
        const guestName = params.get('guestname');
        if (guestName) setUsername(guestName);
        
        if (path && path !== 'home' && path !== 'auth' && path !== 'history' && path !== 'guest-join') {

            setMeetCode(path);
             if (guestName) {
            setInCall(true);
            }
        }
        startPreview();
    }, []);

    useEffect(() => { if (!inCall) updatePreview(); }, [video, audio]);
    useEffect(() => { if (inCall) getUserMedia(); }, [video, audio, inCall]);

    const startPreview = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            previewStreamRef.current = stream;
            if (localVideoref.current) localVideoref.current.srcObject = stream;
            setVideoAvailable(true); setAudioAvailable(true);
            if (navigator.mediaDevices.getDisplayMedia) setScreenAvailable(true);
        } catch (e) { setVideoAvailable(false); setAudioAvailable(false); }
    };

    const updatePreview = () => {
        if (previewStreamRef.current) {
            const vt = previewStreamRef.current.getVideoTracks()[0];
            const at = previewStreamRef.current.getAudioTracks()[0];
            if (vt) vt.enabled = video;
            if (at) at.enabled = audio;
        }
    };

    let getUserMediaSuccess = (stream) => {
        try { if (window.localStream) window.localStream.getTracks().forEach(t => t.stop()); } catch(e){}
        if (previewStreamRef.current) { previewStreamRef.current.getTracks().forEach(t => t.stop()); previewStreamRef.current = null; }
        window.localStream = stream;
        if (localVideoref.current) localVideoref.current.srcObject = stream;
        for (let id in connections) {
            if (id === socketIdRef.current) continue;
            stream.getTracks().forEach(track => {
                try {
                    const sender = connections[id].getSenders().find(s => s.track?.kind === track.kind);
                    if (sender) sender.replaceTrack(track);
                    else connections[id].addTrack(track, stream);
                } catch(e) {}
            });
        }
        if (!socketRef.current || !socketRef.current.connected) connectToSocketServer();
    }

    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({video: video, audio: audio})
                .then(getUserMediaSuccess).catch(e => console.log(e));
        } else {
            try { 
                if (window.localStream) window.localStream.getTracks().forEach(t => t.stop());
                if (localVideoref.current) localVideoref.current.srcObject = null;
            } catch(e){}
            if (!socketRef.current || !socketRef.current.connected) connectToSocketServer();
        }
    }

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message);
        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then(d => connections[fromId].setLocalDescription(d).then(() =>
                            socketRef.current.emit('signal', fromId, JSON.stringify({'sdp': connections[fromId].localDescription}))
                        )).catch(e => console.log(e));
                    }
                }).catch(e => console.log(e));
            }
            if (signal.ice) connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
        }
    }

    const updateParticipants = () => {
        const list = [{
            id: socketIdRef.current,
            name: usernameRef.current || 'Me',
            host: isHostRef.current
        }];
        Object.entries(participantNames.current).forEach(([id, name]) => {
            if (id !== socketIdRef.current) {
                list.push({ id, name: name || 'Guest', host: id === hostIdRef.current });
            }
        });
        setParticipants([...list]);
    };

    const setupDataChannel = (peerId, pc, asOfferer) => {
        if (asOfferer) {
            const dc = pc.createDataChannel('meta');
            dataChannels[peerId] = dc;
            dc.onopen = () => {
                try { dc.send(JSON.stringify({ type: 'name', name: usernameRef.current || 'Me' })); } catch(e) {}
            };
            dc.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    if (data.type === 'name') {
                        participantNames.current[peerId] = data.name;
                        updateParticipants();
                    }
                } catch(err) {}
            };
        } else {
            pc.ondatachannel = (e) => {
                const dc = e.channel;
                dataChannels[peerId] = dc;
                dc.onopen = () => {
                    try { dc.send(JSON.stringify({ type: 'name', name: usernameRef.current || 'Me' })); } catch(e) {}
                };
                dc.onmessage = (ev) => {
                    try {
                        const data = JSON.parse(ev.data);
                        if (data.type === 'name') {
                            participantNames.current[peerId] = data.name;
                            updateParticipants();
                        }
                    } catch(err) {}
                };
            };
        }
    };

    let connectToSocketServer = () => {
        if (socketRef.current && socketRef.current.connected) return;
        socketRef.current = io.connect(server_url, {secure: false});
        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            const roomPath = meetCode ? `/${meetCode}` : window.location.pathname;
            socketRef.current.emit('join-call', roomPath, usernameRef.current || 'Guest');
            socketIdRef.current = socketRef.current.id;
            participantNames.current[socketIdRef.current] = usernameRef.current || 'Me';

            socketRef.current.on('chat-message', addMessage);
            socketRef.current.on('meeting-ended', () => {
                try { if(localVideoref.current?.srcObject) localVideoref.current.srcObject.getTracks().forEach(t => t.stop()); } catch(e){}
                 window.location.href = startedAsGuest  ? "/" : "/home";
            });
            socketRef.current.on('reaction-received', (reaction, sender) => { setFloatingReaction({ reaction, sender }); setTimeout(() => setFloatingReaction(null), 3000); });
            socketRef.current.on('hand-raised', (name, id) => setRaisedHands(prev => ({ ...prev, [id]: name })));
            socketRef.current.on('hand-lowered', (id) => setRaisedHands(prev => { const u = {...prev}; delete u[id]; return u; }));

            socketRef.current.on('user-left', (id) => {
                setVideos(v => v.filter(vid => vid.socketId !== id));
                if(connections[id]) { connections[id].close(); delete connections[id]; }
                if(dataChannels[id]) { delete dataChannels[id]; }
                delete participantNames.current[id];
                updateParticipants();
            });

            socketRef.current.on('user-joined', (id, clients, joinedUsername, isHost, hostId) => {
                participantNames.current[id] = joinedUsername || 'Guest';
                if (hostId) hostIdRef.current = hostId;
                if (isHost && id === socketIdRef.current) { isHostRef.current = true; hostIdRef.current = socketIdRef.current; }
                participantNames.current[socketIdRef.current] = usernameRef.current || 'Me';

                clients.forEach(socketListId => {
                    if (socketListId === socketIdRef.current || connections[socketListId]) return;
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);
                    setupDataChannel(socketListId, connections[socketListId], false);
                    connections[socketListId].onicecandidate = e => { if(e.candidate) socketRef.current.emit('signal', socketListId, JSON.stringify({'ice': e.candidate})); };
                    connections[socketListId].ontrack = (event) => {
                        setVideos(v => {
                            let exists = v.find(vi => vi.socketId === socketListId);
                            if(exists) return v.map(vi => vi.socketId===socketListId ? {...vi, stream: event.streams[0]} : vi);
                            return [...v, {socketId: socketListId, stream: event.streams[0]}];
                        });
                    };
                    if(window.localStream) {
                        window.localStream.getTracks().forEach(t => { try { connections[socketListId].addTrack(t, window.localStream); } catch(e) {} });
                    }
                });

                updateParticipants();

                if(id === socketIdRef.current) {
                    setTimeout(() => {
                        for(let id2 in connections) {
                            if(id2 === socketIdRef.current) continue;
                            try { if(window.localStream) window.localStream.getTracks().forEach(t => { try { connections[id2].addTrack(t, window.localStream); } catch(e) {} }); } catch(e){}
                            setupDataChannel(id2, connections[id2], true);
                            connections[id2].createOffer().then(d => connections[id2].setLocalDescription(d).then(() => socketRef.current.emit('signal', id2, JSON.stringify({'sdp': connections[id2].localDescription})))).catch(e => console.log(e));
                        }
                    }, 1000);
                }
            });
        });
    }

    let handleEndCall = () => {
        if (isHostRef.current && socketRef.current) socketRef.current.emit('end-meeting', window.location.pathname);
        try { if(localVideoref.current?.srcObject) localVideoref.current.srcObject.getTracks().forEach(t => t.stop()); if(previewStreamRef.current) previewStreamRef.current.getTracks().forEach(t => t.stop()); } catch(e){}
        window.location.href = startedAsGuest  ? "/" : "/home";
    }

    const addMessage = (data, sender, socketIdSender) => {
        setMessages(prev => [...prev, {sender, data, me: socketIdSender === socketIdRef.current}]);
        if(socketIdSender !== socketIdRef.current && !showChat) setNewMessages(p => p + 1);
        setTimeout(() => { if (chatDisplayRef.current) chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight; }, 50);
    };

    let sendMessage = () => { if(!message.trim()) return; socketRef.current.emit('chat-message', message, usernameRef.current || 'Me'); setMessage(""); }
    let sendReaction = (reaction) => { socketRef.current.emit('send-reaction', reaction); setFloatingReaction({ reaction, sender: 'You' }); setTimeout(() => setFloatingReaction(null), 3000); setShowReactions(false); }
    let toggleRaiseHand = () => {
        if (raisedHands[socketIdRef.current]) { socketRef.current.emit('lower-hand'); setRaisedHands(prev => { const u = {...prev}; delete u[socketIdRef.current]; return u; }); }
        else { socketRef.current.emit('raise-hand'); setRaisedHands(prev => ({ ...prev, [socketIdRef.current]: usernameRef.current || 'Me' })); }
    }
    let copyMeetingLink = () => { navigator.clipboard.writeText(meetingUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }

    let joinCall = () => {
        if(!username.trim()) return;
        if (isGuest && meetCode.trim() && !window.location.search.includes('guestname')) {
            window.location.href = `/${meetCode.trim()}?guestname=${encodeURIComponent(username.trim())}`;
            return;
        }
        setInCall(true);
    }

    let videoCount = videos.length;
    let gridClass = videoCount === 0 ? styles['single-video'] : videoCount <= 3 ? styles['few-videos'] : styles['many-videos'];

    // PRE-JOIN SCREEN
    if (!inCall) {
        return (
            <div className="lobby-container">
                <div className="lobby-card">
                    <h2 className="lobby-title">{isGuest ? 'Join a Meeting' : 'Ready to Join?'}</h2>
                    <p className="lobby-subtitle">{isGuest ? 'Enter your name and meeting code' : 'Set up your name, audio and video'}</p>
                    <TextField className="lobby-input" label="Your Name" value={username} onChange={e => setUsername(e.target.value)} variant="outlined" fullWidth sx={{mb:2}} />
                    {(isGuest || meetCode) && (
                        <TextField className="lobby-input" label="Meeting Code" value={meetCode} onChange={e => setMeetCode(e.target.value)} variant="outlined" fullWidth sx={{mb:2}} placeholder="Enter code" disabled={!isGuest && !!meetCode} />
                    )}
                    <div className="lobby-options">
                        <div className={`lobby-option ${video?'active-camera':'off'}`} onClick={()=>setVideo(!video)}>{video?<VideocamIcon fontSize="small"/>:<VideocamOffIcon fontSize="small"/>} {video?'Video On':'Video Off'}</div>
                        <div className={`lobby-option ${audio?'active-mic':'off'}`} onClick={()=>setAudio(!audio)}>{audio?<MicIcon fontSize="small"/>:<MicOffIcon fontSize="small"/>} {audio?'Audio On':'Audio Off'}</div>
                    </div>
                    <Button variant="contained" onClick={joinCall} className="lobby-connect-btn">{isGuest ? 'Join Meeting' : 'Join Now'}</Button>
                    <div className="lobby-preview">
                        {video ? <video ref={localVideoref} autoPlay muted playsInline></video> : <div style={{width:'100%',height:'200px',background:'#1a1a2e',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center'}}><PersonIcon sx={{fontSize:60,color:'#64748b'}}/></div>}
                    </div>
                </div>
            </div>
        );
    }

    // IN CALL
    return (
        <div className={styles.meetVideoContainer}>
            {floatingReaction && <div style={{position:'fixed',bottom:'120px',left:'50%',transform:'translateX(-50%)',background:'rgba(0,0,0,0.8)',color:'white',padding:'8px 16px',borderRadius:'20px',fontSize:'14px',zIndex:40}}>{floatingReaction.sender}: {floatingReaction.reaction}</div>}
            <div className={styles['meet-top-bar']}>
                <button className={styles['meet-top-btn']} onClick={() => setShowParticipants(!showParticipants)}><PeopleIcon sx={{fontSize:16}}/> {participants.length}</button>
                <button className={styles['meet-top-btn']} onClick={() => setShowShareModal(true)}><InfoIcon sx={{fontSize:16}}/> Info</button>
            </div>
            {showShareModal && (
                <div className={styles['share-modal-overlay']} onClick={()=>setShowShareModal(false)}>
                    <div className={styles['share-modal']} onClick={e=>e.stopPropagation()}><h3>Meeting Details</h3><p>Share this link</p><div className={styles['share-link-box']}><input type="text" value={meetingUrl} readOnly /><button className={styles['share-copy-btn']} onClick={copyMeetingLink}>{copied?'Copied!':'Copy'}</button></div><button className={styles['share-close-btn']} onClick={()=>setShowShareModal(false)}>Close</button></div>
                </div>
            )}
            {showParticipants && (
                <div className={styles['participants-panel']}>
                    <div className={styles['participants-header']}><h3>Participants ({participants.length})</h3><button className={styles['participants-close']} onClick={()=>setShowParticipants(false)}><CloseIcon sx={{fontSize:18}}/></button></div>
                    <div className={styles['participants-list']}>{participants.map((p, i) => (<div key={i} className={styles['participant-item']}><span className={styles['participant-dot']}></span>{p.name} {p.host ? '(Host)' : ''} {raisedHands[p.id] ? '✋' : ''}</div>))}</div>
                </div>
            )}
            {showChat && (
                <div className={styles.chatRoom}>
                    <div className={styles.chatContainer}>
                        <div className={styles['chat-header']}><h1>Chat</h1><button className={styles['chat-close']} onClick={() => { setShowChat(false); setNewMessages(0); }}><CloseIcon sx={{ fontSize: 20 }} /></button></div>
                        <div className={styles.chattingDisplay} ref={chatDisplayRef}>{messages.length > 0 ? messages.map((item, index) => (<div key={index} className={`${styles['chat-msg']} ${item.me ? styles.me : ''}`}><span className={styles['chat-msg-sender']}>{item.sender}</span><span className={styles['chat-msg-text']}>{item.data}</span></div>)) : <span style={{ color: '#5f6368', textAlign: 'center', marginTop: 40 }}>No messages</span>}</div>
                        <div className={styles.chattingArea}><TextField value={message} onChange={e => setMessage(e.target.value)} placeholder="Send a message" variant="outlined" size="small" onKeyPress={e => e.key === 'Enter' && sendMessage()} /><Button variant='contained' onClick={sendMessage}>Send</Button></div>
                    </div>
                </div>
            )}
            <div className={`${styles.conferenceView} ${gridClass}`}>
                {videos.length === 0 && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '16px' }}>Waiting for others to join...</span>}
                {videos.map((video, i) => (<video key={i} ref={ref => {if(ref && video.stream) ref.srcObject = video.stream;}} autoPlay playsInline></video>))}
            </div>
            {video ? <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted playsInline></video> : <div className={styles.meetUserVideo} style={{display:'flex',alignItems:'center',justifyContent:'center',background:'#3c4043'}}><PersonIcon sx={{fontSize:60,color:'#9ca3af'}}/></div>}
            <div className={styles.buttonContainers}>
                <IconButton onClick={()=>setVideo(!video)}>{video?<VideocamIcon/>:<VideocamOffIcon/>}</IconButton>
                <IconButton onClick={()=>setAudio(!audio)}>{audio?<MicIcon/>:<MicOffIcon/>}</IconButton>
                {screenAvailable && <IconButton onClick={() => { if (!screen) { navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }).then(stream => { if (localVideoref.current) localVideoref.current.srcObject = stream; window.localStream = stream; setScreen(true); }).catch(e => console.log(e)); } else { getUserMedia(); setScreen(false); } }}>{screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}</IconButton>}
                <IconButton onClick={()=>{setShowChat(!showChat);setNewMessages(0);}}><Badge badgeContent={newMessages} color="error"><ChatIcon/></Badge></IconButton>
                <div style={{position:'relative'}}><IconButton onClick={()=>setShowReactions(!showReactions)}><EmojiEmotionsIcon/></IconButton>{showReactions && <div style={{position:'absolute',bottom:'60px',left:'50%',transform:'translateX(-50%)',background:'white',borderRadius:'12px',padding:'8px',display:'flex',gap:'4px',boxShadow:'0 4px 20px rgba(0,0,0,0.3)',zIndex:50}}>{REACTIONS.map((r,i)=>(<button key={i} onClick={()=>sendReaction(r)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'22px',padding:'6px'}}>{r}</button>))}</div>}</div>
                <IconButton onClick={toggleRaiseHand} style={{color: raisedHands[socketIdRef.current] ? '#fbbf24' : 'white'}}><PanToolIcon/></IconButton>
                <IconButton onClick={handleEndCall} className="end-call-btn" style={{color:'white'}}><CallEndIcon/></IconButton>
            </div>
        </div>
    );
}