import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Bot, Users, BookOpen, Briefcase, Building2, Info, Moon, Sun, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import BMSCELogo from './BMSCELogo.tsx';

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ darkMode, toggleDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/', icon: Bot },
    { name: 'Chat', href: '/chat', icon: Bot },
    { name: 'Faculty', href: '/faculty', icon: Users },
    { name: 'Courses', href: '/courses', icon: BookOpen },
    { name: 'Placements', href: '/placements', icon: Briefcase },
    { name: 'Infrastructure', href: '/infrastructure', icon: Building2 },
    { name: 'About', href: '/about', icon: Info },
    { name: 'Admin', href: '/admin', icon: Shield },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/20 shadow-xl"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-4 -left-4 w-24 h-24 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{ 
            x: [0, 20, 0], 
            y: [0, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -top-4 -right-4 w-24 h-24 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{ 
            x: [0, -20, 0], 
            y: [0, 10, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo Section */}
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link to="/" className="flex items-center space-x-4 group">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <BMSCELogo 
                  size="lg" 
                  variant="creative"
                  className="transition-all duration-300"
                />
              </motion.div>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <motion.div 
            className="hidden md:flex items-center space-x-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {navigation.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to={item.href}
                    className={`relative flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 group ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:shadow-lg hover:shadow-purple-500/10'
                    }`}
                  >
                    <Icon className={`w-4 h-4 transition-all duration-300 ${
                      isActive(item.href) ? 'text-white' : 'text-purple-600 dark:text-purple-400 group-hover:scale-110'
                    }`} />
                    <span className="relative z-10">{item.name}</span>
                    {isActive(item.href) && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl"
                        layoutId="activeTab"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    {!isActive(item.href) && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
            
            {/* Dark Mode Toggle */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="ml-4"
            >
              <motion.button
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleDarkMode}
                className={`relative p-3 rounded-2xl transition-all duration-300 shadow-lg ${
                  darkMode 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-yellow-500/25' 
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 shadow-gray-500/10'
                }`}
              >
                {darkMode ? (
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Sun className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: -15 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Moon className="w-5 h-5" />
                  </motion.div>
                )}
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Mobile menu button */}
          <motion.div 
            className="md:hidden flex items-center space-x-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <motion.button
              whileHover={{ scale: 1.1, rotate: 15 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleDarkMode}
              className={`p-3 rounded-2xl transition-all duration-300 shadow-lg ${
                darkMode 
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-yellow-500/25' 
                  : 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 shadow-gray-500/10'
              }`}
            >
              {darkMode ? (
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <Sun className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  <Moon className="w-5 h-5" />
                </motion.div>
              )}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </motion.div>
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden"
        >
          <div className="px-4 pt-4 pb-6 space-y-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-white/20 dark:border-gray-700/20">
            {navigation.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`relative flex items-center space-x-3 px-4 py-3 rounded-2xl text-base font-semibold transition-all duration-300 group ${
                      isActive(item.href)
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:shadow-lg hover:shadow-purple-500/10'
                    }`}
                  >
                    <Icon className={`w-5 h-5 transition-all duration-300 ${
                      isActive(item.href) ? 'text-white' : 'text-purple-600 dark:text-purple-400 group-hover:scale-110'
                    }`} />
                    <span className="relative z-10">{item.name}</span>
                    {isActive(item.href) && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl"
                        layoutId="activeMobileTab"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    {!isActive(item.href) && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
