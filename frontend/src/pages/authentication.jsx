import React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import './auth.css';

export default function Authentication() {

    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [name, setName] = React.useState('');
    const [error, setError] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [formState, setFormState] = React.useState(0);
    const [open, setOpen] = React.useState(false);

    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    let handleAuth = async () => {
        setError('');
        
        if (formState === 1) {
            if (!name || !name.trim()) { setError('Please enter your full name'); return; }
            if (!username || !username.trim()) { setError('Please enter a username'); return; }
            if (username.trim().length < 3) { setError('Username must be at least 3 characters'); return; }
            if (!password || !password.trim()) { setError('Please enter a password'); return; }
            if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        }
        
        if (formState === 0) {
            if (!username || !username.trim()) { setError('Please enter your username'); return; }
            if (!password || !password.trim()) { setError('Please enter your password'); return; }
        }

        try {
            if (formState === 0) {
                await handleLogin(username, password);
            }
            if (formState === 1) {
                let result = await handleRegister(name, username, password);
                setUsername('');
                setMessage(result || 'Account created! Please sign in.');
                setOpen(true);
                setError('');
                setFormState(0);
                setPassword('');
                setName('');
            }
        } catch (err) {
            let message = err.response?.data?.message || 'Something went wrong';
            setError(message);
        }
    };

    return (
        <div className="auth-page">
            
            {/* Top Bar */}
            <div className="auth-top-bar">
                <div className="auth-logo-area">
                    <img src="/logoX.png" alt="CollabX" className="auth-logo-img" />
                    <span className="auth-logo-text">
                        <span className="teal">Collab</span><span className="blue">X</span>
                    </span>
                </div>
                <a href="/" className="auth-back-link">
                    <ArrowBackIcon sx={{ fontSize: 16 }} />
                    Back to Home
                </a>
            </div>

            {/* Card */}
            <div className="auth-card">
                
                {/* Lock Icon */}
                <div className="auth-lock-icon">
                    <LockOutlinedIcon />
                </div>

                <h2 className="auth-heading">
                    {formState === 0 ? 'Welcome back' : 'Create your account'}
                </h2>
                <p className="auth-subheading">
                    {formState === 0 ? 'Sign in to continue' : 'Join CollabX today'}
                </p>

                {/* Toggle */}
                <div className="auth-toggle-row">
                    <button 
                        className={`auth-toggle-btn ${formState === 0 ? 'active' : ''}`}
                        onClick={() => setFormState(0)}
                    >
                        Sign In
                    </button>
                    <button 
                        className={`auth-toggle-btn ${formState === 1 ? 'active' : ''}`}
                        onClick={() => setFormState(1)}
                    >
                        Sign Up
                    </button>
                </div>

                {/* Form */}
                <Box component="form" noValidate sx={{ textAlign: 'left' }}>
                    {formState === 1 && (
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                            className="auth-input"
                        />
                    )}

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoFocus={formState === 0}
                        className="auth-input"
                    />
                    
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="auth-input"
                    />

                    {error && <p className="auth-error-text">{error}</p>}

                    <Button
                        type="button"
                        fullWidth
                        variant="contained"
                        className="auth-submit-btn"
                        onClick={handleAuth}
                    >
                        {formState === 0 ? 'Sign In' : 'Create Account'}
                    </Button>

                    <p className="auth-switch-row">
                        {formState === 0 ? "Don't have an account? " : "Already have an account? "}
                        <span 
                            className="auth-switch-link"
                            onClick={() => setFormState(formState === 0 ? 1 : 0)}
                        >
                            {formState === 0 ? 'Sign Up' : 'Sign In'}
                        </span>
                    </p>
                </Box>
            </div>

            <Snackbar
                open={open}
                autoHideDuration={4000}
                onClose={() => setOpen(false)}
                message={message}
            />
        </div>
    );
}