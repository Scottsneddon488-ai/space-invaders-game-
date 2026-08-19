import React from 'react';
import ReactDOM from 'react-dom/client';
import PersonalDashboard from './PersonalDashboard.jsx';

// PersonalDashboard persists via window.storage, an API supplied by the
// hosting runtime it was designed for. Fall back to localStorage so the
// dashboard still saves data when run as a standalone app.
if (!window.storage) {
  window.storage = {
    async get(key) {
      const value = window.localStorage.getItem(key);
      return value === null ? null : { value };
    },
    async set(key, value) {
      window.localStorage.setItem(key, value);
      return true;
    },
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PersonalDashboard />
  </React.StrictMode>
);
