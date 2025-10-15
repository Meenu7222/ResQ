const express = require('express');
const pool = require('../db');
const router = express.Router();

// Fetch all pending requests
router.get('/pending', async (req, res) => {
    const [rows] = await pool.query('SELECT id, username, role, phone, institute_id FROM pending_requests');
    res.json(rows);
});

// Approve request: move to usertable, remove from pending_requests
router.post('/approve/:id', async (req, res) => {
    const id = req.params.id;
    const [[pending]] = await pool.query('SELECT * FROM pending_requests WHERE id=?', [id]);
    if (!pending) return res.status(404).json({ error: 'Request not found' });
    await pool.query(
        'INSERT INTO usertable (institute_id, username, hashed_password, role) VALUES (?, ?, ?, ?)',
        [pending.institute_id, pending.username, pending.hashed_password, pending.role]
    );
    await pool.query('DELETE FROM pending_requests WHERE id=?', [id]);
    res.json({ message: 'Approved' });
});

// Disapprove: remove from pending_requests
router.post('/disapprove/:id', async (req, res) => {
    await pool.query('DELETE FROM pending_requests WHERE id=?', [req.params.id]);
    res.json({ message: 'Disapproved' });
});

module.exports = router;
