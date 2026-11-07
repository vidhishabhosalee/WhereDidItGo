import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CollegeProvider } from './context/CollegeContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <CollegeProvider>
        <App />
      </CollegeProvider>
    </AuthProvider>
  </StrictMode>,
);
