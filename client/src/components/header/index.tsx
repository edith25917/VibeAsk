import React from 'react'
import './index.css'

const Header: React.FC = () => {
    return (
        <header className="header">
            <div className="header-content">
                <div className="logo">
                    <span className="logo-icon">🤖</span>
                    <h1>Vibe Ask</h1>
                </div>
                <div className="header-info">
                    <span className="status-indicator">
                        <span className="status-dot"></span>
                        Online
                    </span>
                </div>
            </div>
        </header>
    )
}

export default Header
