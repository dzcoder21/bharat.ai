import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home    from './pages/Home';
import Results from './pages/Results';
import Login   from './pages/Login';
import Signup  from './pages/Signup';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"        element={<Home />} />
          <Route path="/results" element={<Results />} />
          <Route path="/login"   element={<Login />} />
          <Route path="/signup"  element={<Signup />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
