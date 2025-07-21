import React, { useState } from 'react';

const UserSelect = ({ users, currentUser, setReceiverId }) => {
  const [selectedId, setSelectedId] = useState("");

  const handleChange = (e) => {
    const selected = e.target.value;
    setSelectedId(selected);
    setReceiverId(selected); 
  };

  return (
    <div>
      <label htmlFor="user-select">Send message to:</label>
      <select
        id="user-select"
        value={selectedId}
        onChange={handleChange}
      >
        <option value="" disabled>Select a user</option>
        {users
          .filter((u) => u._id !== currentUser.id)
          .map((user) => (
            <option key={user._id} value={user._id}>
              {user.name}
            </option>
          ))}
      </select>

      {selectedId && (
        <div style={{ marginTop: "10px" }}>
          Selected: {users.find(u => u._id === selectedId)?.name}
        </div>
      )}
    </div>
  );
};

export default UserSelect;