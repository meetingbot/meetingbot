'use client';

import { useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [response, setResponse] = useState('');

  // Fetch data from GET API
  const fetchMessage = async () => {
    const res = await fetch('/api/fetch');
    const data = await res.json();
    setMessage(data.message);
  };

  // Send data via POST request
  const sendName = async () => {
    const res = await fetch('/api/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setResponse(data.message);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Next.js App Router with API</h1>

      {/* GET Request */}
      <button onClick={fetchMessage}>Fetch Message</button>
      <p>{message}</p>

      {/* POST Request */}
      <input
        type="text"
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <button onClick={sendName}>Send Name</button>
      
      <p>{response}</p>
    </div>
  );
}
