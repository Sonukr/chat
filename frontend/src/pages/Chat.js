import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import UserSelect from './userSelect';
import { useNavigate } from 'react-router-dom';


function Chat() {
  const { user, logout } = useAuth();
  const [receiverId, setReceiverId] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    fetchMe();
  }, [])

  useEffect(() => {
    if (receiverId) {
      fetchMessages();
    } else {
      setMessages([]);
    }
    // eslint-disable-next-line
  }, [receiverId]);

  const fetchMe = async () => {
    try {
      const res = await api.get('/auth/me');
      if(res.status > 400){
        navigate('/login');
      }else{
        console.log(res.data);
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        navigate('/login');
      } else {
        console.log(err);
      }
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/all');
      console.log(res.data);
      if(res.status > 400){
        navigate('/login');
      }else{
        setUsers(res.data.users);
      }
    } catch (err) {
      if (err.response && err.response.status === 401) {
        navigate('/login');
      } else {
        console.log(err);
      }
    }
  }

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/messages/get/${receiverId}`);
      setMessages(res.data.data || []);
    } catch (err) {
      setError('Failed to fetch messages');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/messages/send', {
        receiverId,
        message: message,
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
        <UserSelect
          users={users}
          currentUser={user}
          setReceiverId={setReceiverId}
        />
      </div>
      <div style={{ border: '1px solid #ccc', minHeight: 200, padding: 8, marginBottom: 8 }}>
        {messages.length === 0 && <div>No messages</div>}
        {messages.map((msg, idx) => (
          <div key={idx} style={{ textAlign: msg.senderId === user.id ? 'right' : 'left' }}>
            <b>{msg.senderId === user.id ? 'You' : 'Them'}:</b> {msg.message}
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