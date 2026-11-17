import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function CheckoutPage() {
  const { cart, user, showToast, fetchCart } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user.name || 'Dr. Demo Learner',
    email: user.email || 'learner@pratyakshayurveda.local',
    phone: user.phone || '+91 98765 43210',
    college: 'IMS BHU Faculty of Ayurveda',
    address: 'Varanasi',
    state: 'Uttar Pradesh'
  });

  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [processing, setProcessing] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState(null);

  const subtotal = cart.reduce((sum, item) => sum + (item.price || 0), 0);
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;

  const handlePay = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, items: cart, total })
      });
      const data = await res.json();
      if (data.status) {
        showToast('Payment simulated successfully! Course unlocked.', 'success');
        setCompletedInvoice(data.data);
        fetchCart();
      }
    } catch (e) {
      showToast('Error processing simulated checkout', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (completedInvoice) {
    return (
      <div className="checkout-success py-5 bg-light min-vh-100">
        <div className="container">
          <div className="bg-white p-5 rounded-4 shadow-sm border max-w-700 mx-auto text-center">
            <div className="btn btn-success rounded-circle p-4 mb-3 text-white" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
              <i className="fa-solid fa-check"></i>
            </div>
            <h2 className="fw-bold text-dark mb-2">Enrollment Completed!</h2>
            <p className="text-muted mb-4">
              Your enrollment has been successfully recorded on this local system. All lessons and test series are now unlocked in your dashboard.
            </p>

            <div className="p-4 bg-light rounded-3 text-start border mb-4">
              <div className="row g-2" style={{ fontSize: '0.9rem' }}>
                <div className="col-6 text-muted">Invoice Reference:</div>
                <div className="col-6 text-end fw-bold text-dark">{completedInvoice.invoiceId}</div>
                <div className="col-6 text-muted">Date:</div>
                <div className="col-6 text-end">{completedInvoice.date}</div>
                <div className="col-6 text-muted">Learner Name:</div>
                <div className="col-6 text-end">{form.name}</div>
                <div className="col-6 text-muted">Payment Status:</div>
                <div className="col-6 text-end text-success fw-bold">{completedInvoice.status}</div>
              </div>
            </div>

            <div className="d-flex justify-content-center gap-3">
              <Link to="/dashboard" className="btn btn-ayur btn-lg px-4 fw-bold">
                Go to Student LMS Dashboard <i className="fa-solid fa-graduation-cap ms-2"></i>
              </Link>
              <Link to="/courses" className="btn btn-outline-secondary btn-lg px-4">
                Explore More Courses
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page py-5 bg-light min-vh-100">
      <div className="container">
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link to="/" className="text-decoration-none">Home</Link></li>
            <li className="breadcrumb-item"><Link to="/cart" className="text-decoration-none">Bag</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Checkout Simulation</li>
          </ol>
        </nav>

        <div className="mb-4 pb-2 border-bottom">
          <h2 className="fw-bold text-dark mb-1">Checkout &amp; Course Enrollment</h2>
          <span className="badge bg-warning text-dark fw-bold">
            <i className="fa-solid fa-circle-check me-1"></i> LOCAL_DEMO_MODE (Simulated Payment)
          </span>
        </div>

        <form onSubmit={handlePay}>
          <div className="row g-5">
            {/* Left Column: Learner Details */}
            <div className="col-lg-7">
              <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border mb-4">
                <h4 className="fw-bold text-dark mb-4">1. Learner Profile &amp; Billing Details</h4>

                <div className="mb-3">
                  <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>Mobile Number *</label>
                    <input
                      type="tel"
                      className="form-control"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>BAMS College / Hospital Affiliation</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.college}
                    onChange={(e) => setForm({ ...form, college: e.target.value })}
                  />
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>City</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted fw-semibold" style={{ fontSize: '0.85rem' }}>State</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="bg-white p-4 p-md-5 rounded-4 shadow-sm border">
                <h4 className="fw-bold text-dark mb-4">2. Select Payment Mode (Simulated)</h4>

                <div className="d-flex flex-column gap-3">
                  <label className={`p-3 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer ${paymentMethod === 'upi' ? 'border-warning bg-light' : ''}`}>
                    <div className="d-flex align-items-center gap-3">
                      <input 
                        type="radio" 
                        name="payment" 
                        checked={paymentMethod === 'upi'} 
                        onChange={() => setPaymentMethod('upi')}
                        className="form-check-input"
                      />
                      <div>
                        <strong className="d-block text-dark">UPI / QR Code (GPay, PhonePe, Paytm)</strong>
                        <small className="text-muted">Instant activation via simulated UPI transfer</small>
                      </div>
                    </div>
                    <i className="fa-solid fa-qrcode fa-xl text-warning"></i>
                  </label>

                  <label className={`p-3 rounded-3 border d-flex align-items-center justify-content-between cursor-pointer ${paymentMethod === 'card' ? 'border-warning bg-light' : ''}`}>
                    <div className="d-flex align-items-center gap-3">
                      <input 
                        type="radio" 
                        name="payment" 
                        checked={paymentMethod === 'card'} 
                        onChange={() => setPaymentMethod('card')}
                        className="form-check-input"
                      />
                      <div>
                        <strong className="d-block text-dark">Debit / Credit Card</strong>
                        <small className="text-muted">Simulated test card authorization</small>
                      </div>
                    </div>
                    <i className="fa-solid fa-credit-card fa-xl text-primary"></i>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Order Review */}
            <div className="col-lg-5">
              <div className="bg-white p-4 rounded-4 shadow-sm border sticky-top" style={{ top: '100px' }}>
                <h5 className="fw-bold text-dark mb-3">Enrolling In</h5>

                <div className="d-flex flex-column gap-3 mb-4">
                  {cart.map(item => (
                    <div key={item.id} className="d-flex justify-content-between align-items-center pb-2 border-bottom" style={{ fontSize: '0.9rem' }}>
                      <span className="fw-semibold text-dark">{item.course_name}</span>
                      <span className="fw-bold">₹{item.price?.toLocaleString()}</span>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <div className="text-muted py-2">Demo Enrollment Item (₹8,499)</div>
                  )}
                </div>

                <div className="d-flex justify-content-between mb-2 text-muted" style={{ fontSize: '0.9rem' }}>
                  <span>Subtotal:</span>
                  <span className="text-dark fw-bold">₹{subtotal > 0 ? subtotal.toLocaleString() : '8,499'}</span>
                </div>

                <div className="d-flex justify-content-between mb-3 text-muted" style={{ fontSize: '0.9rem' }}>
                  <span>GST (18%):</span>
                  <span className="text-dark fw-bold">₹{gst > 0 ? gst.toLocaleString() : '1,530'}</span>
                </div>

                <hr />

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <span className="fw-bold text-dark">Total Payable:</span>
                  <span className="fw-bold text-warning" style={{ fontSize: '1.6rem' }}>
                    ₹{total > 0 ? total.toLocaleString() : '10,029'}
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn btn-ayur btn-lg w-100 py-3 fw-bold shadow"
                  disabled={processing}
                >
                  {processing ? 'Simulating Payment...' : 'Complete Free Enrollment (Demo)'} <i className="fa-solid fa-lock ms-2"></i>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

