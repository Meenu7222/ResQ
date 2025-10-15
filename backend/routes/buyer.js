const express = require('express');
const pool = require('../db');
const router = express.Router();

// List eligible food items (with search)
router.get('/foods', async (req, res) => {
  const { search } = req.query;
  const keyword = search ? `%${search}%` : `%`;
  const [rows] = await pool.query(
    `SELECT food.*, usertable.username AS seller_name
     FROM food
     JOIN usertable ON food.seller_id = usertable.institute_id AND usertable.role='seller'
     WHERE food.quantity > 0 AND food.expiry_time > NOW() AND food.food_name LIKE ?`,
     [keyword]
  );
  res.json(rows);
});

// Add item to cart
router.post('/cart/add', async (req, res) => {
  const { buyer_id, seller_id, food_id, food_name, quantity, unit_price } = req.body;
  // Merge with existing cart entry if any
  const [existing] = await pool.query(
    'SELECT id, quantity FROM cart WHERE buyer_id=? AND food_id=?',
    [buyer_id, food_id]
  );
  if (existing.length) {
    const newQty = existing[0].quantity + quantity;
    await pool.query(
      'UPDATE cart SET quantity=?, total_price=? WHERE id=?',
      [newQty, newQty * unit_price, existing[0].id]
    );
    return res.json({ message: 'Cart quantity updated' });
  }
  await pool.query(
    'INSERT INTO cart (buyer_id, seller_id, food_id, food_name, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [buyer_id, seller_id, food_id, food_name, quantity, unit_price, quantity * unit_price]
  );
  res.json({ message: 'Added to cart' });
});

// Get cart items for buyer
router.get('/cart/:buyer_id', async (req, res) => {
  const buyer_id = req.params.buyer_id;
  const [rows] = await pool.query(
    'SELECT * FROM cart WHERE buyer_id=?',
    [buyer_id]
  );
  res.json(rows);
});

// Update quantity or remove from cart
router.post('/cart/update', async (req, res) => {
  const { cart_id, quantity, unit_price } = req.body;
  if (quantity > 0) {
    await pool.query(
      'UPDATE cart SET quantity=?, total_price=? WHERE id=?',
      [quantity, quantity * unit_price, cart_id]
    );
  } else {
    await pool.query('DELETE FROM cart WHERE id=?', [cart_id]);
  }
  res.json({ message: 'Cart updated' });
});

// Checkout and place order
router.post('/cart/checkout', async (req, res) => {
  const { buyer_id, delivery, delivery_address } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [cartItems] = await connection.query('SELECT * FROM cart WHERE buyer_id=?', [buyer_id]);
    let total = delivery === 'partner' ? 30 : 0;
    for (const item of cartItems) {
      const [foods] = await connection.query('SELECT quantity, expiry_time FROM food WHERE id=?', [item.food_id]);
      if (!foods.length || foods[0].quantity < item.quantity || new Date(foods[0].expiry_time) < new Date()) {
        await connection.rollback();
        return res.status(400).json({ error: `Item ${item.food_name} unavailable or expired` });
      }
      await connection.query('UPDATE food SET quantity=quantity-? WHERE id=?', [item.quantity, item.food_id]);
      await connection.query(
        'INSERT INTO orders (buyer_id, seller_id, food_id, food_name, quantity, unit_price, total_price, delivery_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [item.buyer_id, item.seller_id, item.food_id, item.food_name, item.quantity, item.unit_price, item.total_price, delivery_address]
      );
      total += item.total_price;
    }
    await connection.query('DELETE FROM cart WHERE buyer_id=?', [buyer_id]);
    await connection.commit();
    res.json({ message: 'Order placed', total });
  } catch (e) {
    await connection.rollback();
    res.status(500).json({ error: 'Checkout error' });
  } finally {
    connection.release();
  }
});

module.exports = router;
