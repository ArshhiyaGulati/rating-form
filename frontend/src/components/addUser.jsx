import React, { useState } from 'react';
const AddUserModal = ({ token, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        address: '',
        password: '',
        role: 'user'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await apiCall('/admin/users', 'POST', formData, token);
            setSuccess('User added successfully');
            setTimeout(onClose, 2000);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <h3>Add New User</h3>
                <form onSubmit={handleSubmit}>
                    {error && <div className="error">{error}</div>}
                    {success && <div className="success">{success}</div>}
                    <div className="form-group">
                        <label>Name (20-60 characters)</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            minLength="20"
                            maxLength="60"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Address (max 400 characters)</label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            maxLength="400"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            minLength="8"
                            maxLength="16"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Role</label>
                        <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="store_owner">Store Owner</option>
                        </select>
                    </div>
                    <div className="button-group">
                        <button type="submit">Add User</button>
                        <button type="button" onClick={onClose} className="secondary">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default AddUserModal;