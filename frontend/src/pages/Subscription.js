import React, { useEffect, useState } from 'react'
import api from '../api';

export default function Subscription() {
  const [products, setProducts] = useState([]);
  const [billingInterval, setBillingInterval] = useState('month');
  const [subscription, setSubscription] = useState({});

  useEffect(() => {
    loadProducts();
    fetchSubscription();
  }, [])

  const loadProducts = async () => {
    try {
      const res = await api.get('/stripe/products');
      // The backend sends { status, data }, so we need res.data.data
      if (res.data && res.data.data) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.log(err);
    }
  }

  const handleSubscribe = async (priceId, quantity = 1) => {
    if(subscription?.price?.id === priceId ){
      return null;
    }
    try {
      const res = await api.get(`/stripe/checkout-url?priceId=${priceId}&quantity=${quantity}`);
      if (res.data.checkoutUrl.data) {
        console.log(res.data.checkoutUrl.data);
        fetchSubscription();
      }else if(res.data.checkoutUrl){
        window.location.href = res.data.checkoutUrl;
      }else{
        console.log(res.data.message);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
    }
  };

  const cancelSubscription = async (subscriptionId) => {
    try{
      const res = await api.post('/stripe/cancel-subscription', {
        
          subscriptionId: subscriptionId
        
      });
      if(res.status === 200){
        console.log("Subscription cancelled", res.data);
        fetchSubscription();
      }
    }catch(err){
      console.log(err);
    }
  }

  const updateSubscription = async (subscriptionId, priceId) => {
    try{
      const res = await api.post('/stripe/update-subscription', {
        subscriptionId, priceId
      });
      if(res.status === 200){
        console.log("Subscription updated", res.data);
        fetchSubscription();
      }
    }catch(err){
      console.log(err);
    }
  }

  const fetchSubscription = async() => {
    try {
      const res = await api.get('/stripe/subscription-by-email');
      console.log(res.data);
      if(res.status > 400){
        navigate('/subscription');
      }else{
        console.log(res.data);
        setSubscription(res.data.data)
      }
    } catch (err) { 
      // setError('Failed to fetch subscription');
    }
  }

  const filteredProducts = products.filter(
    (product) => product.price && product.price.recurring.interval === billingInterval
  ).reverse();

  const toggleButtonStyle = (isActive) => ({
    padding: '10px 25px',
    fontSize: '16px',
    cursor: 'pointer',
    backgroundColor: isActive ? '#007bff' : 'white',
    color: isActive ? 'white' : '#007bff',
    border: 'none',
    outline: 'none',
    transition: 'background-color 0.2s, color 0.2s',
  });

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Choose Your Plan</h1>

      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'inline-block', border: '1px solid #007bff', borderRadius: '5px', overflow: 'hidden' }}>
          <button
            onClick={() => setBillingInterval('month')}
            style={toggleButtonStyle(billingInterval === 'month')}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('year')}
            style={toggleButtonStyle(billingInterval === 'year')}
          >
            Yearly
          </button>
        </div>
      </div>

      <div>
        <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap' }}>
        {products.length > 0 ? (
          filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div key={product.id} style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                width: '300px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h2 style={{ fontSize: '1.5em', color: '#333' }}>{product.name}</h2>
                  <p style={{ color: '#666', minHeight: '40px' }}>{product.description}</p>
                  
                </div>
                {product.price && (
                  <div>
                    <div style={{ fontSize: '2em', fontWeight: 'bold', margin: '20px 0' }}>
                      ${(product.price.unit_amount / 100).toFixed(2)}
                      <span style={{ fontSize: '0.5em', color: '#777' }}> / {product.price.recurring.interval}</span>
                    </div>
                    {subscription?.price?.id === product.price.id &&
                      <p>Subscribed on
                        {new Date(subscription.current_period_end * 1000)
                          .toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                      </p>
                    }
                    <button
                      onClick={() => handleSubscribe(product.price.id)}
                      style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '1em',
                        width: '100%'
                      }}
                    >
                      {subscription?.price?.id === product.price.id ? 'Subscribed' : 'Subscribe'}
                    </button>
                    {subscription?.price?.id === product.price.id && 
                      <p style={{color: 'red', cursor: 'pointer', marginTop: "10px"}}
                      onClick={() => cancelSubscription(subscription.subscription)}>
                        Cancel Subscription
                      </p>
                    }
                    {subscription?.price?.id !== product.price.id && 
                      <p style={{color: 'green', cursor: 'pointer', marginTop: "10px"}}
                      onClick={() => updateSubscription(subscription.subscription, product.price.id)}>
                        Update Subscription
                      </p>
                    }
                  </div>
                )}
                {product.marketing_features && product.marketing_features.length > 0 && (
                  <ul style={{
                    listStyle: 'none',
                    padding: '15px 0 0 0',
                    textAlign: 'left',
                    marginTop: '20px',
                    borderTop: '1px solid #eee',
                    color: '#444',
                    minHeight:"156px"
                  }}>
                    {product.marketing_features.map((feature) => (
                      <li key={feature.name} style={{
                        padding: '8px 0',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <span style={{ color: '#28a745', marginRight: '10px', fontSize: '1.2em' }}>✓</span>
                        {feature.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          ) : <p>No {billingInterval} plans found.</p>
        ) : <p>Loading plans...</p>}
      </div>
    </div>
  )
}
