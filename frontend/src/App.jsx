import React, { useState } from 'react';
import RoleSelect from './components/RoleSelect';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import AdminDashboard from './components/AdminDashboard';
import SellerDashboard from './components/SellerDashboard';
import BuyerDashboard from './components/BuyerDashboard';
import CartDashboard from './components/CartDashboard';

export default function App() {
  const [view, setView] = useState('roleSelect'); // roleSelect, login, signup, adminDashboard, sellerDashboard, buyerDashboard, cartDashboard
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);

  // Simplest possible routing
  if (view === 'roleSelect') return <RoleSelect setView={setView} setRole={setRole} />;
  if (view === 'login') return <LoginForm role={role} setUser={setUser} setView={setView} />;
  if (view === 'signup') return <SignupForm setView={setView} />;
  if (view === 'adminDashboard') return <AdminDashboard />;
  if (view === 'sellerDashboard') return <SellerDashboard user={user} />;
  if (view === 'buyerDashboard') return <BuyerDashboard user={user} logout={() => setView('roleSelect')} goToCart={() => setView('cartDashboard')} />;
  if (view === 'cartDashboard') return <CartDashboard user={user} logout={() => setView('roleSelect')} goBack={() => setView('buyerDashboard')} />;

  return <div>Unknown view</div>;
}
