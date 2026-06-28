import React from 'react'
import { useNavigate } from 'react-router-dom'
import "./landing.css"

export default function LandingPage() {

    const router = useNavigate();

    return (
        <div className='landingPageContainer'>
            <nav>
                <div className='navHeader'>
                    <img src="/logoX.png" alt="CollabX" />
                    <h2>
                        <span className="teal">Collab</span><span className="blue">X</span>
                    </h2>
                </div>
                <div className='navlist'>
                    <p onClick={() => router("/auth")}>Sign In</p>
                    <div onClick={() => router("/auth")} role='button'>
                        <p>Sign Up</p>
                    </div>
                </div>
            </nav>

            <div className="landingMainContainer">
                <div>
                    <h1>
                        <span className="highlight-teal">Collaborate</span><br />
                        Without <span className="highlight-blue">Limits</span>
                    </h1>
                    <p>
                        HD video calls, screen sharing, and real-time chat — 
                        all in one place. Connect with your team from anywhere in the world.
                    </p>
                    <div className="cta-buttons">
                        <button onClick={() => router("/auth")} className="cta-primary">Get Started Free</button>
                        <button onClick={() => router("/guest-join")} className="cta-secondary">Join as Guest</button>
                    </div>
                </div>
                <div>
                    <img src="/mobile.png" alt="CollabX Video Call" />
                </div>
            </div>

            <div className="feature-strip">
                <div className="feature-item">
                    <span className="feature-dot"></span>
                    HD Video Calls
                </div>
                <div className="feature-item">
                    <span className="feature-dot"></span>
                    Screen Sharing
                </div>
                <div className="feature-item">
                    <span className="feature-dot"></span>
                    Real-time Chat
                </div>
                <div className="feature-item">
                    <span className="feature-dot"></span>
                    No Time Limit
                </div>
            </div>
        </div>
    )
}