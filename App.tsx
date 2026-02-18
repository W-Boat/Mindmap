import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DarkModeProvider } from './lib/darkModeContext';
import { Layout } from './components/Layout';

// Pages
import { Home } from './pages/Home';
import { MindmapDetail } from './pages/MindmapDetail';
import { Upload } from './pages/Upload';
import { Editor } from './pages/Editor';

const App: React.FC = () => {
  return (
    <DarkModeProvider>
      <HashRouter>
        <Layout>
          <Routes>
            {/* Public routes - anyone can access */}
            <Route path="/" element={<Home />} />
            <Route path="/mindmaps/:id" element={<MindmapDetail />} />

            {/* Hidden upload page - accessible via secret URL */}
            <Route path="/upload/:secret" element={<Upload />} />

            {/* Public editor - anyone can create mindmaps */}
            <Route path="/create" element={<Editor />} />
            <Route path="/edit/:id" element={<Editor />} />

            {/* Fallback - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </DarkModeProvider>
  );
};

export default App;
