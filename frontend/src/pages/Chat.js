import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function Chat() {
  const { user, logout } = useAuth();
  const [receiverId, setReceiverId] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (receiverId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
    // eslint-disable-next-line
  }, [receiverId]);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/chat/get/${receiverId}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      setError('Failed to fetch messages');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/chat/send', {
        receiverId,
        content: message,
      });
      setMessage('');
      fetchMessages();
    } catch (err) {
      setError('Failed to send message');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Chat</h2>
        <button onClick={logout}>Logout</button>
      </div>
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Receiver ID"
          value={receiverId}
          onChange={e => setReceiverId(e.target.value)}
          style={{ width: '100%', marginBottom: 8 }}
        />
      </div>
      <div style={{ border: '1px solid #ccc', minHeight: 200, padding: 8, marginBottom: 8 }}>
        {messages.length === 0 && <div>No messages</div>}
        {messages.map((msg, idx) => (
          <div key={idx} style={{ textAlign: msg.senderId === user._id ? 'right' : 'left' }}>
            <b>{msg.senderId === user._id ? 'You' : 'Them'}:</b> {msg.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          placeholder="Type a message"
          value={message}
          onChange={e => setMessage(e.target.value)}
          required
          style={{ flex: 1 }}
        />
        <button type="submit">Send</button>
      </form>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
    </div>
  );
}

export default Chat; 