// src/components/userDashboard.jsx
import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const UserDashboard = ({ user, token, onLogout }) => {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchName, setSearchName] = useState('');
    const [searchAddress, setSearchAddress] = useState('');
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [selectedStore, setSelectedStore] = useState(null);

    useEffect(() => {
        loadStores();
    }, [searchName, searchAddress]);

    const loadStores = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchName) params.append('name', searchName);
            if (searchAddress) params.append('address', searchAddress);

            const response = await fetch(`${API_URL}/stores?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch stores');
            }
            
            const data = await response.json();
            console.log('Stores loaded:', data); // Debug
            setStores(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const submitRating = async (storeId, rating) => {
        try {
            const response = await fetch(`${API_URL}/ratings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ storeId, rating }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to submit rating');
            }
            
            alert('Rating submitted successfully!');
            setShowRatingModal(false);
            loadStores();
        } catch (err) {
            alert(err.message);
        }
    };

    const openRatingModal = (store) => {
        setSelectedStore(store);
        setShowRatingModal(true);
    };

    return (
        <div className="dashboard">
            <nav className="navbar">
                <h1>Store Rating Platform</h1>
                <div className="nav-actions">
                    <span>Welcome, {user.name}</span>
                    <button onClick={onLogout}>Logout</button>
                </div>
            </nav>

            <div className="content">
                <h2>All Stores</h2>
                
                {error && <div className="error">{error}</div>}
                
                <div className="filters">
                    <input
                        type="text"
                        placeholder="Search by name"
                        value={searchName}
                        onChange={(e) => setSearchName(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Search by address"
                        value={searchAddress}
                        onChange={(e) => setSearchAddress(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="loading">Loading...</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Store Name</th>
                                <th>Address</th>
                                <th>Overall Rating</th>
                                <th>Your Rating</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stores.length > 0 ? (
                                stores.map(store => (
                                    <tr key={store.id}>
                                        <td>{store.name}</td>
                                        <td>{store.address}</td>
                                        <td>{parseFloat(store.average_rating || 0).toFixed(2)} ⭐</td>
                                        <td>{store.user_rating ? `${store.user_rating} ⭐` : 'Not rated'}</td>
                                        <td>
                                            <button onClick={() => openRatingModal(store)}>
                                                {store.user_rating ? 'Update Rating' : 'Rate Store'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" style={{textAlign: 'center', padding: '40px'}}>
                                        No stores found. Ask admin to add store owners!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showRatingModal && selectedStore && (
                <RatingModal 
                    store={selectedStore} 
                    onSubmit={(rating) => submitRating(selectedStore.id, rating)}
                    onClose={() => setShowRatingModal(false)} 
                />
            )}
        </div>
    );
};

// Rating Modal Component
const RatingModal = ({ store, onSubmit, onClose }) => {
    const [rating, setRating] = useState(store.user_rating || 0);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }
        onSubmit(rating);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <h3>Rate {store.name}</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Rating (1-5)</label>
                        <div className="star-rating">
                            {[1, 2, 3, 4, 5].map(star => (
                                <span
                                    key={star}
                                    className={star <= rating ? 'star active' : 'star'}
                                    onClick={() => setRating(star)}
                                >
                                    ⭐
                                </span>
                            ))}
                        </div>
                        <p style={{marginTop: '10px'}}>Selected: {rating} stars</p>
                    </div>
                    <div className="button-group">
                        <button type="submit">Submit Rating</button>
                        <button type="button" onClick={onClose} className="secondary">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserDashboard;