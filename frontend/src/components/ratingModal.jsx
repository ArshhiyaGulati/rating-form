import React, { useState } from 'react';
const RatingModal = ({ store, token, onClose }) => {
    const [rating, setRating] = useState(store.user_rating || 0);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await apiCall('/ratings', 'POST', { storeId: store.id, rating }, token);
            alert('Rating submitted successfully!');
            onClose();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <h3>Rate {store.name}</h3>
                <form onSubmit={handleSubmit}>
                    {error && <div className="error">{error}</div>}
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
                        <p>Selected: {rating} stars</p>
                    </div>
                    <div className="button-group">
                        <button type="submit" disabled={rating === 0}>Submit Rating</button>
                        <button type="button" onClick={onClose} className="secondary">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default RatingModal;