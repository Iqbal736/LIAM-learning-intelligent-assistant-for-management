import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Bot, 
  Users, 
  BookOpen, 
  Briefcase, 
  Building2, 
  MessageCircle,
  ArrowRight,
  Sparkles,
  GraduationCap,
  TrendingUp
} from 'lucide-react';
import BMSCELogo from '../components/BMSCELogo.tsx';

const Home: React.FC = () => {
  const features = [
    {
      icon: Bot,
      title: 'AI Chat Assistant',
      description: 'Get instant answers about faculty, courses, and academic information',
      link: '/chat',
      color: 'from-purple-500 to-blue-600'
    },
    {
      icon: Users,
      title: 'Faculty Directory',
      description: 'Explore our expert faculty members and their specializations',
      link: '/faculty',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      icon: BookOpen,
      title: 'Course Catalog',
      description: 'Browse comprehensive course information and prerequisites',
      link: '/courses',
      color: 'from-indigo-500 to-purple-600'
    },
    {
      icon: Briefcase,
      title: 'Placements',
      description: 'See our placements highlights, top recruiters and packages',
      link: '/placements',
      color: 'from-cyan-500 to-blue-600'
    },
    {
      icon: Building2,
      title: 'Infrastructure',
      description: 'Discover our state-of-the-art labs and facilities',
      link: '/infrastructure',
      color: 'from-violet-500 to-purple-600'
    }
  ];

  const stats = [
    { label: 'Faculty Members', value: '20+', icon: Users },
    { label: 'Courses Available', value: '25+', icon: BookOpen },
    { label: 'Research Areas', value: '15+', icon: TrendingUp },
    { label: 'Labs & Facilities', value: '10+', icon: Building2 }
  ];

  const [placementStats, setPlacementStats] = useState<any>(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/placements/stats');
        const json = await res.json();
        setPlacementStats(json.data);
      } catch {}
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 relative overflow-hidden">
      {/* Enhanced Background Elements with Hover Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div 
          className="absolute top-0 left-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{ 
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
        <motion.div 
          className="absolute top-0 right-0 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{ 
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1, 0.8, 1]
          }}
          transition={{ 
            duration: 25, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 2
          }}
        />
        <motion.div 
          className="absolute -bottom-8 left-20 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20"
          animate={{ 
            x: [0, 50, 0],
            y: [0, -100, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 30, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 4
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-15"
          animate={{ 
            x: [0, -80, 0],
            y: [0, 80, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ 
            duration: 35, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden z-10">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex justify-center lg:justify-start mb-8"
              >
                <div className="relative">
                  <div className="w-32 h-32 bg-white/80 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl border border-white/20">
                    <BMSCELogo size="xl" variant="icon" className="drop-shadow-lg" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="mb-6"
              >
                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                  LIAM
                </h1>
                <div className="text-2xl md:text-3xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  AI Assistant
                </div>
                <div className="text-lg text-gray-600 dark:text-gray-400">
                  B.M.S. College of Engineering
                </div>
              </motion.div>
              
              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
              >
                Your intelligent companion for navigating the Artificial Intelligence and Machine Learning department. 
                Get instant answers, explore faculty, courses, and discover our cutting-edge facilities.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
              >
                <motion.div 
                  whileHover={{ scale: 1.05, y: -2 }} 
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <motion.div
                    animate={{ 
                      boxShadow: [
                        "0 10px 25px rgba(59, 130, 246, 0.3)",
                        "0 20px 40px rgba(147, 51, 234, 0.4)",
                        "0 10px 25px rgba(59, 130, 246, 0.3)"
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-lg opacity-75"
                  />
                  <Link
                    to="/chat"
                    className="relative group bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center justify-center space-x-3 shadow-2xl hover:shadow-3xl z-10"
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <MessageCircle className="w-5 h-5 group-hover:animate-pulse" />
                    </motion.div>
                    <span className="font-bold text-lg">Start Chatting with LIAM</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.div>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/about"
                    className="group bg-white/80 backdrop-blur-sm text-gray-700 px-8 py-4 rounded-2xl font-semibold hover:bg-white transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl border border-gray-200/50"
                  >
                    <GraduationCap className="w-5 h-5" />
                    <span>Learn More</span>
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
            
            {/* Right Column - Visual Elements */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative">
                {/* Main Card */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">AI-Powered Assistant</h3>
                        <p className="text-sm text-gray-600">24/7 Available</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4">
                        <Users className="w-8 h-8 text-blue-600 mb-2" />
                        <div className="text-2xl font-bold text-blue-600">19+</div>
                        <div className="text-sm text-blue-700">Faculty</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4">
                        <BookOpen className="w-8 h-8 text-purple-600 mb-2" />
                        <div className="text-2xl font-bold text-purple-600">27+</div>
                        <div className="text-sm text-purple-700">Courses</div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-green-700">AI Assistant Online</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-3 rounded-2xl shadow-lg"
                >
                  <Sparkles className="w-6 h-6" />
                </motion.div>
                
                <motion.div
                  animate={{ y: [10, -10, 10] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -bottom-4 -left-4 bg-gradient-to-r from-pink-400 to-rose-500 text-white p-3 rounded-2xl shadow-lg"
                >
                  <TrendingUp className="w-6 h-6" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm dark:bg-gray-800/50 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {placementStats && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="mb-10"
            >
              <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-3xl p-6 text-white shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="text-sm opacity-90">Placements {placementStats.year}</div>
                    <div className="text-2xl md:text-3xl font-extrabold">Outstanding Results</div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-3xl font-bold">{placementStats.totalPlacements}</div>
                      <div className="text-xs opacity-90">Total Placements</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">{placementStats.ctc?.highest ?? '—'}</div>
                      <div className="text-xs opacity-90">Highest CTC (LPA)</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">{placementStats.numCompanies}</div>
                      <div className="text-xs opacity-90">Recruiters</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold">{placementStats.fullTimeOffers}</div>
                      <div className="text-xs opacity-90">FT Offers</div>
                    </div>
                  </div>
                  <div>
                    <Link to="/placements" className="inline-flex items-center gap-2 bg-white text-purple-600 px-4 py-2 rounded-2xl font-semibold shadow-md hover:shadow-lg">
                      Explore Placements
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4">
              Department at a Glance
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover the scale and excellence of our AIML department
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div 
                  key={index} 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="group"
                >
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 group-hover:border-blue-200">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">{stat.value}</div>
                    <div className="text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 via-purple-600 to-blue-600 dark:from-white dark:via-purple-400 dark:to-blue-400 bg-clip-text text-transparent mb-6">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Comprehensive information and AI-powered assistance for all your academic needs. 
              Explore, discover, and connect with our cutting-edge resources.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.03, y: -8 }}
                  className="group"
                >
                  <Link to={feature.link}>
                    <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 h-full border border-white/20 group-hover:border-blue-200 relative overflow-hidden">
                      {/* Background Gradient */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                          <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-2 transition-all duration-300" />
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors duration-300">
                          {feature.description}
                        </p>
                        
                        {/* Hover Effect Line */}
                        <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${feature.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 dark:bg-blue-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <motion.div 
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex justify-center mb-6"
            >
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-white mb-4"
            >
              Ready to Get Started?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto"
            >
              Experience the future of academic assistance with our AI-powered platform
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/chat"
                  className="group bg-white text-blue-600 px-10 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition-all duration-300 inline-flex items-center space-x-3 shadow-lg hover:shadow-xl"
                >
                  <MessageCircle className="w-6 h-6 group-hover:animate-pulse" />
                  <span>Start Your Journey</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/about"
                  className="group bg-white/20 backdrop-blur-sm text-white px-10 py-4 rounded-2xl font-semibold hover:bg-white/30 transition-all duration-300 inline-flex items-center space-x-3 border border-white/30"
                >
                  <GraduationCap className="w-6 h-6" />
                  <span>Learn More</span>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
