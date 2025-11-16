import React, { useState, useEffect } from 'react';
const AdminDashboard = ({ user, token, onLogout }) => {
    const [view, setView] = useState('dashboard');
    const [stats, setStats] = useState(null);
    const [stores, setStores] = useState([]);
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({});
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showAddUserModal, setShowAddUserModal] = useState(false);

    useEffect(() => {
        if (view === 'dashboard') {
            loadDashboardStats();
        } else if (view === 'stores') {
            loadStores();
        } else if (view === 'users') {
            loadUsers();
        }
    }, [view, filters, sortBy, sortOrder]);

    const loadDashboardStats = async () => {
        try {
            const data = await apiCall('/admin/dashboard', 'GET', null, token);
            setStats(data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadStores = async () => {
        try {
            const params = new URLSearchParams({ ...filters, sortBy, sortOrder });
            const data = await apiCall(`/admin/stores?${params}`, 'GET', null, token);
            setStores(data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadUsers = async () => {
        try {
            const params = new URLSearchParams({ ...filters, sortBy, sortOrder });
            const data = await apiCall(`/admin/users?${params}`, 'GET', null, token);
            setUsers(data);
        } catch (err) {
            console.error(err);
        }
    };

    const toggleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    return (
        <div className="dashboard">
            <nav className="navbar">
                <h1>Admin Dashboard</h1>
                <div className="nav-actions">
                    <span>Welcome, {user.name}</span>
                    <button onClick={() => setShowPasswordModal(true)}>Change Password</button>
                    <button onClick={onLogout}>Logout</button>
                </div>
            </nav>

            <div className="sidebar">
                <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? 'active' : ''}>
                    Dashboard
                </button>
                <button onClick={() => setView('stores')} className={view === 'stores' ? 'active' : ''}>
                    Stores
                </button>
                <button onClick={() => setView('users')} className={view === 'users' ? 'active' : ''}>
                    Users
                </button>
            </div>

            <div className="content">
                {view === 'dashboard' && stats && (
                    <div className="stats-grid">
                        <div className="stat-card">
                            <h3>Total Users</h3>
                            <p className="stat-number">{stats.totalUsers}</p>
                        </div>
                        <div className="stat-card">
                            <h3>Total Stores</h3>
                            <p className="stat-number">{stats.totalStores}</p>
                        </div>
                        <div className="stat-card">
                            <h3>Total Ratings</h3>
                            <p className="stat-number">{stats.totalRatings}</p>
                        </div>
                    </div>
                )}

                {view === 'stores' && (
                    <div>
                        <div className="content-header">
                            <h2>Stores</h2>
                        </div>
                        <div className="filters">
                            <input
                                type="text"
                                placeholder="Filter by name"
                                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Filter by email"
                                onChange={(e) => setFilters({ ...filters, email: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Filter by address"
                                onChange={(e) => setFilters({ ...filters, address: e.target.value })}
                            />
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th onClick={() => toggleSort('name')}>Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                    <th onClick={() => toggleSort('email')}>Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                    <th onClick={() => toggleSort('address')}>Address {sortBy === 'address' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                    <th onClick={() => toggleSort('rating')}>Rating {sortBy === 'rating' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stores.map(store => (
                                    <tr key={store.id}>
                                        <td>{store.name}</td>
                                        <td>{store.email}</td>
                                        <td>{store.address}</td>
                                        <td>{parseFloat(store.average_rating).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {view === 'users' && (
                    <div>
                        <div className="content-header">
                            <h2>Users</h2>
                            <button onClick={() => setShowAddUserModal(true)}>Add User</button>
                        </div>
                        <div className="filters">
                            <input
                                type="text"
                                placeholder="Filter by name"
                                onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Filter by email"
                                onChange={(e) => setFilters({ ...filters, email: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="Filter by address"
                                onChange={(e) => setFilters({ ...filters, address: e.target.value })}
                            />
                            <select onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
                                <option value="">All Roles</option>
                                <option value="admin">Admin</option>
                                <option value="user">User</option>
                                <option value="store_owner">Store Owner</option>
                            </select>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th onClick={() => toggleSort('name')}>Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                    <th onClick={() => toggleSort('email')}>Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                    <th onClick={() => toggleSort('address')}>Address {sortBy === 'address' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                    <th onClick={() => toggleSort('role')}>Role {sortBy === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>{user.address}</td>
                                        <td>{user.role}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showPasswordModal && <ChangePassword token={token} onClose={() => setShowPasswordModal(false)} />}
            {showAddUserModal && <AddUserModal token={token} onClose={() => { setShowAddUserModal(false); loadUsers(); }} />}
        </div>
    );
};
export default AdminDashboard;