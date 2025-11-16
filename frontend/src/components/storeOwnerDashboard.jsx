import React, { useState, useEffect } from 'react';
const StoreOwnerDashboard = ({ user, token, onLogout }) => {
    const [dashboard, setDashboard] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const data = await apiCall('/store/dashboard', 'GET', null, token);
            setDashboard(data);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="dashboard">
            <nav className="navbar">
                <h1>Store Owner Dashboard</h1>
                <div className="nav-actions">
                    <span>Welcome, {user.name}</span>
                    <button onClick={() => setShowPasswordModal(true)}>Change Password</button>
                    <button onClick={onLogout}>Logout</button>
                </div>
            </nav>

            <div className="content full-width">
                {dashboard && (
                    <>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <h3>Average Rating</h3>
                                <p className="stat-number">{parseFloat(dashboard.averageRating).toFixed(2)} ⭐</p>
                            </div>
                        </div>

                        <h2>Ratings Received</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>User Name</th>
                                    <th>Email</th>
                                    <th>Rating</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dashboard.ratedBy.map(rating => (
                                    <tr key={rating.id}>
                                        <td>{rating.name}</td>
                                        <td>{rating.email}</td>
                                        <td>{rating.rating} ⭐</td>
                                        <td>{new Date(rating.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </div>

            {showPasswordModal && <ChangePassword token={token} onClose={() => setShowPasswordModal(false)} />}
        </div>
    );
};
export default StoreOwnerDashboard;