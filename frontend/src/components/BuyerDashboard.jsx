import { useState, useEffect } from 'react';
import './BuyerDashboard.css';

export default function BuyerDashboard({ user, logout, goToCart }) {
  const [foods, setFoods] = useState([]);
  const [selectedQty, setSelectedQty] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      setLoading(true);
      setError('');
      const resp = await fetch('http://localhost:5000/api/buyer/foods');
      
      if (!resp.ok) {
        throw new Error(`Server error: ${resp.status}`);
      }
      
      const data = await resp.json();
      setFoods(data);
      
      // Reset selectedQty for all returned foods (default 1 per food item)
      const newQty = {};
      data.forEach(food => { newQty[food.id] = 1; });
      setSelectedQty(newQty);
    } catch (err) {
      console.error('Error fetching foods:', err);
      setError('Failed to load food items. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const changeQty = (id, delta, available) => {
    setSelectedQty(qty => ({
      ...qty,
      [id]: Math.max(1, Math.min(qty[id] + delta, available))
    }));
  };

  // Add food item to cart
  const addToCart = async (food) => {
    try {
      const payload = {
        buyer_id: user.institute_id,
        seller_id: food.seller_id,
        food_id: food.id,
        food_name: food.food_name,
        quantity: selectedQty[food.id],
        unit_price: food.price
      };
      
      console.log('Adding to cart:', payload); // Debug log
      
      const resp = await fetch('http://localhost:5000/api/buyer/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || 'Failed to add to cart');
      }
      
      const data = await resp.json();
      alert(data.message);
      
      // Reset quantity to 1 after adding
      setSelectedQty(prev => ({ ...prev, [food.id]: 1 }));
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add to cart: ' + err.message);
    }
  };

  return (
    <div className="buyer-dashboard">
      {/* Top-right buttons */}
      <div className="top-buttons">
        <button onClick={goToCart}>View Cart</button>
        <button onClick={logout}>Logout</button>
      </div>
      
      <h2>Buyer Dashboard</h2>
      <p>Welcome, {user.username}!</p>
      
      {loading && <p>Loading food items...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {!loading && foods.length === 0 && !error && (
        <p>No food items available at the moment.</p>
      )}
      
      <ul>
        {foods.map(food => (
          <li key={food.id}>
            <b>{food.food_name}</b> <br />
            Price: ₹{food.price} <br />
            Qty Available: {food.quantity} <br />
            Hotel: {food.seller_name}
            <br />
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 7 }}>
              <button
                style={{margin:'0 4px', fontWeight:700}}
                onClick={()=>changeQty(food.id,-1,food.quantity)}
                disabled={selectedQty[food.id] <= 1}
              >-</button>
              <span style={{minWidth:30, textAlign:'center'}}>{selectedQty[food.id]}</span>
              <button
                style={{margin:'0 4px', fontWeight:700}}
                onClick={()=>changeQty(food.id,+1,food.quantity)}
                disabled={selectedQty[food.id] >= food.quantity}
              >+</button>
              <button
                style={{marginLeft:10}}
                onClick={()=>addToCart(food)}
                disabled={food.quantity === 0}
              >
                Add to Cart
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}