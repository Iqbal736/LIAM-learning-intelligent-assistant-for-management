import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import './App.css';

// Components
import Navbar from './components/Navbar.tsx';
import Home from './pages/Home.tsx';
import Chat from './pages/Chat.tsx';
import Faculty from './pages/Faculty.tsx';
import Courses from './pages/Courses.tsx';
import Placements from './pages/Placements.tsx';
import Infrastructure from './pages/Infrastructure.tsx';
import About from './pages/About.tsx';
import Admin from './pages/Admin.tsx';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  console.log('🚀 NEW APP.TSX LOADED - Enhanced version with routing and dark mode!');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
          <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          <main className="container mx-auto px-4 py-8">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/faculty" element={<Faculty />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/placements" element={<Placements />} />
                <Route path="/infrastructure" element={<Infrastructure />} />
                <Route path="/about" element={<About />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </AnimatePresence>
          </main>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: darkMode ? '#374151' : '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
