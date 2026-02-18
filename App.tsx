import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { AdminDashboard } from './pages/AdminDashboard';
import { Editor } from './pages/Editor';

// Setup default libraries for markmap if they don't exist in global scope (polyfill-ish for demo)
// In a real environment, these would be npm installed. 
// We rely on standard React usage here.

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/new" element={<Editor />} />
          <Route path="/admin/edit/:id" element={<Editor />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
