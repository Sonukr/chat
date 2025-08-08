import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api';

const SubscriptionStatus = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // Start with verifying
  const [message, setMessage] = useState('Verifying your subscription...');

  useEffect(() => {
    const statusParam = searchParams.get('status');
    const sessionId = searchParams.get('session_id');

    const verifySubscription = async (id) => {
      try {
        await api.get(`/stripe/verify-session?sessionId=${id}`);
        setStatus('success');
        // You could also update your AuthContext here to reflect the new subscription status
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Failed to verify your subscription.');
      }
    };

    if (statusParam === 'success' && sessionId) {
      verifySubscription(sessionId);
    } else if (statusParam === 'cancel') {
      setStatus('cancel');
    } else {
      setStatus('error');
      setMessage('Invalid subscription status URL.');
    }
  }, [searchParams]);

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#f4f7f6'
  };

  const cardStyle = {
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
    backgroundColor: '#fff',
    maxWidth: '450px',
    width: '100%'
  };

  const iconStyle = {
    fontSize: '50px',
    marginBottom: '20px',
  };

  const buttonStyle = {
    display: 'inline-block',
    marginTop: '30px',
    padding: '12px 24px',
    fontSize: '16px',
    color: '#fff',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '5px',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  };

  if (status === 'success') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ ...iconStyle, color: '#28a745' }}>✓</div>
          <h1 style={{ color: '#28a745', marginBottom: '15px' }}>Subscription Successful!</h1>
          <p style={{ color: '#555', lineHeight: '1.6' }}>Thank you for subscribing. Your plan is now active and you can enjoy all the premium features.</p>
          <Link to="/chat" style={buttonStyle}>Go to Chat</Link>
        </div>
      </div>
    );
  }

  if (status === 'cancel') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ ...iconStyle, color: '#dc3545' }}>✗</div>
          <h1 style={{ color: '#dc3545', marginBottom: '15px' }}>Subscription Canceled</h1>
          <p style={{ color: '#555', lineHeight: '1.6' }}>Your subscription process was canceled. You can always choose a plan later from the subscription page.</p>
          <Link to="/subscription" style={buttonStyle}>View Plans</Link>
        </div>
      </div>
    );
  }

  // This covers 'verifying' and 'error' states
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        {status === 'error' && <div style={{ ...iconStyle, color: '#dc3545' }}>✗</div>}
        <h1 style={{ color: status === 'error' ? '#dc3545' : '#333' }}>
          {status === 'verifying' ? 'Verifying...' : 'Verification Failed'}
        </h1>
        <p style={{ color: '#555', lineHeight: '1.6' }}>{message}</p>
        {status === 'error' && <Link to="/subscription" style={buttonStyle}>View Plans</Link>}
      </div>
    </div>
  );
};

export default SubscriptionStatus;