import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/farmalert/sw.js', { scope: '/farmalert/' })
      .catch((err) => console.error('SW registration failed:', err));
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename="/farmalert">
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
