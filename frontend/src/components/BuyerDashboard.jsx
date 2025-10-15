import { useState, useEffect } from 'react';
import './BuyerDashboard.css';

export default function BuyerDashboard({ user, logout, goToCart }) {
  const [foods, setFoods] = useState([]);
  const [search, setSearch] = useState('');
  // For storing quantities for each food before adding to cart
  const [selectedQty, setSelectedQty] = useState({});

  useEffect(() => {
    fetchFoods();
    // eslint-disable-next-line
  }, []);

  const fetchFoods = async () => {
    const resp = await fetch(`/api/buyer/foods?search=${encodeURIComponent(search)}`);
    const data = await resp.json();
    setFoods(data);
    // Reset selectedQty for all returned foods (default 1 per food item)
    const newQty = {};
    data.forEach(food => { newQty[food.id] = 1; });
    setSelectedQty(newQty);
  };

  const handleSearchChange = (e) => setSearch(e.target.value);
  const handleSearchSubmit = e => { e.preventDefault(); fetchFoods(); };

  const changeQty = (id, delta, available) => {
    setSelectedQty(qty => ({
      ...qty,
      [id]: Math.max(1, Math.min(qty[id] + delta, available))
    }));
  };

  // Add food item to cart
  const addToCart = async (food) => {
    const payload = {
      buyer_id: user.institute_id,
      seller_id: food.seller_id,
      food_id: food.id,
      food_name: food.food_name,
      quantity: selectedQty[food.id],
      unit_price: food.price
    };
    const resp = await fetch('/api/buyer/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    alert(data.message);
  };

  return (
    <div className="buyer-dashboard">
      {/* Top-right buttons */}
      <div className="top-buttons">
        <button onClick={goToCart}>View Cart</button>
        <button onClick={logout}>Logout</button>
      </div>
      <h2>Buyer Dashboard</h2>
      {/* Search field, submit button */}
      <form onSubmit={handleSearchSubmit}>
        <input
          type="text"
          placeholder="Search food..."
          value={search}
          onChange={handleSearchChange}
        />
        <button type="submit">Search</button>
      </form>
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
