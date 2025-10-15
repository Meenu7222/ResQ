import { useState } from 'react';
import './LoginForm.css';

export default function LoginForm({ role, setUser, setView }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    let url = (role === 'admin')
      ? 'http://localhost:5000/api/auth/admin-login'
      : 'http://localhost:5000/api/auth/login';

    const resp = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(role === 'admin'
        ? { username, password }
        : { username, password, role }
      ),
    });
    const data = await resp.json();
    if (resp.ok) {
      setUser(data.user || data.id);
      setStatus('Success!');
      if (role === 'admin') setView('adminDashboard');
      // Else redirect buyer/seller to their dashboard...
    } 
    else if (role === 'seller') {
    setView('sellerDashboard');}
    else if (role == 'buyer'){
      setView('buyerDashboard');
    }
    else {
      setStatus(data.error || 'Login failed');
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <h2>Login as {role}</h2>
      <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
      <button type="submit">Login</button>
      <div className="status">{status}</div>
      <button type="button" onClick={() => setView('roleSelect')}>Back</button>
    </form>
  );
}
