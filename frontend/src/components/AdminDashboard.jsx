import { useEffect, useState } from 'react';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [pending, setPending] = useState([]);

  const fetchPending = async () => {
    const resp = await fetch('http://localhost:5000/api/admin/pending');
    const data = await resp.json();
    setPending(data);
  };

  useEffect(() => { fetchPending(); }, []);

  const approve = async (id) => {
    await fetch(`http://localhost:5000/api/admin/approve/${id}`, { method: 'POST' });
    fetchPending();
  };
  
  const disapprove = async (id) => {
    await fetch(`http://localhost:5000/api/admin/disapprove/${id}`, { method: 'POST' });
    fetchPending();
  };

  return (
    <div className="admin-dashboard">
      <h2>Pending Requests</h2>
      {pending.length === 0 && <div>No pending requests</div>}
      <ul>
        {pending.map(req => (
          <li key={req.id}>
            <span>{req.username} (ID: {req.id}, Role: {req.role})</span>
            <div>
              <button onClick={() => approve(req.id)}>Approve</button>
              <button onClick={() => disapprove(req.id)}>Disapprove</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
