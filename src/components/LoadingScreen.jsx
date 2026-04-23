import React from 'react';

export default function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="loading-screen">
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 56,
          height: 56,
          border: '2px solid rgba(255,215,0,0.1)',
          borderTopColor: '#FFD700',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: 12,
          letterSpacing: '0.3em',
          color: '#555',
          textTransform: 'uppercase'
        }}>{message}</p>
      </div>
    </div>
  );
}
