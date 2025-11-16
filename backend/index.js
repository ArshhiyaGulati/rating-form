// Load environment variables FIRST
require('dotenv').config({ path: './.env' });

console.log('🚀 Starting server...');
console.log('Environment check:', {
    PORT: process.env.PORT,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER
});

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

console.log('📝 Creating database pool...');

// Database connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'store_rating',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

console.log('🔌 Testing database connection...');

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Error connecting to database:', err.stack);
        process.exit(1);
    } else {
        console.log('✅ Database connected successfully');
        release();
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// ==================== VALIDATION FUNCTIONS ====================
const validateName = (name) => {
    return name && name.length >= 20 && name.length <= 60;
};

const validateAddress = (address) => {
    return address && address.length <= 400;
};

const validatePassword = (password) => {
    const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,16}$/;
    return regex.test(password);
};

const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

// ==================== MIDDLEWARE ====================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        next();
    };
};

// ==================== AUTH ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// User signup
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, address, password } = req.body;

        // Validation
        if (!validateName(name)) {
            return res.status(400).json({ error: 'Name must be between 20 and 60 characters' });
        }
        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        if (!validateAddress(address)) {
            return res.status(400).json({ error: 'Address must not exceed 400 characters' });
        }
        if (!validatePassword(password)) {
            return res.status(400).json({ error: 'Password must be 8-16 characters with at least one uppercase letter and one special character' });
        }

        // Check if user exists
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert user
        const result = await pool.query(
            'INSERT INTO users (name, email, password_hash, address, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, address, role',
            [name, email, passwordHash, address, 'user']
        );

        res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Check password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                address: user.address,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update password
app.put('/api/auth/password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!validatePassword(newPassword)) {
            return res.status(400).json({ error: 'Password must be 8-16 characters with at least one uppercase letter and one special character' });
        }

        // Get user
        const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
        const user = result.rows[0];

        // Verify current password
        const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Update password
        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, req.user.id]);

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password update error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== ADMIN ROUTES ====================

// Admin dashboard stats
app.get('/api/admin/dashboard', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const usersCount = await pool.query('SELECT COUNT(*) FROM users');
        const storesCount = await pool.query('SELECT COUNT(*) FROM stores');
        const ratingsCount = await pool.query('SELECT COUNT(*) FROM ratings');

        res.json({
            totalUsers: parseInt(usersCount.rows[0].count),
            totalStores: parseInt(storesCount.rows[0].count),
            totalRatings: parseInt(ratingsCount.rows[0].count)
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Add user
app.post('/api/admin/users', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const { name, email, address, password, role } = req.body;

        // Validation
        if (!validateName(name)) {
            return res.status(400).json({ error: 'Name must be between 20 and 60 characters' });
        }
        if (!validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        if (!validateAddress(address)) {
            return res.status(400).json({ error: 'Address must not exceed 400 characters' });
        }
        if (!validatePassword(password)) {
            return res.status(400).json({ error: 'Password must be 8-16 characters with at least one uppercase letter and one special character' });
        }
        if (!['admin', 'user', 'store_owner'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Check if user exists
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Start transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Insert user
            const userResult = await client.query(
                'INSERT INTO users (name, email, password_hash, address, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, address, role',
                [name, email, passwordHash, address, role]
            );

            // If store owner, create store entry
            if (role === 'store_owner') {
                await client.query(
                    'INSERT INTO stores (user_id) VALUES ($1)',
                    [userResult.rows[0].id]
                );
            }

            await client.query('COMMIT');
            res.status(201).json({ message: 'User created successfully', user: userResult.rows[0] });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Add user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Get all stores
app.get('/api/admin/stores', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const { name, email, address, sortBy = 'name', sortOrder = 'asc' } = req.query;

        let query = `
            SELECT 
                u.id,
                u.name,
                u.email,
                u.address,
                COALESCE(AVG(r.rating), 0) as average_rating
            FROM stores s
            INNER JOIN users u ON s.user_id = u.id
            LEFT JOIN ratings r ON s.id = r.store_id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (name) {
            query += ` AND u.name ILIKE $${paramCount}`;
            params.push(`%${name}%`);
            paramCount++;
        }
        if (email) {
            query += ` AND u.email ILIKE $${paramCount}`;
            params.push(`%${email}%`);
            paramCount++;
        }
        if (address) {
            query += ` AND u.address ILIKE $${paramCount}`;
            params.push(`%${address}%`);
            paramCount++;
        }

        query += ` GROUP BY u.id, u.name, u.email, u.address`;
        query += ` ORDER BY ${sortBy === 'rating' ? 'average_rating' : `u.${sortBy}`} ${sortOrder.toUpperCase()}`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Get stores error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Admin: Get all users
app.get('/api/admin/users', authenticateToken, authorize('admin'), async (req, res) => {
    try {
        const { name, email, address, role, sortBy = 'name', sortOrder = 'asc' } = req.query;

        let query = 'SELECT id, name, email, address, role FROM users WHERE 1=1';
        const params = [];
        let paramCount = 1;

        if (name) {
            query += ` AND name ILIKE $${paramCount}`;
            params.push(`%${name}%`);
            paramCount++;
        }
        if (email) {
            query += ` AND email ILIKE $${paramCount}`;
            params.push(`%${email}%`);
            paramCount++;
        }
        if (address) {
            query += ` AND address ILIKE $${paramCount}`;
            params.push(`%${address}%`);
            paramCount++;
        }
        if (role) {
            query += ` AND role = $${paramCount}`;
            params.push(role);
            paramCount++;
        }

        query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== USER ROUTES ====================

// Get all stores (for normal users)
app.get('/api/stores', authenticateToken, async (req, res) => {
    try {
        const { name, address, sortBy = 'name', sortOrder = 'asc' } = req.query;

        let query = `
            SELECT 
                s.id,
                u.name,
                u.address,
                COALESCE(AVG(r.rating), 0) as average_rating,
                ur.rating as user_rating
            FROM stores s
            INNER JOIN users u ON s.user_id = u.id
            LEFT JOIN ratings r ON s.id = r.store_id
            LEFT JOIN ratings ur ON s.id = ur.store_id AND ur.user_id = $1
            WHERE 1=1
        `;
        const params = [req.user.id];
        let paramCount = 2;

        if (name) {
            query += ` AND u.name ILIKE $${paramCount}`;
            params.push(`%${name}%`);
            paramCount++;
        }
        if (address) {
            query += ` AND u.address ILIKE $${paramCount}`;
            params.push(`%${address}%`);
            paramCount++;
        }

        query += ` GROUP BY s.id, u.name, u.address, ur.rating`;
        query += ` ORDER BY ${sortBy === 'rating' ? 'average_rating' : `u.${sortBy}`} ${sortOrder.toUpperCase()}`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Get stores error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Submit or update rating
app.post('/api/ratings', authenticateToken, authorize('user'), async (req, res) => {
    try {
        const { storeId, rating } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        // Check if store exists
        const storeResult = await pool.query('SELECT id FROM stores WHERE id = $1', [storeId]);
        if (storeResult.rows.length === 0) {
            return res.status(404).json({ error: 'Store not found' });
        }

        // Insert or update rating
        const result = await pool.query(
            `INSERT INTO ratings (user_id, store_id, rating) 
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, store_id) 
             DO UPDATE SET rating = $3, updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [req.user.id, storeId, rating]
        );

        res.json({ message: 'Rating submitted successfully', rating: result.rows[0] });
    } catch (error) {
        console.error('Submit rating error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== STORE OWNER ROUTES ====================

// Store owner dashboard
app.get('/api/store/dashboard', authenticateToken, authorize('store_owner'), async (req, res) => {
    try {
        // Get store ID
        const storeResult = await pool.query('SELECT id FROM stores WHERE user_id = $1', [req.user.id]);
        if (storeResult.rows.length === 0) {
            return res.status(404).json({ error: 'Store not found' });
        }

        const storeId = storeResult.rows[0].id;

        // Get average rating
        const ratingResult = await pool.query(
            'SELECT COALESCE(AVG(rating), 0) as average_rating FROM ratings WHERE store_id = $1',
            [storeId]
        );

        // Get users who rated
        const usersResult = await pool.query(
            `SELECT u.id, u.name, u.email, r.rating, r.created_at
             FROM ratings r
             INNER JOIN users u ON r.user_id = u.id
             WHERE r.store_id = $1
             ORDER BY r.created_at DESC`,
            [storeId]
        );

        res.json({
            averageRating: parseFloat(ratingResult.rows[0].average_rating),
            ratedBy: usersResult.rows
        });
    } catch (error) {
        console.error('Store dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📊 API available at http://localhost:${PORT}/api`);
});