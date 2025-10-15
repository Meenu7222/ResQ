const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const router = express.Router();

// Buyer/Seller Signup (adds to pending_requests)
router.post('/signup', async (req, res) => {
    const { username, password, role, phone, institute_id } = req.body;
    if (!['buyer', 'seller'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const hash = await bcrypt.hash(password, 10);
    try {
        // Check user existence in usertable
        const [users] = await pool.query('SELECT institute_id FROM usertable WHERE username=?', [username]);
        const [pending] = await pool.query('SELECT id FROM pending_requests WHERE username=?', [username]);
        if (users.length || pending.length) return res.status(400).json({ error: "Username exists" });
        await pool.query(
            'INSERT INTO pending_requests (username, hashed_password, role, phone, institute_id) VALUES (?, ?, ?, ?, ?)',
            [username, hash, role, phone, institute_id]
        );
        res.json({ message: 'Registration pending approval' });
    } catch(e) { res.status(500).json({error: e.message || 'DB error'});}
});

// Login for buyer/seller (must be approved user)
router.post('/login', async (req, res) => {
    const { username, password, role } = req.body;
    console.log("Received credentials:", { username, password, role }); // <-- add this

    const [rows] = await pool.query('SELECT * FROM usertable WHERE username=? AND role=?', [username, role]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials/role' });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.hashed_password);
    if (!match) return res.status(401).json({ error: 'Incorrect password' });
    // Return full info for React dashboard
    res.json({ message: 'Login success', user: {
        institute_id: user.institute_id,
        username: user.username,
        role: user.role
    }});
});

// Admin Login (must exist in usertable)
router.post('/admin-login', async (req, res) => {
    const { username, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM usertable WHERE username=? AND role="admin"', [username]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid admin credentials' });
    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.hashed_password);
    if (!match) return res.status(401).json({ error: 'Incorrect password' });
    res.json({ message: 'Admin login success', institute_id: admin.institute_id });
});

// Admin approves buyer/seller from pending_requests and moves to usertable
router.post('/approve', async (req, res) => {
    const { id } = req.body; // ID from pending_requests
    try {
        await pool.query(
            'INSERT INTO usertable (institute_id, username, hashed_password, role) SELECT institute_id, username, hashed_password, role FROM pending_requests WHERE id = ?',
            [id]
        );
        await pool.query('DELETE FROM pending_requests WHERE id = ?', [id]);
        res.json({ message: 'User approved and added!' });
    } catch(e) {
        res.status(500).json({error: 'DB error'});
    }
});

module.exports = router;
