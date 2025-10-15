import './SignupForm.css';
import { useState } from 'react';

export default function SignupForm({ setView }) {
  const [form, setForm] = useState({ username:'', password:'', role:'buyer', phone:'', institute_id:'' });
  const [status, setStatus] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    const resp = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify(form),
    });
    const data = await resp.json();
    setStatus(resp.ok ? 'Registered, pending approval.' : (data.error || "Signup failed"));
  };

  return (
    <form className="signup-form" onSubmit={handleSubmit}>
      <h2>Sign up as Buyer/Seller</h2>
      <input name="username" placeholder="Username" onChange={handleChange} required />
      <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
      <select name="role" onChange={handleChange}>
        <option value="buyer">Buyer</option>
        <option value="seller">Seller</option>
      </select>
      <input name="phone" placeholder="Phone" onChange={handleChange} required />
      <input name="institute_id" placeholder="Institute ID" onChange={handleChange} required />
      <button type="submit">Sign Up</button>
      <div className="status">{status}</div>
      <button type="button" onClick={() => setView('roleSelect')}>Back</button>
    </form>
  );
}
