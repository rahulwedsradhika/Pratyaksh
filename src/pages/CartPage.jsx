import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function CartPage() {
  const { cart, removeFromCart, showToast } = useApp();
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const navigate = useNavigate();

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    showToast('Apply membership coupons at checkout, where the server verifies the price and eligibility.', 'info');
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price || 0), 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const taxableAmount = subtotal - discountAmount;
  const gst = Math.round(taxableAmount * 0.18);
  const total = taxableAmount + gst;

  return (
    <div className="cart-page py-5 bg-light min-vh-100">
      <div className="container">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Home</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Shopping Bag</li>
          </ol>
        </nav>

        <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
          <h2 className="fw-bold text-dark mb-0">
            <i className="fa-solid fa-bag-shopping text-warning me-2"></i> Your Bag Details
          </h2>
          <span className="badge bg-warning text-dark fw-bold px-3 py-2">
            {cart.length} {cart.length === 1 ? 'Item' : 'Items'} in Bag
          </span>
        </div>

        {cart.length === 0 ? (
          <div className="bg-white p-5 rounded-4 shadow-sm border text-center my-4">
            <div className="btn btn-light rounded-circle p-4 mb-3 text-muted" style={{ width: '90px', height: '90px', fontSize: '2.5rem' }}>
              <i className="fa-solid fa-bag-shopping"></i>
            </div>
            <h3 className="fw-bold text-dark mb-2">Please add items 📗 to bag 👜</h3>
            <p className="text-muted mb-4 max-w-500 mx-auto">
              Your bag is currently empty. Explore our comprehensive AIAPGET batches, BAMS university curriculum, and test series to begin.
            </p>
            <Link to="/courses" className="btn btn-ayur btn-lg px-4">
              Explore Courses Catalog <i className="fa-solid fa-arrow-right ms-2"></i>
            </Link>
          </div>
        ) : (
          <div className="row g-4">
            {/* Items List */}
            <div className="col-lg-8">
              <div className="d-flex flex-column gap-3">
                {cart.map(item => (
                  <div key={item.id} className="ayur-card p-4 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <img 
                        src={item.img || '/assets/upload/Aiapget 1.png'} 
                        alt={item.course_name}
                        className="rounded-3 border"
                        width="80"
                        height="60"
                        style={{ objectFit: 'cover' }}
                        onError={(e) => { e.target.onerror = null; e.target.src = '/assets/upload/Aiapget 1.png'; }}
                      />
                      <div>
                        <h5 className="fw-bold text-dark mb-1">{item.course_name}</h5>
                        <small className="text-muted">Full Lifetime Access • Offline Videos &amp; PDF Notes</small>
                      </div>
                    </div>

                    <div className="d-flex align-items-center justify-content-between justify-content-sm-end gap-4 w-100 w-sm-auto">
                      <div className="fw-bold text-dark" style={{ fontSize: '1.25rem' }}>
                        ₹{item.price ? item.price.toLocaleString() : '8,499'}
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="btn btn-outline-danger btn-sm rounded-circle p-2"
                        title="Remove from bag"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Code Box */}
              <div className="bg-white p-4 rounded-4 shadow-sm border mt-4">
                <h6 className="fw-bold text-dark mb-2">Have a Promotional Voucher or Scholarship Coupon?</h6>
                <form onSubmit={handleApplyCoupon} className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter coupon (e.g. PRATYAKSH10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    style={{ maxWidth: '300px' }}
                  />
                  <button type="submit" className="btn btn-outline-warning text-dark fw-bold">
                    Apply Code
                  </button>
                </form>
                {discountPercent > 0 && (
                  <small className="text-success fw-bold d-block mt-2">
                    ✓ 10% Discount Coupon Applied Successfully!
                  </small>
                )}
              </div>
            </div>

            {/* Order Summary Checkout Card */}
            <div className="col-lg-4">
              <div className="bg-white p-4 rounded-4 shadow-sm border sticky-top" style={{ top: '100px' }}>
                <h5 className="fw-bold text-dark mb-3">Order Summary</h5>

                <div className="d-flex justify-content-between mb-2 text-muted" style={{ fontSize: '0.95rem' }}>
                  <span>Subtotal ({cart.length} items):</span>
                  <span className="text-dark fw-semibold">₹{subtotal.toLocaleString()}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="d-flex justify-content-between mb-2 text-success" style={{ fontSize: '0.95rem' }}>
                    <span>Scholarship Discount (10%):</span>
                    <span>-₹{discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="d-flex justify-content-between mb-3 text-muted" style={{ fontSize: '0.95rem' }}>
                  <span>Estimated GST (18%):</span>
                  <span className="text-dark fw-semibold">₹{gst.toLocaleString()}</span>
                </div>

                <hr className="my-3" />

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <span className="fw-bold text-dark" style={{ fontSize: '1.1rem' }}>Total Amount:</span>
                  <span className="fw-bold text-warning" style={{ fontSize: '1.6rem' }}>
                    ₹{total.toLocaleString()}
                  </span>
                </div>

                <button 
                  onClick={() => navigate('/checkout')}
                  className="btn btn-ayur btn-lg w-100 py-3 fw-bold shadow-sm"
                >
                  Proceed to Checkout <i className="fa-solid fa-arrow-right ms-2"></i>
                </button>

                <div className="mt-3 text-center">
                  <small className="text-muted d-block">
                    <i className="fa-solid fa-lock text-success me-1"></i> Simulated Local Checkout
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

