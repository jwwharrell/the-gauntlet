import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

// We're now using localStorage instead of Amplify for album operations
console.log('Using localStorage for album operations');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
