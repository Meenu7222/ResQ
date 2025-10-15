import { useState, useEffect } from 'react';
import './SellerDashboard.css';

export default function SellerDashboard({ user }) {
  const [form, setForm] = useState({
    food_name: '',
    price: '',
    quantity: '',
    duration_minutes: ''
  });
  const [postedFoods, setPostedFoods] = useState([]);
  const [status, setStatus] = useState('');

  // Always call hooks at the top level!
  useEffect(() => {
    // only fetch if seller is logged in
    if (user && user.institute_id) {
      fetchFoods();
    }
    // Removed /removeExpired call to avoid 404 errors
  }, [user]);

  const fetchFoods = async () => {
    if (!user || !user.institute_id) return;
    const resp = await fetch(`http://localhost:5000/api/seller/myFood/${user.institute_id}`);
    if (!resp.ok) {
      setPostedFoods([]);
      return;
    }
    const data = await resp.json();
    setPostedFoods(data);
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    if (!user || !user.institute_id) {
      setStatus("Error: not logged in as seller");
      return;
    }
    const toSend = {
      seller_id: user.institute_id,     // seller's institute_id for both fields
      institute_id: user.institute_id,
      food_name: form.food_name,
      price: form.price,
      quantity: form.quantity,
      duration_minutes: form.duration_minutes
    };
    const resp = await fetch('http://localhost:5000/api/seller/postFood', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSend)
    });
    const data = await resp.json();
    setStatus(resp.ok ? 'Food posted!' : (data.error || "Error posting"));
    fetchFoods();
  };

  // Only do conditional rendering after the hooks!
  if (!user || !user.institute_id) {
    return <div>Please log in as a seller to access the dashboard.</div>;
  }

  return (
    <div className="seller-dashboard">
      <h2>Post Food</h2>
      <form className="food-post-form" onSubmit={handleSubmit}>
        <input name="food_name" placeholder="Food Name" onChange={handleChange} required />
        <input name="price" type="number" min="0" step="0.01" placeholder="Price" onChange={handleChange} required />
        <input name="quantity" type="number" min="1" placeholder="Quantity" onChange={handleChange} required />
        <input name="duration_minutes" type="number" min="1" placeholder="Duration before expiry (minutes)" onChange={handleChange} required />
        <button type="submit">Post Food</button>
        <div className="status">{status}</div>
      </form>
      <hr />
      <h2>My Posted Foods (Active)</h2>
      <ul>
        {postedFoods.length === 0 && <div>No active posts</div>}
        {postedFoods.map(food => (
          <li key={food.id}>
            <span>
              <b>{food.food_name}</b> - ₹{food.price} <br/>
              Qty: {food.quantity} | Expires: {new Date(food.expiry_time).toLocaleString()}<br/>
              Posted: {new Date(food.posted_at).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
