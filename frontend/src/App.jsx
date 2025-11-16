import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/login.jsx';
import Signup from './components/signup.jsx';
import AdminDashboard from './components/adminDashboard.jsx';
import UserDashboard from './components/userDashboard.jsx';
import StoreOwnerDashboard from './components/storeOwnerDashboard.jsx';

function App() {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [showSignup, setShowSignup] = useState(false);

    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const handleLogin = (userData, userToken) => {
        setUser(userData);
        setToken(userToken);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
    };

    if (!user) {
        return showSignup ? (
            <Signup onSignup={() => setShowSignup(false)} onBack={() => setShowSignup(false)} />
        ) : (
            <div>
                <Login onLogin={handleLogin} />
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button onClick={() => setShowSignup(true)} className="link-button">
                        Don't have an account? Sign up
                    </button>
                </div>
            </div>
        );
    }

    if (user.role === 'admin') {
        return <AdminDashboard user={user} token={token} onLogout={handleLogout} />;
    }

    if (user.role === 'user') {
        return <UserDashboard user={user} token={token} onLogout={handleLogout} />;
    }

    if (user.role === 'store_owner') {
        return <StoreOwnerDashboard user={user} token={token} onLogout={handleLogout} />;
    }

    return <div>Unknown user role</div>;
}

export default App;