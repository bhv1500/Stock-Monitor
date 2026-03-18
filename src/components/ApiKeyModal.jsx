import { useState } from 'react';
import './ApiKeyModal.css';

export default function ApiKeyModal({ onSave }) {
  const [key, setKey] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (key.trim()) onSave(key.trim());
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-logo">
          <span className="modal-logo-icon">📈</span>
          <span className="modal-logo-text">StockMonitor</span>
        </div>
        <h2>Enter your Finnhub API Key</h2>
        <p>
          Get a free API key at{' '}
          <a href="https://finnhub.io" target="_blank" rel="noreferrer">
            finnhub.io
          </a>
          . No credit card required.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="e.g. crxxxxxxxxxxxxxxxxxxxxxx"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={!key.trim()}>
            Get Started
          </button>
        </form>
        <p className="modal-note">Your key is stored only in your browser's localStorage.</p>
      </div>
    </div>
  );
}
