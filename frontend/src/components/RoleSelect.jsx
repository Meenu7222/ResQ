import './RoleSelect.css';

export default function RoleSelect({ setView, setRole }) {
  return (
    <div className="role-select">
      <h2>Login/Sign Up as:</h2>
      <button onClick={() => { setRole('admin'); setView('login'); }}>Login as Admin</button>
      <button onClick={() => { setRole('buyer'); setView('login'); }}>Login as Buyer</button>
      <button onClick={() => { setRole('seller'); setView('login'); }}>Login as Seller</button>
      <hr />
      <button onClick={() => setView('signup')}>Sign Up (Buyer/Seller only)</button>
    </div>
  );
}
