import React from 'react';

export default function TestApp() {
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      marginTop: '50px'
    }}>
      <h1>🎉 App is Working! 🎉</h1>
      <p>If you can see this, React is working correctly.</p>
      <div style={{
        marginTop: '20px',
        padding: '20px',
        backgroundColor: '#f0f0f0',
        borderRadius: '5px',
        display: 'inline-block'
      }}>
        <h3>Next Steps:</h3>
        <ol style={{
          textAlign: 'left',
          display: 'inline-block',
          margin: '0 auto'
        }}>
          <li>Check the browser console for any errors</li>
          <li>Verify Firebase initialization</li>
          <li>Check network requests for failed resources</li>
        </ol>
      </div>
    </div>
  );
}
