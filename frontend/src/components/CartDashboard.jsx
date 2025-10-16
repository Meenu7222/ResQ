import { useState, useEffect } from 'react';
import './CartDashboard.css';

export default function CartDashboard({ user }) {
  const [cart, setCart] = useState([]);
  const [foods, setFoods] = useState([]);
  const [deliveryOpt, setDeliveryOpt] = useState('self');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [checkoutStatus, setCheckoutStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCart();
    fetchFoods();
  }, []);

  const fetchCart = async () => {
    try {
      const resp = await fetch(`http://localhost:5000/api/buyer/cart/${user.institute_id}`);
      
      if (!resp.ok) {
        throw new Error('Failed to fetch cart');
      }
      
      const data = await resp.json();
      setCart(data);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setCheckoutStatus('Failed to load cart');
    }
  };

  const fetchFoods = async () => {
    try {
      const resp = await fetch(`http://localhost:5000/api/buyer/foods`);
      
      if (!resp.ok) {
        throw new Error('Failed to fetch foods');
      }
      
      const data = await resp.json();
      setFoods(data);
    } catch (err) {
      console.error('Error fetching foods:', err);
    }
  };

  const updateCartQty = async (cartItem, newQty) => {
    try {
      const resp = await fetch('http://localhost:5000/api/buyer/cart/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart_id: cartItem.id,
          quantity: newQty,
          unit_price: cartItem.unit_price
        })
      });
      
      if (!resp.ok) {
        throw new Error('Failed to update cart');
      }
      
      await fetchCart();
      await fetchFoods(); // Refresh available quantities
    } catch (err) {
      console.error('Error updating cart:', err);
      setCheckoutStatus('Failed to update cart');
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setCheckoutStatus("Your cart is empty!");
      return;
    }
    
    if (deliveryOpt === 'partner' && deliveryAddress.trim() === '') {
      setCheckoutStatus("Please enter delivery address for delivery partner.");
      return;
    }
    
    try {
      setLoading(true);
      setCheckoutStatus('Processing...');
      
      const resp = await fetch('http://localhost:5000/api/buyer/cart/checkout', {
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
        setDeliveryAddress('');
        setCheckoutStatus(`✓ Order placed successfully! Total Bill: ₹${data.total}`);
        await fetchFoods();
      } else {
        setCheckoutStatus(`✗ ${data.error || "Checkout failed"}`);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setCheckoutStatus('✗ Network error during checkout');
    } finally {
      setLoading(false);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.total_price, 0);
  const deliveryCharge = deliveryOpt === 'partner' ? 30 : 0;
  const grandTotal = Number(cartTotal) + Number(deliveryCharge);

  return (
    <div className="cart-dashboard">
      <h2>My Cart</h2>
      
      {cart.length === 0 ? (
        <p>Your cart is empty. Add some items!</p>
      ) : (
        <>
          <ul>
            {cart.map(item => {
              const foodInStock = foods.find(f => f.id === item.food_id);
              const maxQty = foodInStock?.quantity || item.quantity;
              
              return (
                <li key={item.id}>
                  <span>
                    {item.food_name} x {item.quantity} = ₹{item.total_price}
                  </span>
                  <span>
                    <button 
                      className="qty-btn"
                      disabled={item.quantity <= 1}
                      onClick={() => updateCartQty(item, item.quantity - 1)}
                    >
                      -
                    </button>
                    <button 
                      className="qty-btn"
                      disabled={item.quantity >= maxQty}
                      onClick={() => updateCartQty(item, item.quantity + 1)}
                    >
                      +
                    </button>
                    <button 
                      className="remove-btn" 
                      onClick={() => updateCartQty(item, 0)}
                    >
                      Remove
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
          
          <div style={{ marginTop: '20px', fontWeight: 'bold' }}>
            <p>Subtotal: ₹{cartTotal}</p>
            {deliveryOpt === 'partner' && <p>Delivery: ₹{deliveryCharge}</p>}
            <p style={{ fontSize: '1.2em' }}>Total: ₹{grandTotal}</p>
          </div>
        </>
      )}
      
      <div style={{ marginTop: '20px' }}>
        <strong>Delivery:</strong><br />
        <label style={{ marginRight: '15px' }}>
          <input 
            type="radio" 
            value="self" 
            checked={deliveryOpt === 'self'} 
            onChange={() => setDeliveryOpt('self')} 
          /> Self Pickup
        </label>
        <label>
          <input 
            type="radio" 
            value="partner" 
            checked={deliveryOpt === 'partner'} 
            onChange={() => setDeliveryOpt('partner')} 
          /> Delivery Partner (+₹30)
        </label>
        
        {deliveryOpt === 'partner' && (
          <input
            type="text"
            className="cart-address"
            placeholder="Enter delivery address"
            value={deliveryAddress}
            onChange={e => setDeliveryAddress(e.target.value)}
            style={{ display: 'block', marginTop: '10px', width: '100%', padding: '8px' }}
          />
        )}
      </div>
      
      <button 
        onClick={handleCheckout}
        disabled={loading || cart.length === 0}
        style={{ marginTop: '20px' }}
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
      
      {checkoutStatus && (
        <div className="status" style={{ marginTop: '15px', fontWeight: 'bold' }}>
          {checkoutStatus}
        </div>
      )}
    </div>
  );
}