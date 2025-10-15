const express = require('express');
const pool = require('../db');
const router = express.Router();

// Get seller profile
router.get('/profile', async (req, res) => {
    const { username } = req.query;
    const [rows] = await pool.query(
        'SELECT institute_id, username, role FROM usertable WHERE username=? AND role="seller"',
        [username]
    );
    if (!rows.length) return res.status(404).json({ error: 'Seller not found' });
    res.json(rows[0]);
});

// Get all food items listed by this seller by institute_id
router.get('/myFood/:institute_id', async (req, res) => {
    const { institute_id } = req.params;
    const [foodRows] = await pool.query(
        'SELECT * FROM food WHERE seller_id=? ORDER BY posted_at DESC',
        [institute_id]
    );
    res.json(foodRows);
});

// Add a new food item
router.post('/postFood', async (req, res) => {
    const { seller_id, institute_id, food_name, price, quantity, duration_minutes } = req.body;

    // Validate seller
    const [sellerRows] = await pool.query(
        'SELECT institute_id FROM usertable WHERE institute_id=? AND role="seller"',
        [seller_id]
    );
    if (!sellerRows.length) return res.status(401).json({ error: 'Seller not found or not approved' });

    try {
        await pool.query(
            `INSERT INTO food 
            (seller_id, institute_id, food_name, price, quantity, posted_at, duration_minutes, expiry_time)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? MINUTE))`,
            [seller_id, institute_id, food_name, price, quantity, duration_minutes, duration_minutes]
        );
        res.json({ message: 'Food item added!' });
    } catch(e) {
        res.status(500).json({ error: e.message || 'DB error' });
    }
});

// Delete a food item
router.delete('/items/:id', async (req, res) => {
    const itemId = req.params.id;
    try {
        await pool.query('DELETE FROM food WHERE id=?', [itemId]);
        res.json({ message: 'Food item deleted' });
    } catch(e) {
        res.status(500).json({ error: 'DB error' });
    }
});

module.exports = router;
