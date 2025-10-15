import { useState, useEffect } from 'react';
import './CartDashboard.css';

export default function CartDashboard({ user }) {
  const [cart, setCart] = useState([]);
  const [foods, setFoods] = useState([]);
  const [deliveryOpt, setDeliveryOpt] = useState('self');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [checkoutStatus, setCheckoutStatus] = useState('');

  useEffect(() => {
    fetchCart();
    fetchFoods();
    // eslint-disable-next-line
  }, []);

  const fetchCart = async () => {
    const resp = await fetch(`/api/buyer/cart/${user.institute_id}`);
    setCart(await resp.json());
  };

  const fetchFoods = async () => {
    const resp = await fetch(`/api/buyer/foods`);
    setFoods(await resp.json());
  };

  const updateCartQty = async (cartItem, newQty) => {
    await fetch('/api/buyer/cart/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cart_id: cartItem.id,
        quantity: newQty,
        unit_price: cartItem.unit_price
      })
    });
    fetchCart();
  };

  const handleCheckout = async () => {
    if (deliveryOpt === 'partner' && deliveryAddress.trim() === '') {
      setCheckoutStatus("Please enter delivery address for delivery partner.");
      return;
    }
    const resp = await fetch('http::/localhost:5000/api/buyer/cart/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyer_id: user.institute_id,
        delivery: deliveryOpt,
        delivery_address: deliveryOpt === 'partner' ? deliveryAddress : ''
      })
    });
    const data = await resp.json();
    if (resp.ok) {
      setCart([]);
      setCheckoutStatus(`Order placed! Bill: ₹${data.total}`);
      fetchFoods();
    } else {
      setCheckoutStatus(data.error || "Checkout failed");
    }
  };

  return (
    <div className="cart-dashboard">
      <h2>My Cart</h2>
      <ul>
        {cart.map(item => (
          <li key={item.id}>
            <span>
              {item.food_name} x {item.quantity} = ₹{item.total_price}
            </span>
            <span>
              <button className="qty-btn"
                disabled={item.quantity <= 1}
                onClick={() => updateCartQty(item, item.quantity - 1)}>-</button>
              <button className="qty-btn"
                disabled={item.quantity >= (foods.find(f => f.id === item.food_id)?.quantity || item.quantity)}
                onClick={() => updateCartQty(item, item.quantity + 1)}>+</button>
              <button className="remove-btn" onClick={() => updateCartQty(item, 0)}>Remove</button>
            </span>
          </li>
        ))}
      </ul>
      <div>
        Delivery:
        <label>
          <input type="radio" value="self" checked={deliveryOpt === 'self'} onChange={() => setDeliveryOpt('self')} /> Self Pickup
        </label>
        <label>
          <input type="radio" value="partner" checked={deliveryOpt === 'partner'} onChange={() => setDeliveryOpt('partner')} /> Delivery Partner (+₹30)
        </label>
        {deliveryOpt === 'partner' && (
          <input
            type="text"
            className="cart-address"
            placeholder="Delivery Address"
            value={deliveryAddress}
            onChange={e => setDeliveryAddress(e.target.value)}
          />
        )}
      </div>
      <button onClick={handleCheckout}>Pay</button>
      <div className="status">{checkoutStatus}</div>
    </div>
  );
}
