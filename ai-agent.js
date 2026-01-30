#!/usr/bin/env node

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIMLAgent {
  constructor() {
    this.app = express();
    this.port = 5001;
    this.knowledgeBase = {};
    this.conversationHistory = new Map();
    
    // Rate limiting for Gemini API
    this.lastApiCall = 0;
    this.minApiInterval = 5000; // 5 seconds between API calls to avoid rate limits
    this.rateLimitRetries = 0;
    this.maxRetries = 3;
    
    // Initialize Google Gemini AI
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyBQmFySnKjg0GbjYHvUI6Pfpl-9e2GYYTY';
    console.log('🔑 API Key available:', !!apiKey);
    if (!apiKey) {
      console.log('❌ GEMINI_API_KEY not found in environment variables.');
      console.log('📋 Please set your API key in .env file');
      this.genAI = null;
      this.model = null;
    } else {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash",
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 800,
          }
        });
        console.log('✅ Google Gemini AI initialized successfully');
        console.log('🤖 Model object:', !!this.model);
      } catch (error) {
        console.log('❌ Error initializing Gemini:', error.message);
        this.genAI = null;
        this.model = null;
      }
    }
    
    this.setupMiddleware();
    this.loadComprehensiveData();
    this.setupRoutes();
    this.startServer();
  }

  computePlacementStats(placementsData, yearKey = null) {
    try {
      const dataset = placementsData.years && yearKey ? placementsData.years[yearKey] : placementsData;
      const isLegacy = !!dataset.tier1Placements || !!dataset.placementDetails;

      const tier1Companies = isLegacy ? (dataset.tier1Placements?.companies || []) : [];
      const tier2Companies = isLegacy ? (dataset.tier2Placements?.companies || []) : [];
      const studentsLegacy = isLegacy ? (dataset.placementDetails?.studentPlacements || []) : [];
      const studentsNew = !isLegacy ? (dataset.students || []) : [];

      const uniqueCompanies = new Set();
      tier1Companies.forEach(c => uniqueCompanies.add(c.companyName));
      tier2Companies.forEach(c => uniqueCompanies.add(c.companyName));
      if (isLegacy) {
        (dataset.placementDetails?.topRecruitingCompanies || []).forEach(c => uniqueCompanies.add(c.companyName));
      } else {
        studentsNew.forEach(s => (s.offers || []).forEach(o => uniqueCompanies.add(o.company)));
      }

      const companyOfferCounts = {};
      if (isLegacy) {
        [...tier1Companies, ...tier2Companies].forEach(c => {
          companyOfferCounts[c.companyName] = (companyOfferCounts[c.companyName] || 0) + (c.students?.length || 0);
        });
      } else {
        studentsNew.forEach(s => (s.offers || []).forEach(o => {
          companyOfferCounts[o.company] = (companyOfferCounts[o.company] || 0) + 1;
        }));
      }

      // Parse CTC numbers from details like '18.6 CTC', '11 CTC'
      const ctcValues = [];
      let internshipsCount = 0;
      let multipleOffersCount = 0;

      if (isLegacy) {
        studentsLegacy.forEach(s => {
          const details = String(s.details || '');
          const ctcMatches = [...details.matchAll(/(\d+(?:\.\d+)?)\s*CTC/gi)];
          if (ctcMatches.length > 0) ctcMatches.forEach(m => ctcValues.push(parseFloat(m[1])));
          if (/internship/i.test(details)) internshipsCount += 1;
          if (/,| and |\)|\(/.test(details) && (details.match(/CTC/gi)?.length || 0) > 1) multipleOffersCount += 1;
        });
      } else {
        studentsNew.forEach(s => {
          const offers = s.offers || [];
          if (offers.length > 1) multipleOffersCount += 1;
          offers.forEach(o => {
            if (o.ctcLpa) ctcValues.push(Number(o.ctcLpa));
            if ((o.offerType || '').toLowerCase().includes('si') || (o.stipendPerMonth || o.stipendLumpsum)) internshipsCount += 1;
          });
        });
      }

      const highestCTC = ctcValues.length ? Math.max(...ctcValues) : null;
      const lowestCTC = ctcValues.length ? Math.min(...ctcValues) : null;
      const averageCTC = ctcValues.length ? parseFloat((ctcValues.reduce((a, b) => a + b, 0) / ctcValues.length).toFixed(2)) : null;

      const totalTier1 = isLegacy ? tier1Companies.reduce((s, c) => s + (c.students?.length || 0), 0) : null;
      const totalTier2 = isLegacy ? tier2Companies.reduce((s, c) => s + (c.students?.length || 0), 0) : null;
      let totalPlacements = null;
      let fullTimeOffers = null;
      if (isLegacy) {
        const rawTotal = dataset.placementDetails?.summaryStats?.totalPlacements;
        totalPlacements = rawTotal ? parseInt(rawTotal) : (totalTier1 + totalTier2);
        const rawFull = dataset.placementDetails?.summaryStats?.fullTimeOffers;
        fullTimeOffers = rawFull ? parseInt(rawFull) : 0;
      } else {
        // For 2025 data, count unique students with at least one FT offer as placements
        const placed = new Set();
        let ftOffers = 0;
        studentsNew.forEach(s => {
          const hasFt = (s.offers || []).some(o => (o.offerType || '').toUpperCase().includes('FT'));
          if (hasFt) placed.add(s.usn || s.name);
          ftOffers += (s.offers || []).filter(o => (o.offerType || '').toUpperCase().includes('FT')).length;
        });
        totalPlacements = placed.size;
        fullTimeOffers = ftOffers;
      }

      const offersByCompany = Object.entries(companyOfferCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      return {
        year: isLegacy ? 2024 : Number(yearKey),
        totalPlacements,
        fullTimeOffers,
        internshipsCount,
        numCompanies: uniqueCompanies.size,
        tier1Offers: totalTier1,
        tier2Offers: totalTier2,
        multipleOffersCount,
        ctc: { highest: highestCTC, average: averageCTC, lowest: lowestCTC, currency: 'LPA' },
        offersByCompany,
      };
    } catch (err) {
      console.warn('Failed to compute placement stats:', err.message);
      return null;
    }
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  loadComprehensiveData() {
    try {
      console.log('🧠 Loading Comprehensive Knowledge Base...');
      
      // Load faculty data
      const facultyData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/comprehensive_faculty.json'), 'utf8'));
      this.knowledgeBase.faculty = facultyData;
      
      // Load courses data
      const coursesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/comprehensive_courses.json'), 'utf8'));
      this.knowledgeBase.courses = coursesData;
      
      // Load infrastructure data
      const infrastructureData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/comprehensive_infrastructure.json'), 'utf8'));
      this.knowledgeBase.infrastructure = infrastructureData;
      
      // Load students data
      const studentsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/comprehensive_students.json'), 'utf8'));
      this.knowledgeBase.students = studentsData;
      
      // Load calendar data
      const calendarData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/comprehensive_academic_calendar.json'), 'utf8'));
      const allEvents = [];
      if (calendarData.semesters) {
        calendarData.semesters.forEach(semester => {
          if (semester.events) {
            allEvents.push(...semester.events);
          }
        });
      }
      this.knowledgeBase.calendar = allEvents;

      // Load placements data
      try {
        const placementsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/comprehensive_placements.json'), 'utf8'));
        this.knowledgeBase.placements = placementsData;
        // Compute stats per year if provided
        const years = placementsData.years ? Object.keys(placementsData.years) : ['2024'];
        const byYear = {};
        years.forEach(y => {
          byYear[y] = this.computePlacementStats(placementsData, y);
        });
        this.knowledgeBase.placementStats = { byYear };
        this.knowledgeBase.latestPlacementYear = years.sort().slice(-1)[0];
      } catch (e) {
        console.warn('⚠️ Placements data not found or invalid, continuing without placements');
        this.knowledgeBase.placements = null;
        this.knowledgeBase.placementStats = null;
        this.knowledgeBase.latestPlacementYear = null;
      }
      
      console.log('🧠 Comprehensive Knowledge Base Built:');
      console.log(`   📊 Faculty: ${this.knowledgeBase.faculty.length} members`);
      console.log(`   📚 Courses: ${this.knowledgeBase.courses.length} courses`);
      console.log(`   🏢 Infrastructure: ${this.knowledgeBase.infrastructure.labs.length} labs`);
      console.log(`   👥 Students: ${this.knowledgeBase.students.totalStudents} students`);
      console.log(`   📅 Calendar: ${this.knowledgeBase.calendar.length} events`);
      if (this.knowledgeBase.placements) {
        const latest = this.knowledgeBase.latestPlacementYear;
        const stat = this.knowledgeBase.placementStats?.byYear?.[latest];
        if (stat) {
          console.log(`   💼 Placements ${latest}: ${stat.totalPlacements} (Tier-1: ${stat.tier1Offers || '—'}, Tier-2: ${stat.tier2Offers || '—'})`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error loading knowledge base:', error.message);
      process.exit(1);
    }
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    // Faculty routes
    this.app.get('/api/faculty', (req, res) => {
      const { search, designation, specialization, researchArea } = req.query;
      
      let filteredFaculty = this.knowledgeBase.faculty;
      
      // Search by name, specialization, or research areas
      if (search) {
        const searchTerm = search.toLowerCase();
        filteredFaculty = filteredFaculty.filter(faculty => 
          faculty.name.toLowerCase().includes(searchTerm) ||
          (faculty.specialization && Array.isArray(faculty.specialization) && 
           faculty.specialization.some(spec => spec.toLowerCase().includes(searchTerm))) ||
          (faculty.researchAreas && Array.isArray(faculty.researchAreas) && 
           faculty.researchAreas.some(area => area.toLowerCase().includes(searchTerm)))
        );
      }
      
      // Filter by designation
      if (designation) {
        filteredFaculty = filteredFaculty.filter(faculty => 
          faculty.designation && faculty.designation.toLowerCase().includes(designation.toLowerCase())
        );
      }
      
      // Filter by specialization
      if (specialization) {
        filteredFaculty = filteredFaculty.filter(faculty => 
          faculty.specialization && Array.isArray(faculty.specialization) && 
          faculty.specialization.some(spec => spec.toLowerCase().includes(specialization.toLowerCase()))
        );
      }
      
      // Filter by research area
      if (researchArea) {
        filteredFaculty = filteredFaculty.filter(faculty => 
          faculty.researchAreas && Array.isArray(faculty.researchAreas) && 
          faculty.researchAreas.some(area => area.toLowerCase().includes(researchArea.toLowerCase()))
        );
      }
      
      res.json({ data: filteredFaculty });
    });

    this.app.get('/api/faculty/stats/overview', (req, res) => {
      const stats = {
        total: this.knowledgeBase.faculty.length,
        professors: this.knowledgeBase.faculty.filter(f => f.designation.includes('Professor')).length,
        associateProfessors: this.knowledgeBase.faculty.filter(f => f.designation.includes('Associate')).length,
        assistantProfessors: this.knowledgeBase.faculty.filter(f => f.designation.includes('Assistant')).length
      };
      res.json({ data: stats });
    });

    // Courses routes
    this.app.get('/api/courses', (req, res) => {
      const { search, semester, instructor, credits } = req.query;
      
      let filteredCourses = this.knowledgeBase.courses;
      
      // Search by name, code, or instructor
      if (search) {
        const searchTerm = search.toLowerCase();
        filteredCourses = filteredCourses.filter(course => 
          course.name.toLowerCase().includes(searchTerm) ||
          course.code.toLowerCase().includes(searchTerm) ||
          (course.instructor && course.instructor.toLowerCase().includes(searchTerm)) ||
          (course.topics && Array.isArray(course.topics) && 
           course.topics.some(topic => topic.toLowerCase().includes(searchTerm)))
        );
      }
      
      // Filter by semester
      if (semester) {
        filteredCourses = filteredCourses.filter(course => 
          course.semester === semester
        );
      }
      
      // Filter by instructor
      if (instructor) {
        filteredCourses = filteredCourses.filter(course => 
          course.instructor && course.instructor.toLowerCase().includes(instructor.toLowerCase())
        );
      }
      
      // Filter by credits
      if (credits) {
        filteredCourses = filteredCourses.filter(course => 
          course.credits === parseInt(credits)
        );
      }
      
      res.json({ data: filteredCourses });
    });

    this.app.get('/api/courses/stats/overview', (req, res) => {
      const stats = {
        total: this.knowledgeBase.courses.length,
        semesters: new Set(this.knowledgeBase.courses.map(c => c.semester)).size,
        totalCredits: this.knowledgeBase.courses.reduce((sum, c) => sum + c.credits, 0)
      };
      res.json({ data: stats });
    });

    // Infrastructure routes
    this.app.get('/api/infrastructure', (req, res) => {
      res.json({ data: this.knowledgeBase.infrastructure });
    });

    // Calendar routes
    this.app.get('/api/calendar', (req, res) => {
      // Return the full calendar object, not just events
      const calendarData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/comprehensive_academic_calendar.json'), 'utf8'));
      res.json({ data: calendarData });
    });

    // Placements routes
    this.app.get('/api/placements', (req, res) => {
      if (!this.knowledgeBase.placements) {
        return res.status(404).json({ error: 'Placements data not available' });
      }
      res.json({ data: this.knowledgeBase.placements });
    });

    this.app.put('/api/placements', (req, res) => {
      try {
        const newData = req.body;
        if (typeof newData !== 'object' || !newData) {
          return res.status(400).json({ error: 'Invalid placements payload' });
        }
        const filePath = path.join(__dirname, 'data/comprehensive_placements.json');
        fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
        // Reload in-memory structures
        this.knowledgeBase.placements = newData;
        const years = newData.years ? Object.keys(newData.years) : [];
        const byYear = {};
        years.forEach(y => {
          byYear[y] = this.computePlacementStats(newData, y);
        });
        this.knowledgeBase.placementStats = { byYear };
        this.knowledgeBase.latestPlacementYear = years.sort().slice(-1)[0] || null;
        return res.json({ success: true });
      } catch (e) {
        console.error('Failed to save placements:', e);
        return res.status(500).json({ error: 'Failed to save placements' });
      }
    });

    this.app.get('/api/placements/stats', (req, res) => {
      if (!this.knowledgeBase.placementStats) {
        return res.status(404).json({ error: 'Placement stats not available' });
      }
      const { year } = req.query;
      const byYear = this.knowledgeBase.placementStats.byYear || {};
      if (year && byYear[String(year)]) {
        return res.json({ data: byYear[String(year)] });
      }
      // default: latest year
      const years = Object.keys(byYear).sort();
      const latest = years[years.length - 1];
      return res.json({ data: byYear[latest] });
    });

    // AI Chat route
    this.app.post('/api/ai/chat', async (req, res) => {
      try {
        const { message, sessionId = 'default' } = req.body;
        
        if (!message || !message.trim()) {
          return res.status(400).json({ error: 'Message is required' });
        }

        const response = await this.generateIntelligentResponse(message, sessionId);
        res.json({ data: response });
        
      } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Help route
    this.app.get('/api/ai/help', (req, res) => {
      res.json({
        data: {
          capabilities: [
            { category: 'Faculty Information', description: 'Get details about faculty members, their specializations, and contact information' },
            { category: 'Course Information', description: 'Access course details, prerequisites, and semester-wise information' },
            { category: 'Infrastructure', description: 'Learn about labs, equipment, and facilities available' },
            { category: 'Academic Calendar', description: 'Check exam schedules, holidays, and important dates' },
            { category: 'Department Information', description: 'Get information about the AIML department, location, and vision' }
          ]
        }
      });
    });

    // Faculty CRUD routes
    this.app.post('/api/faculty', (req, res) => {
      try {
        const newFaculty = {
          id: `faculty_${Date.now()}`,
          ...req.body,
          createdAt: new Date().toISOString()
        };
        
        this.knowledgeBase.faculty.push(newFaculty);
        this.saveFacultyData();
        
        res.status(201).json({
          success: true,
          data: newFaculty
        });
      } catch (error) {
        console.error('Error creating faculty:', error);
        res.status(500).json({ error: 'Failed to create faculty member' });
      }
    });

    this.app.put('/api/faculty/:id', (req, res) => {
      try {
        const facultyIndex = this.knowledgeBase.faculty.findIndex(f => f.id === req.params.id);
        
        if (facultyIndex === -1) {
          return res.status(404).json({
            success: false,
            message: 'Faculty member not found'
          });
        }
        
        this.knowledgeBase.faculty[facultyIndex] = {
          ...this.knowledgeBase.faculty[facultyIndex],
          ...req.body,
          updatedAt: new Date().toISOString()
        };
        
        this.saveFacultyData();
        
        res.json({
          success: true,
          data: this.knowledgeBase.faculty[facultyIndex]
        });
      } catch (error) {
        console.error('Error updating faculty:', error);
        res.status(500).json({ error: 'Failed to update faculty member' });
      }
    });

    this.app.delete('/api/faculty/:id', (req, res) => {
      try {
        const facultyIndex = this.knowledgeBase.faculty.findIndex(f => f.id === req.params.id);
        
        if (facultyIndex === -1) {
          return res.status(404).json({
            success: false,
            message: 'Faculty member not found'
          });
        }
        
        const deletedFaculty = this.knowledgeBase.faculty.splice(facultyIndex, 1)[0];
        this.saveFacultyData();
        
        res.json({
          success: true,
          data: deletedFaculty
        });
      } catch (error) {
        console.error('Error deleting faculty:', error);
        res.status(500).json({ error: 'Failed to delete faculty member' });
      }
    });

    // Courses CRUD routes
    this.app.post('/api/courses', (req, res) => {
      try {
        const newCourse = {
          id: `course_${Date.now()}`,
          ...req.body,
          createdAt: new Date().toISOString()
        };
        
        this.knowledgeBase.courses.push(newCourse);
        this.saveCoursesData();
        
        res.status(201).json({
          success: true,
          data: newCourse
        });
      } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ error: 'Failed to create course' });
      }
    });

    this.app.put('/api/courses/:id', (req, res) => {
      try {
        const courseIndex = this.knowledgeBase.courses.findIndex(c => c.id === req.params.id);
        
        if (courseIndex === -1) {
          return res.status(404).json({
            success: false,
            message: 'Course not found'
          });
        }
        
        this.knowledgeBase.courses[courseIndex] = {
          ...this.knowledgeBase.courses[courseIndex],
          ...req.body,
          updatedAt: new Date().toISOString()
        };
        
        this.saveCoursesData();
        
        res.json({
          success: true,
          data: this.knowledgeBase.courses[courseIndex]
        });
      } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ error: 'Failed to update course' });
      }
    });

    this.app.delete('/api/courses/:id', (req, res) => {
      try {
        const courseIndex = this.knowledgeBase.courses.findIndex(c => c.id === req.params.id);
        
        if (courseIndex === -1) {
          return res.status(404).json({
            success: false,
            message: 'Course not found'
          });
        }
        
        const deletedCourse = this.knowledgeBase.courses.splice(courseIndex, 1)[0];
        this.saveCoursesData();
        
        res.json({
          success: true,
          data: deletedCourse
        });
      } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ error: 'Failed to delete course' });
      }
    });
  }

  async generateIntelligentResponse(userMessage, sessionId) {
    const intent = this.analyzeUserIntent(userMessage);
    const extractedInfo = this.extractKeyInformation(userMessage);
    
    // Get conversation history
    const conversationHistory = this.conversationHistory.get(sessionId) || [];
    
    // Try Gemini first if available
    console.log('🔍 Model available:', !!this.model);
    if (this.model) {
      try {
        console.log('🤖 Attempting Gemini response...');
        const geminiResponse = await this.generateGeminiResponse(userMessage, intent, extractedInfo, conversationHistory);
        if (geminiResponse) {
          console.log('✅ Gemini response successful');
          this.updateConversationHistory(sessionId, userMessage, geminiResponse.response);
          return geminiResponse;
        } else {
          console.log('❌ Gemini returned null, using enhanced fallback');
        }
      } catch (error) {
        console.log('❌ Gemini error:', error.message);
        // For student queries, try Gemini again with a simpler prompt
        if (intent === 'student_query') {
          try {
            console.log('🔄 Retrying Gemini for student query...');
            const retryResponse = await this.generateGeminiResponse(userMessage, intent, extractedInfo, conversationHistory);
            if (retryResponse) {
              console.log('✅ Gemini retry successful');
              this.updateConversationHistory(sessionId, userMessage, retryResponse.response);
              return retryResponse;
            }
          } catch (retryError) {
            console.log('❌ Gemini retry failed:', retryError.message);
          }
        }
        console.log('Using enhanced fallback response');
      }
    } else {
      console.log('❌ Gemini model not available, using enhanced fallback');
    }
    
    // Enhanced fallback response with more intelligence
    const fallbackResponse = this.generateIntelligentFallbackResponse(userMessage, intent, extractedInfo, sessionId);
    this.updateConversationHistory(sessionId, userMessage, fallbackResponse.response);
    return fallbackResponse;
  }

  // Rate limiting method
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCall;
    
    if (timeSinceLastCall < this.minApiInterval) {
      const waitTime = this.minApiInterval - timeSinceLastCall;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms before next API call`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastApiCall = Date.now();
  }

  // Exponential backoff retry method
  async retryWithBackoff(fn, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (error.message.includes('HTTP 429') && attempt < maxRetries) {
          const backoffTime = Math.pow(2, attempt) * 5000; // More conservative exponential backoff (5s, 10s, 20s)
          console.log(`🔄 Rate limit hit, retrying in ${backoffTime}ms (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          continue;
        }
        throw error;
      }
    }
  }

  async generateGeminiResponse(userMessage, intent, extractedInfo, conversationHistory) {
    // Apply rate limiting
    await this.waitForRateLimit();
    
    const context = this.createComprehensiveContext();
    const conversationContext = conversationHistory.length > 0 
      ? `\n\nCONVERSATION HISTORY:\n${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}`
      : '';

    const prompt = `You are LIAM, an AI assistant for the AIML Department at BMSCE. Provide ChatGPT-quality responses that are concise, relevant, and perfectly formatted.

DEPARTMENT DATA (use when relevant):
FACULTY DATA:
${context.faculty.map(f => `
- ${f.name}
  Designation: ${f.designation}
  Email: ${f.email}
  Phone: ${f.phone || 'Not specified'}
  Office: ${f.office || 'Department of AIML'}
  Specialization: ${Array.isArray(f.specialization) ? f.specialization.join(', ') : f.specialization}
  Research Areas: ${Array.isArray(f.researchAreas) ? f.researchAreas.join(', ') : 'Not specified'}
  Qualifications: ${Array.isArray(f.qualifications) ? f.qualifications.join(', ') : 'Not specified'}
`).join('')}

COURSES DATA:
${context.courses.map(c => `
- ${c.name}
  Code: ${c.code}
  Semester: ${c.semester}
  Credits: ${c.credits}
  Instructor: ${c.instructor || 'TBA'}
  Prerequisites: ${Array.isArray(c.prerequisites) ? c.prerequisites.join(', ') : c.prerequisites}
  Description: ${c.description}
  Course Type: ${c.courseType}
  Contact Hours: ${c.contactHours}
  Examination: CIE ${c.examination.cieMarks} marks, SEE ${c.examination.seeMarks} marks
`).join('')}

INFRASTRUCTURE DATA:
Department Location: ${context.infrastructure.location ? `${context.infrastructure.location.building}, ${context.infrastructure.location.floor} - ${context.infrastructure.location.description}` : 'PJ Block, 7th Floor - All labs, classrooms, and faculty staff rooms are located here'}

${context.infrastructure.labs.map(lab => `
- ${lab.name}
  Capacity: ${lab.capacity} students
  Location: ${lab.location}
  Equipment: ${lab.equipment.map(eq => `${eq.name} (${eq.quantity} units) - ${eq.specifications}`).join(', ')}
  Facilities: ${lab.facilities.join(', ')}
  Availability: ${lab.availability}
  Special Features: ${lab.specialFeatures.join(', ')}
`).join('')}

PLACEMENTS DATA:
${context.placementStats && context.latestPlacementYear ? `
LATEST YEAR: ${context.latestPlacementYear}
• Total Placements: ${context.placementStats.byYear[context.latestPlacementYear]?.totalPlacements}
• Full-time Offers: ${context.placementStats.byYear[context.latestPlacementYear]?.fullTimeOffers}
• Companies: ${context.placementStats.byYear[context.latestPlacementYear]?.numCompanies}
• Highest/Avg/Lowest CTC (LPA): ${context.placementStats.byYear[context.latestPlacementYear]?.ctc?.highest}/${context.placementStats.byYear[context.latestPlacementYear]?.ctc?.average}/${context.placementStats.byYear[context.latestPlacementYear]?.ctc?.lowest}
• Tier-1 vs Tier-2 Offers: ${context.placementStats.byYear[context.latestPlacementYear]?.tier1Offers || '—'} vs ${context.placementStats.byYear[context.latestPlacementYear]?.tier2Offers || '—'}
TOP RECRUITERS (by offers):
${(context.placementStats.byYear[context.latestPlacementYear]?.offersByCompany || []).slice(0,10).map(c => `• ${c.name} - ${c.value}`).join('\n')}
` : 'Placements data not available'}

STUDENTS DATA:
Total Students: ${context.students.totalStudents}
Batch-wise Distribution:
- 2022 Batch (7th Semester): ${context.students.batches['2022'].totalStudents} students
- 2023 Batch (5th Semester): ${context.students.batches['2023'].totalStudents} students  
- 2024 Batch (3rd Semester): ${context.students.batches['2024'].totalStudents} students
- Lateral Entry Students: ${context.students.lateralEntryStudents.totalStudents} students

COMPLETE STUDENT LISTS BY BATCH:

2022 BATCH (7th Semester - ${context.students.batches['2022'].totalStudents} students):
${context.students.batches['2022'].students.map(s => `• ${s.name} (USN: ${s.usn})`).join('\n')}

2023 BATCH (5th Semester - ${context.students.batches['2023'].totalStudents} students):
${context.students.batches['2023'].students.map(s => `• ${s.name} (USN: ${s.usn})`).join('\n')}

2024 BATCH (3rd Semester - ${context.students.batches['2024'].totalStudents} students):
${context.students.batches['2024'].students.map(s => `• ${s.name} (USN: ${s.usn})`).join('\n')}

LATERAL ENTRY STUDENTS (${context.students.lateralEntryStudents.totalStudents} students):
${context.students.lateralEntryStudents.students.map(s => `• ${s.name} (USN: ${s.usn}) - ${s.remarks}`).join('\n')}

STUDENT QUERY HANDLING INSTRUCTIONS:
- For USN queries: Search through ALL batches and lateral entry students
- For name queries: Search through ALL batches and lateral entry students  
- For batch queries: Use the complete list provided above
- For semester queries: Map 3rd sem=2024 batch, 5th sem=2023 batch, 7th sem=2022 batch
- For count queries: Use the exact numbers provided
- For validation queries: Check if USN exists in any batch
- For "first N" queries: Show first N students from specified batch
- For "starting with" queries: Find students whose names start with specified letter
- For "ending with" queries: Find students whose USN ends with specified pattern
- Always provide complete and accurate information from the data above

${conversationContext}

USER QUESTION: ${userMessage}
DETECTED INTENT: ${intent}
EXTRACTED INFO: ${JSON.stringify(extractedInfo)}

CRITICAL INSTRUCTIONS:
1. Answer what is asked with sufficient detail - be informative and relevant
2. Use formal, professional tone like ChatGPT
3. Format responses with proper bullet points using • symbol
4. Provide comprehensive information - maximum 8-10 bullet points
5. For department queries, use exact data provided above
6. For general questions, provide accurate, detailed answers
7. Include relevant context and additional useful information
8. Always provide 2-3 relevant follow-up suggestions
9. Use **bold** for important headers and key information
10. Structure information clearly with proper spacing and organization

RESPONSE FORMAT:
[Direct answer to the question with bullet points]

SUGGESTED FOLLOW-UP QUESTIONS:
• [Question 1]
• [Question 2]
• [Question 3]

RESPONSE:`;

    try {
      console.log('📤 Sending prompt to Gemini via REST API...');
      
      // Use REST API directly with retry logic
      const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyBQmFySnKjg0GbjYHvUI6Pfpl-9e2GYYTY';
      
      // Try multiple models - using models available for this API key
      const modelConfigs = [
        { model: 'gemini-2.5-flash', version: 'v1beta' },
        { model: 'gemini-2.5-pro', version: 'v1beta' },
        { model: 'gemini-2.0-flash', version: 'v1beta' },
        { model: 'gemini-2.0-flash-exp', version: 'v1beta' },
      ];
      let response = null;
      let lastError = null;
      
      for (const { model: modelName, version } of modelConfigs) {
        try {
          console.log(`🔄 Trying model: ${modelName} (${version})...`);
          response = await this.retryWithBackoff(async () => {
            const apiResponse = await fetch(`https://generativelanguage.googleapis.com/${version}/models/${modelName}:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: prompt
                  }]
                }],
                generationConfig: {
                  temperature: 0.7,
                  topP: 0.9,
                  maxOutputTokens: 800,
                }
              })
            });

            if (!apiResponse.ok) {
              let errorMsg = `HTTP ${apiResponse.status}: ${apiResponse.statusText}`;
              try {
                const errorData = await apiResponse.json();
                if (errorData.error && errorData.error.message) {
                  errorMsg += ` - ${errorData.error.message}`;
                }
              } catch (e) {
                // If JSON parsing fails, just use status text
              }
              throw new Error(errorMsg);
            }
            
            return apiResponse;
          });
          console.log(`✅ Successfully connected to ${modelName} (${version})`);
          break; // Success, exit the loop
        } catch (error) {
          console.log(`❌ ${modelName} failed: ${error.message}`);
          lastError = error;
          response = null;
          // Continue to next model
        }
      }
      
      if (!response) {
        throw lastError || new Error('All Gemini models failed');
      }

      const data = await response.json();
      
      // Log the full response structure for debugging
      if (!data.candidates || !data.candidates[0]) {
        console.error('❌ Gemini API response structure error:', JSON.stringify(data, null, 2));
        return null;
      }
      
      if (data.candidates[0].finishReason && data.candidates[0].finishReason !== 'STOP') {
        console.error('❌ Gemini API finish reason:', data.candidates[0].finishReason, data.candidates[0].safetyRatings);
        return null;
      }
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        const text = data.candidates[0].content.parts[0].text;
        
        console.log('📥 Received response from Gemini:', text.substring(0, 100) + '...');
        
        // Reset rate limit retries on successful call
        this.rateLimitRetries = 0;
        
        // Parse the response to extract main answer and suggestions
        const parts = text.split('SUGGESTED FOLLOW-UP QUESTIONS:');
        const mainResponse = parts[0].trim();
        const suggestionsText = parts[1] ? parts[1].trim() : '';
        
        let suggestions = [];
        if (suggestionsText) {
          suggestions = suggestionsText
            .split('\n')
            .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
            .filter(line => line.length > 0)
            .slice(0, 3);
        }
        
        // If no suggestions found, provide default ones based on intent
        if (suggestions.length === 0) {
          switch (intent) {
            case 'greeting':
              suggestions = [
                "Tell me about the faculty members",
                "What courses are available in 5th semester?",
                "Show me the lab facilities"
              ];
              break;
            case 'faculty_listing':
            case 'faculty_query':
              suggestions = [
                "Tell me about more faculty members",
                "What are the research areas in the department?",
                "Show me faculty by specialization"
              ];
              break;
            case 'course_query':
            case 'semester_course_query':
              suggestions = [
                "Show me courses by semester",
                "Tell me about 5th semester courses",
                "What are the core courses?"
              ];
              break;
            case 'infrastructure_query':
            case 'lab_query':
              suggestions = [
                "Tell me about specific lab equipment",
                "What are the lab timings?",
                "Show me research facilities"
              ];
              break;
            case 'calendar_query':
              suggestions = [
                "Show me all events this month",
                "Tell me about exam dates",
                "What are the important deadlines?"
              ];
              break;
            default:
              suggestions = [
                "Tell me about the AIML department",
                "What courses do you offer?",
                "Show me the faculty members"
              ];
          }
        }
        
        return {
          response: mainResponse,
          suggestions: suggestions,
          intent: intent,
          extractedInfo: extractedInfo,
          source: 'gemini'
        };
      }
    } catch (error) {
      console.error('❌ Gemini REST API error:', error);
      console.error('Error details:', error.message);
    }
    
    return null;
  }

  generateIntelligentFallbackResponse(userMessage, intent, extractedInfo, sessionId) {
    const context = this.createComprehensiveContext();
    const lowerMessage = userMessage.toLowerCase();
    let response = '';
    let suggestions = [];
    
    // Enhanced context-aware responses
    switch (intent) {
      case 'placements_query': {
        if (!context.placements) {
          return {
            response: 'Placements data is currently unavailable.',
            suggestions: ['Show faculty information', 'Show courses', 'Show infrastructure'],
            intent,
            extractedInfo,
            source: 'intelligent_fallback'
          };
        }

        const tier1 = context.placements.tier1Placements?.companies || [];
        const tier2 = context.placements.tier2Placements?.companies || [];
        const totalTier1 = tier1.reduce((s, c) => s + (c.students?.length || 0), 0);
        const totalTier2 = tier2.reduce((s, c) => s + (c.students?.length || 0), 0);
        const summary = context.placements.placementDetails2024?.summaryStats || {};
        const topCompanies = context.placements.placementDetails2024?.topRecruitingCompanies || [];

        let topList = topCompanies.map(c => `• ${c.companyName}${c.offersMade ? ` - ${c.offersMade} offers` : ''}`).slice(0, 8).join('\n');
        if (!topList) {
          const combined = [...tier1, ...tier2]
            .sort((a,b) => (b.students?.length||0) - (a.students?.length||0))
            .slice(0,8)
            .map(c => `• ${c.companyName} - ${(c.students?.length||0)} offers`)
            .join('\n');
          topList = combined;
        }

        const response = `**AIML Placements Highlights (2024):**\n\n`+
          `• Total Placements: ${summary.totalPlacements || (totalTier1 + totalTier2)}\n`+
          `• Full-time Offers: ${summary.fullTimeOffers || '—'}\n`+
          `• Tier-1 Offers: ${totalTier1}\n`+
          `• Tier-2 Offers: ${totalTier2}\n\n`+
          `**Top Recruiters:**\n${topList}\n\n`+
          `Our students secured roles across leading product and services companies with excellent compensation packages and strong internship-to-ppo conversions.`;

        const suggestions = [
          'Show Tier-1 companies and selected students',
          'Show Tier-2 companies and offers count',
          'Who got the highest package?'
        ];

        return { response, suggestions, intent, extractedInfo, source: 'intelligent_fallback' };
      }
             case 'greeting':
               response = `Hello! I'm LIAM, the AI assistant for the AIML Department at BMSCE. I can help you with:

• Faculty information and research areas
• Course details and prerequisites
• Lab facilities and equipment
• Academic calendar and events

What would you like to know?`;

               suggestions = [
                 "Tell me about the faculty members",
                 "What courses are available in 5th semester?",
                 "Show me the lab facilities"
               ];
               break;
        
      case 'faculty_query':
      case 'faculty_listing':
        const facultyQuery = lowerMessage;
        let facultyResults = [];
        
        if (facultyQuery.includes('hod') || facultyQuery.includes('head')) {
          facultyResults = context.faculty.filter(f => 
            f.designation.toLowerCase().includes('hod') || 
            f.designation.toLowerCase().includes('head')
          );
        } else if (facultyQuery.includes('professor') || facultyQuery.includes('prof')) {
          facultyResults = context.faculty.filter(f => 
            f.designation.toLowerCase().includes('professor')
          );
        } else if (facultyQuery.includes('assistant')) {
          facultyResults = context.faculty.filter(f => 
            f.designation.toLowerCase().includes('assistant')
          );
        } else {
          // Search by name or specialization
          facultyResults = context.faculty.filter(f => 
            f.name.toLowerCase().includes(facultyQuery) ||
            (Array.isArray(f.specialization) && f.specialization.some(s => s.toLowerCase().includes(facultyQuery))) ||
            (Array.isArray(f.researchAreas) && f.researchAreas.some(r => r.toLowerCase().includes(facultyQuery)))
          );
        }
        
               if (facultyResults.length > 0) {
                 response = `**Faculty Members Found:**\n\n`;
                 facultyResults.slice(0, 3).forEach(faculty => {
                   response += `**${faculty.name}**\n`;
                   response += `• Designation: ${faculty.designation}\n`;
                   response += `• Email: ${faculty.email}\n`;
                   response += `• Phone: ${faculty.phone || 'Not specified'}\n`;
                   response += `• Office: ${faculty.office || 'Department of AIML'}\n`;
                   response += `• Specialization: ${faculty.specialization.join(', ')}\n`;
                   response += `• Research Areas: ${faculty.researchAreas.join(', ')}\n\n`;
                 });

                 suggestions = [
                   "Tell me about more faculty members",
                   "What are the research areas in the department?",
                   "Show me faculty by specialization"
                 ];
               } else {
                 response = `**Available Faculty Members:**\n\n`;
                 context.faculty.slice(0, 3).forEach(faculty => {
                   response += `• **${faculty.name}** - ${faculty.designation}\n`;
                 });

                 suggestions = [
                   "Show me all faculty members",
                   "Tell me about professors",
                   "What are the research areas?"
                 ];
               }
        break;
        
      case 'course_query':
      case 'semester_course_query':
        const courseQuery = lowerMessage;
        let courseResults = [];
        
        if (courseQuery.includes('semester')) {
          const semesterMatch = courseQuery.match(/(\d+)/);
          if (semesterMatch) {
            const semester = semesterMatch[1];
            courseResults = context.courses.filter(c => c.semester.includes(semester));
          }
        } else if (extractedInfo.semester) {
          const semester = extractedInfo.semester;
          courseResults = context.courses.filter(c => c.semester.includes(semester));
        } else if (courseQuery.includes('credit')) {
          const creditMatch = courseQuery.match(/(\d+)/);
          if (creditMatch) {
            const credits = parseInt(creditMatch[1]);
            courseResults = context.courses.filter(c => c.credits === credits);
          }
        } else {
          courseResults = context.courses.filter(c => 
            c.name.toLowerCase().includes(courseQuery) ||
            c.code.toLowerCase().includes(courseQuery) ||
            c.instructor.toLowerCase().includes(courseQuery)
          );
        }
        
               if (courseResults.length > 0) {
                 response = `**Courses Found:**\n\n`;
                 courseResults.slice(0, 3).forEach(course => {
                   response += `**${course.name} (${course.code})**\n`;
                   response += `• Semester: ${course.semester}\n`;
                   response += `• Credits: ${course.credits}\n`;
                   response += `• Instructor: ${course.instructor}\n`;
                   response += `• Course Type: ${course.courseType}\n`;
                   response += `• Contact Hours: ${course.contactHours}\n`;
                   response += `• Prerequisites: ${Array.isArray(course.prerequisites) ? course.prerequisites.join(', ') : course.prerequisites}\n\n`;
                 });

                 suggestions = [
                   "Show me courses by semester",
                   "Tell me about 5th semester courses",
                   "What are the core courses?"
                 ];
               } else {
                 response = `**Available Courses:**\n\n`;
                 context.courses.slice(0, 3).forEach(course => {
                   response += `• **${course.name}** (${course.code}) - Semester ${course.semester}\n`;
                 });

                 suggestions = [
                   "Show me all courses",
                   "Tell me about 5th semester courses",
                   "What are the core subjects?"
                 ];
               }
        break;
        
      case 'student_query':
      case 'student_listing':
        const studentQuery = lowerMessage;
        let studentResults = [];
        let studentResponse = '';
        
        // Handle different types of student queries
        if (studentQuery.includes('usn') || /1bm\d{2}ai\d{3}/i.test(studentQuery)) {
          // USN-based search
          const usnMatch = studentQuery.match(/1bm\d{2}ai\d{3}/i);
          if (usnMatch) {
            const usn = usnMatch[0].toUpperCase();
            // Search in all batches
            for (const batchKey in context.students.batches) {
              const batch = context.students.batches[batchKey];
              const found = batch.students.find(s => s.usn === usn);
              if (found) {
                studentResults = [found];
                break;
              }
            }
            // Also check lateral entry
            if (studentResults.length === 0) {
              const found = context.students.lateralEntryStudents.students.find(s => s.usn === usn);
              if (found) studentResults = [found];
            }
          }
        } else if (studentQuery.includes('name') || studentQuery.includes('aashish') || studentQuery.includes('rahul')) {
          // Name-based search
          const nameQuery = studentQuery.replace(/name|student|find|search|show|list/gi, '').trim();
          for (const batchKey in context.students.batches) {
            const batch = context.students.batches[batchKey];
            const found = batch.students.filter(s => 
              s.name.toLowerCase().includes(nameQuery) || 
              s.name.toLowerCase().startsWith(nameQuery)
            );
            studentResults.push(...found);
          }
          // Also check lateral entry
          const lateralFound = context.students.lateralEntryStudents.students.filter(s => 
            s.name.toLowerCase().includes(nameQuery) || 
            s.name.toLowerCase().startsWith(nameQuery)
          );
          studentResults.push(...lateralFound);
        } else if (studentQuery.includes('batch') || studentQuery.includes('2022') || studentQuery.includes('2023') || studentQuery.includes('2024')) {
          // Batch-based search
          if (studentQuery.includes('2022')) {
            studentResults = context.students.batches['2022'].students;
          } else if (studentQuery.includes('2023')) {
            studentResults = context.students.batches['2023'].students;
          } else if (studentQuery.includes('2024')) {
            studentResults = context.students.batches['2024'].students;
          }
        } else if (studentQuery.includes('semester') || studentQuery.includes('sem')) {
          // Semester-based search
          if (studentQuery.includes('3rd') || studentQuery.includes('3')) {
            studentResults = context.students.batches['2024'].students;
          } else if (studentQuery.includes('5th') || studentQuery.includes('5')) {
            studentResults = context.students.batches['2023'].students;
          } else if (studentQuery.includes('7th') || studentQuery.includes('7')) {
            studentResults = context.students.batches['2022'].students;
          }
        } else if (studentQuery.includes('lateral')) {
          // Lateral entry students
          studentResults = context.students.lateralEntryStudents.students;
        } else if (studentQuery.includes('count') || studentQuery.includes('how many') || studentQuery.includes('total')) {
          // Count queries
          const totalStudents = context.students.totalStudents;
          const batch2022 = context.students.batches['2022'].totalStudents;
          const batch2023 = context.students.batches['2023'].totalStudents;
          const batch2024 = context.students.batches['2024'].totalStudents;
          const lateral = context.students.lateralEntryStudents.totalStudents;
          
          studentResponse = `**Student Count Summary:**\n\n`;
          studentResponse += `• **Total Students:** ${totalStudents}\n`;
          studentResponse += `• **2022 Batch (7th Sem):** ${batch2022} students\n`;
          studentResponse += `• **2023 Batch (5th Sem):** ${batch2023} students\n`;
          studentResponse += `• **2024 Batch (3rd Sem):** ${batch2024} students\n`;
          studentResponse += `• **Lateral Entry:** ${lateral} students\n`;
          
          if (studentQuery.includes('difference') && studentQuery.includes('2022') && studentQuery.includes('2023')) {
            const diff = Math.abs(batch2023 - batch2022);
            studentResponse += `\n**Difference between 2022 and 2023 batches:** ${diff} students\n`;
          }
        } else if (studentQuery.includes('first') || studentQuery.includes('starting')) {
          // First N students or students starting with letter
          if (studentQuery.includes('5') || studentQuery.includes('first')) {
            if (studentQuery.includes('2024')) {
              studentResults = context.students.batches['2024'].students.slice(0, 5);
            } else if (studentQuery.includes('2023')) {
              studentResults = context.students.batches['2023'].students.slice(0, 5);
            } else if (studentQuery.includes('2022')) {
              studentResults = context.students.batches['2022'].students.slice(0, 5);
            }
          }
          // Students starting with specific letter
          const letterMatch = studentQuery.match(/starting.*?['"]([a-z])['"]/i);
          if (letterMatch) {
            const letter = letterMatch[1].toUpperCase();
            for (const batchKey in context.students.batches) {
              const batch = context.students.batches[batchKey];
              const found = batch.students.filter(s => s.name.startsWith(letter));
              studentResults.push(...found);
            }
          }
        } else if (studentQuery.includes('ending') || studentQuery.includes('usn.*050')) {
          // USN ending with specific pattern
          const endingMatch = studentQuery.match(/ending.*?(\d{3})/i);
          if (endingMatch) {
            const ending = endingMatch[1];
            for (const batchKey in context.students.batches) {
              const batch = context.students.batches[batchKey];
              const found = batch.students.filter(s => s.usn.endsWith(ending));
              studentResults.push(...found);
            }
          }
        } else if (studentQuery.includes('valid') || studentQuery.includes('belong')) {
          // Validation queries
          const usnMatch = studentQuery.match(/1bm\d{2}ai\d{3}/i);
          if (usnMatch) {
            const usn = usnMatch[0].toUpperCase();
            let found = false;
            let batch = '';
            let semester = '';
            
            for (const batchKey in context.students.batches) {
              const batchData = context.students.batches[batchKey];
              const student = batchData.students.find(s => s.usn === usn);
              if (student) {
                found = true;
                batch = batchKey;
                semester = student.currentSemester;
                break;
              }
            }
            
            if (!found) {
              const lateralStudent = context.students.lateralEntryStudents.students.find(s => s.usn === usn);
              if (lateralStudent) {
                found = true;
                batch = 'Lateral Entry';
                semester = lateralStudent.currentSemester;
              }
            }
            
            if (found) {
              studentResponse = `**Yes, ${usn} is a valid student.**\n`;
              studentResponse += `• **Batch:** ${batch}\n`;
              studentResponse += `• **Current Semester:** ${semester}\n`;
            } else {
              studentResponse = `**No, ${usn} is not found in the student database.**\n`;
            }
          }
        }
        
        // Generate response based on results
        if (studentResponse) {
          response = studentResponse;
        } else if (studentResults.length > 0) {
          response = `**Student Information Found:**\n\n`;
          const displayCount = Math.min(studentResults.length, 10);
          
          for (let i = 0; i < displayCount; i++) {
            const student = studentResults[i];
            response += `• **${student.name}** (USN: ${student.usn})\n`;
            if (student.batchYear) {
              response += `  - Batch: ${student.batchYear}\n`;
              response += `  - Current Semester: ${student.currentSemester}\n`;
            }
            if (student.isLateralEntry) {
              response += `  - Type: Lateral Entry\n`;
            }
            response += `\n`;
          }
          
          if (studentResults.length > 10) {
            response += `... and ${studentResults.length - 10} more students\n`;
          }
        } else {
          response = `**Student Information:**\n\n`;
          response += `• **Total Students:** ${context.students.totalStudents}\n`;
          response += `• **2022 Batch (7th Sem):** ${context.students.batches['2022'].totalStudents} students\n`;
          response += `• **2023 Batch (5th Sem):** ${context.students.batches['2023'].totalStudents} students\n`;
          response += `• **2024 Batch (3rd Sem):** ${context.students.batches['2024'].totalStudents} students\n`;
          response += `• **Lateral Entry:** ${context.students.lateralEntryStudents.totalStudents} students\n`;
        }
        
        suggestions = [
          "Show me students from 2024 batch",
          "How many students are in 5th semester?",
          "Find student with USN 1BM22AI001"
        ];
        break;
        
      case 'lab_query':
      case 'infrastructure_query':
        response = `**Department Location:**\n`;
        response += `• Building: PJ Block\n`;
        response += `• Floor: 7th Floor\n`;
        response += `• Description: All labs, classrooms, and faculty staff rooms are located here\n\n`;
        response += `**Department Labs:**\n\n`;
        context.infrastructure.labs.forEach(lab => {
          response += `**${lab.name}**\n`;
          response += `• Capacity: ${lab.capacity} students\n`;
          response += `• Location: ${lab.location}\n`;
          response += `• Equipment: ${lab.equipment.map(eq => `${eq.name} (${eq.quantity} units)`).join(', ')}\n`;
          response += `• Facilities: ${lab.facilities.join(', ')}\n`;
          response += `• Availability: ${lab.availability}\n`;
          response += `• Special Features: ${lab.specialFeatures.join(', ')}\n\n`;
        });

        suggestions = [
          "Tell me about specific lab equipment",
          "What are the lab timings?",
          "Show me research facilities"
        ];
        break;
        
      case 'calendar_query':
        const upcomingEvents = context.calendar.events
          .filter(event => new Date(event.date) >= new Date())
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .slice(0, 5);
          
        if (upcomingEvents.length > 0) {
          response = `**Upcoming Events:**\n\n`;
          upcomingEvents.slice(0, 3).forEach(event => {
            response += `**${event.title}**\n`;
            response += `• Date: ${event.date}\n`;
            response += `• Type: ${event.type}\n`;
            response += `• Description: ${event.description}\n\n`;
          });
        } else {
          response = `**Academic Calendar:**\n\n`;
          response += `• Total Events: ${context.calendar.events.length}\n`;
          response += `• Academic Year: ${context.calendar.academicYear}\n`;
          response += `• Current Semester: ${context.calendar.currentSemester}\n\n`;
        }

        suggestions = [
          "Show me all events this month",
          "Tell me about exam dates",
          "What are the important deadlines?"
        ];
        break;
        
      default:
        response = `I can help you with:

• Faculty information
• Course details
• Lab facilities  
• Academic calendar

What would you like to know?`;

        suggestions = [
          "Tell me about the faculty",
          "Show me available courses",
          "What labs do we have?"
        ];
    }
    
    return {
      response: response,
      suggestions: suggestions,
      intent: intent,
      extractedInfo: extractedInfo,
      source: 'intelligent_fallback'
    };
  }

  generateFallbackResponse(userMessage, intent, extractedInfo, sessionId) {
    const lowerMessage = userMessage.toLowerCase();
    let response = '';
    let suggestions = [];
    
    switch (intent) {
      case 'greeting':
        response = `**Hey there! I'm LIAM ✨ Your AI companion for the AIML Department at BMSCE!** 

I'm here to help you with everything about our amazing department! I have access to comprehensive data about:

• **19 faculty members** with their specializations and research areas
• **27 courses** across 6 semesters (3rd to 8th)
• **4 specialized labs** with cutting-edge equipment and facilities
• **Department information** including location, vision, and HOD details

What would you like to know about the Department of Artificial Intelligence and Machine Learning? 🚀`;
        suggestions = [
          'Where is the AIML department located?',
          'Tell me about the faculty members',
          'What courses are available in 5th semester?'
        ];
        break;
        
      case 'department_location':
        response = `The Department of Artificial Intelligence and Machine Learning is located on the 7th floor of the PG Block at B.M.S. College of Engineering, Basavanagudi, Bengaluru. You can reach us at hod.mel@bmsce.ac.in for any department-related queries.`;
        suggestions = [
          'What is the vision of the AIML department?',
          'Who is the Head of the Department?',
          'When was the department established?'
        ];
        break;
        
      case 'department_overview':
        response = `The Department of Artificial Intelligence and Machine Learning at BMSCE offers a four-year B.E. program specializing in AI and ML. Our department was established in 2020 under the Faculty of Engineering and Technology. Our vision is to produce globally competent engineers skilled in AI and ML who contribute to technology, innovation, and research for societal development.`;
        suggestions = [
          'Who is the Head of the Department?',
          'What courses are offered?',
          'Tell me about the faculty'
        ];
        break;
        
      case 'hod_information':
        response = `Dr. M. Dakshayini is the Professor and Head of the Department of Artificial Intelligence and Machine Learning. You can contact the department at hod.mel@bmsce.ac.in for any academic or administrative queries.`;
        suggestions = [
          'What is the department vision?',
          'Where is the department located?',
          'Tell me about the faculty members'
        ];
        break;
        
      case 'infrastructure_query':
        if (lowerMessage.includes('equipment') && lowerMessage.includes('ml lab 1')) {
          const mlLab1 = this.knowledgeBase.infrastructure.labs.find(lab => lab.name === 'Machine Learning Lab 1');
          if (mlLab1) {
            const equipmentList = mlLab1.equipment.map(eq => 
              `**${eq.name}**\n• Quantity: ${eq.quantity} units\n• Specifications: ${eq.specifications}\n• Condition: ${eq.condition}\n`).join('\n');
            response = `**Equipment in Machine Learning Lab 1:**

${equipmentList}

**Facilities Available:**
• ${mlLab1.facilities.join('\n• ')}

**Availability:** ${mlLab1.availability}`;
          } else {
            response = `Machine Learning Lab 1 is equipped with standard ML workstations, data visualization displays, and comprehensive ML software suite including TensorFlow, PyTorch, and Scikit-learn.`;
          }
        } else if (lowerMessage.includes('equipment') && lowerMessage.includes('lab')) {
          const labName = this.extractLabName(lowerMessage);
          const lab = this.knowledgeBase.infrastructure.labs.find(l => 
            l.name.toLowerCase().includes(labName.toLowerCase())
          );
          if (lab) {
            const equipmentList = lab.equipment.map(eq => 
              `**${eq.name}**\n• Quantity: ${eq.quantity} units\n• Specifications: ${eq.specifications}\n`).join('\n');
            response = `**Equipment in ${lab.name}:**

${equipmentList}

**Facilities:** ${lab.facilities.join(', ')}`;
          } else {
            response = `The department has 4 modern computer labs with advanced computing facilities for AI/ML research and development.`;
          }
        } else {
          const labs = this.knowledgeBase.infrastructure.labs;
          const labList = labs.map(lab => 
            `**${lab.name}**\n• Capacity: ${lab.capacity} students\n• Location: ${lab.location}\n• Equipment: ${lab.equipment.length} types\n`).join('\n');
          response = `**Available Labs:**

${labList}

**All labs are equipped with modern computing facilities and specialized software.**`;
        }
        suggestions = [
          'What equipment is available in ML Lab 1?',
          'Tell me about the B.S. Narayan Center',
          'What facilities are available?'
        ];
        break;
        
      case 'faculty_listing':
        const facultyList = this.knowledgeBase.faculty.slice(0, 5).map(f => 
          `**${f.name}**\n• Designation: ${f.designation}\n• Specialization: ${Array.isArray(f.specialization) ? f.specialization[0] : 'AI/ML'}\n• Email: ${f.email}\n`).join('\n');
        response = `**Faculty Members:**

${facultyList}

**Department Statistics:**
• Total Faculty: ${this.knowledgeBase.faculty.length} members
• Professors: ${this.knowledgeBase.faculty.filter(f => f.designation.includes('Professor')).length}
• Associate Professors: ${this.knowledgeBase.faculty.filter(f => f.designation.includes('Associate')).length}
• Assistant Professors: ${this.knowledgeBase.faculty.filter(f => f.designation.includes('Assistant')).length}

For specific faculty details, ask about individual members.`;
        suggestions = [
          'Tell me about Dr. Sandeep Varma',
          'Who teaches computer vision?',
          'What are the research areas?'
        ];
        break;
        
      case 'course_query':
        if (lowerMessage.includes('all courses') || lowerMessage.includes('available courses')) {
          const allCourses = this.knowledgeBase.courses.slice(0, 8).map(c => 
            `**${c.name}**\n• Code: ${c.code}\n• Semester: ${c.semester}\n• Credits: ${c.credits}\n• Instructor: ${c.instructor || 'TBA'}\n`).join('\n');
          response = `**Available Courses:**

${allCourses}

**Course Statistics:**
• Total Courses: ${this.knowledgeBase.courses.length} courses
• Semesters Covered: 3rd to 8th (6 semesters)
• Total Credits: ${this.knowledgeBase.courses.reduce((sum, c) => sum + c.credits, 0)} credits

For detailed course information, visit the Courses page.`;
        } else if (lowerMessage.includes('machine learning') || lowerMessage.includes('ml')) {
          const mlCourses = this.knowledgeBase.courses.filter(c => 
            c.name.toLowerCase().includes('machine learning') || 
            c.name.toLowerCase().includes('ml')
          );
          if (mlCourses.length > 0) {
            const mlCourseList = mlCourses.map(c => 
              `**${c.name}**\n• Code: ${c.code}\n• Semester: ${c.semester}\n• Credits: ${c.credits}\n• Instructor: ${c.instructor || 'TBA'}\n`).join('\n');
            response = `**Machine Learning Courses:**

${mlCourseList}

**ML Course Highlights:**
• Foundation Courses: Mathematical foundations and statistics
• Core ML: Introduction to ML and advanced topics
• Practical Labs: Hands-on ML lab sessions
• Projects: Real-world ML project implementation`;
          } else {
            response = `Machine Learning courses are available across different semesters. Check the Courses page for detailed information.`;
          }
        } else {
          response = `I can help you with course information. We have ${this.knowledgeBase.courses.length} courses across 6 semesters (3rd to 8th). What specific course information do you need?`;
        }
        suggestions = [
          'Show me all available courses',
          'What machine learning courses are there?',
          'Tell me about semester 5 courses'
        ];
        break;
        
      case 'semester_course_query':
        const semester5Courses = this.knowledgeBase.courses.filter(c => c.semester.toLowerCase().includes('5th'));
        if (semester5Courses.length > 0) {
          const courseList = semester5Courses.map(c => 
            `**${c.name}**\n• Code: ${c.code}\n• Credits: ${c.credits}\n• Instructor: ${c.instructor || 'TBA'}\n• Type: ${c.courseType}\n`).join('\n');
          response = `**Semester V Courses:**

${courseList}

**Semester V Highlights:**
• Advanced Topics: Deep Learning, NLP, Computer Vision
• Practical Focus: Hands-on projects and labs
• Industry Relevance: Real-world applications
• Prerequisites: Strong foundation from previous semesters

These courses build on your foundation from previous semesters.`;
        } else {
          response = `Semester 5 courses focus on advanced topics like Deep Learning, NLP, Computer Vision, and Data Science.`;
        }
        suggestions = [
          'What are the prerequisites for these courses?',
          'Who teaches these courses?',
          'Show me courses from other semesters'
        ];
        break;
        
      case 'contact_information':
        if (lowerMessage.includes('sandeep') && lowerMessage.includes('varma')) {
          const sandeep = this.knowledgeBase.faculty.find(f => f.name.toLowerCase().includes('sandeep'));
          if (sandeep) {
            response = `**Dr. Sandeep Varma N**

**Contact Information:**
• Designation: ${sandeep.designation}
• Email: ${sandeep.email}
• Phone: ${sandeep.phone || 'Available on request'}
• Office: ${sandeep.office || 'Department of AIML'}

**Specialization:**
• ${Array.isArray(sandeep.specialization) ? sandeep.specialization.join('\n• ') : 'Data Privacy, Machine Learning'}

You can reach out for academic guidance and research collaboration.`;
          } else {
            response = `**Dr. Sandeep Varma N**

**Contact Information:**
• Email: sandeep.mel@bmsce.ac.in
• Department: Artificial Intelligence and Machine Learning
• Specialization: Data Privacy, Machine Learning

Available for academic consultations and research guidance.`;
          }
        } else if (lowerMessage.includes('pallavi')) {
          const pallavi = this.knowledgeBase.faculty.find(f => f.name.toLowerCase().includes('pallavi'));
          if (pallavi) {
            response = `**Dr. Pallavi B**

**Contact Information:**
• Designation: ${pallavi.designation}
• Email: ${pallavi.email}
• Phone: ${pallavi.phone || 'Available on request'}
• Office: ${pallavi.office || 'Department of AIML'}

**Specialization:**
• ${Array.isArray(pallavi.specialization) ? pallavi.specialization.join('\n• ') : 'Machine Learning, Data Analytics'}

You can reach out for academic guidance and research collaboration.`;
          } else {
            response = `**Dr. Pallavi B**

**Contact Information:**
• Email: pallavib.mel@bmsce.ac.in
• Department: Artificial Intelligence and Machine Learning
• Specialization: Machine Learning, Data Analytics

Available for academic consultations and research guidance.`;
          }
        } else {
          response = `I can help you find faculty contact information. Which faculty member are you looking for?`;
        }
        suggestions = [
          'Show me all faculty members',
          'What are their specializations?',
          'Who is the HOD?'
        ];
        break;
        
      case 'career_guidance':
        const dataScienceCourses = this.knowledgeBase.courses.filter(c => 
          c.name.toLowerCase().includes('data') || 
          c.name.toLowerCase().includes('machine learning') ||
          c.name.toLowerCase().includes('analytics')
        );
        if (dataScienceCourses.length > 0) {
          const courseList = dataScienceCourses.slice(0, 5).map(c => 
            `**${c.name}**\n• Semester: ${c.semester}\n• Credits: ${c.credits}\n• Code: ${c.code}\n`).join('\n');
          response = `**Data Science Career Pathway:**

${courseList}

**Career Development Tips:**
• Foundation: Build strong mathematical and statistical skills
• Programming: Master Python, R, and SQL
• Projects: Work on real-world data science projects
• Networking: Connect with faculty and industry professionals

These courses will give you the foundation needed for a data science career.`;
        } else {
          response = `To become a data scientist, focus on courses in Machine Learning, Data Analytics, and Statistics. Check the courses page for detailed information.`;
        }
        suggestions = [
          'What courses should I take for data science?',
          'Show me faculty who specialize in AI',
          'What are the prerequisites for machine learning courses?'
        ];
        break;
        
      case 'faculty_course_mapping':
        if (lowerMessage.includes('computer vision')) {
          const computerVisionFaculty = this.knowledgeBase.faculty.filter(f => 
            f.specialization && f.specialization.some(s => s.toLowerCase().includes('computer vision'))
          );
          if (computerVisionFaculty.length > 0) {
            const facultyList = computerVisionFaculty.map(f => 
              `**${f.name}**\n• Designation: ${f.designation}\n• Specialization: ${Array.isArray(f.specialization) ? f.specialization.join(', ') : 'Computer Vision'}\n• Email: ${f.email}\n`).join('\n');
            response = `**Computer Vision Faculty:**

${facultyList}

**Computer Vision Expertise:**
• Image Processing: Advanced algorithms and techniques
• Pattern Recognition: Machine learning applications
• Deep Learning: Neural networks for computer vision
• Research Areas: Cutting-edge CV research projects

Contact these faculty members for computer vision guidance and research opportunities.`;
          } else {
            response = `Computer Vision courses are taught by faculty members specializing in Computer Vision, Deep Learning, and Pattern Recognition.`;
          }
        } else {
          response = `Faculty members teach various courses based on their specializations. What specific subject are you interested in?`;
        }
        suggestions = [
          'What other courses does this faculty teach?',
          'Show me all faculty members',
          'What are their research areas?'
        ];
        break;
        
      default:
        response = `I'm here to help you with information about the AIML Department at BMSCE. I can assist you with details about our faculty, courses, department location, facilities, academic calendar, and more. What specific information would you like to know?`;
        suggestions = [
          'Where is the AIML department located?',
          'Tell me about the faculty members',
          'What courses are available?'
        ];
    }
    
    return { response, suggestions, intent, extractedInfo };
  }

  analyzeUserIntent(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Prioritize specific queries first
    if (lowerMessage.includes('where') && (lowerMessage.includes('department') || lowerMessage.includes('located') || lowerMessage.includes('location'))) {
      return 'department_location';
    }
    if (lowerMessage.includes('what is aiml') || lowerMessage.includes('aiml department') || lowerMessage.includes('department overview') || lowerMessage.includes('vision') || lowerMessage.includes('established')) {
      return 'department_overview';
    }
    if (lowerMessage.includes('hod') || lowerMessage.includes('head of department') || lowerMessage.includes('who is the head')) {
      return 'hod_information';
    }
    if (lowerMessage.includes('semester') && (lowerMessage.includes('course') || lowerMessage.includes('5') || lowerMessage.includes('5th'))) {
      return 'semester_course_query';
    }
    if (lowerMessage.includes('equipment') && lowerMessage.includes('lab')) {
      return 'infrastructure_query';
    }
    if ((lowerMessage.includes('course') || lowerMessage.includes('subject') || lowerMessage.includes('syllabus')) && !lowerMessage.includes('lab')) {
      return 'course_query';
    }
    if (lowerMessage.includes('available') && lowerMessage.includes('course')) {
      return 'course_query';
    }
    if ((lowerMessage.includes(' lab') || lowerMessage.includes('lab ') || lowerMessage.includes('labs')) || (lowerMessage.includes('infrastructure') && !lowerMessage.includes('course')) || (lowerMessage.includes('facility') && !lowerMessage.includes('course'))) {
      return 'infrastructure_query';
    }
    if (lowerMessage.includes('machine learning') || lowerMessage.includes('ml')) {
      return 'course_query';
    }
    if (lowerMessage.includes('teaches') || lowerMessage.includes('who teaches')) {
      return 'faculty_course_mapping';
    }
    if (lowerMessage.includes('email') || lowerMessage.includes('contact') || lowerMessage.includes('sandeep') || lowerMessage.includes('pallavi')) {
      return 'contact_information';
    }
    if (lowerMessage.includes('career') || lowerMessage.includes('become')) {
      return 'career_guidance';
    }
    if (lowerMessage.includes('faculty') || lowerMessage.includes('professor') || lowerMessage.includes('teacher') || lowerMessage.includes('staff')) {
      return 'faculty_listing';
    }
    if (lowerMessage.includes('show') && lowerMessage.includes('faculty') || lowerMessage.includes('all faculty')) {
      return 'faculty_listing';
    }
    // Placements query detection
    if (lowerMessage.includes('placement') || lowerMessage.includes('placed') || lowerMessage.includes('offer') || lowerMessage.includes('package') || lowerMessage.includes('recruiter') || lowerMessage.includes('company') || lowerMessage.includes('internship')) {
      return 'placements_query';
    }
    // Student query detection
    if (lowerMessage.includes('student') || lowerMessage.includes('usn') || lowerMessage.includes('batch') || 
        lowerMessage.includes('aashish') || lowerMessage.includes('rahul') || 
        /1bm\d{2}ai\d{3}/i.test(lowerMessage) || 
        lowerMessage.includes('how many students') || lowerMessage.includes('total students') ||
        lowerMessage.includes('2022 batch') || lowerMessage.includes('2023 batch') || lowerMessage.includes('2024 batch') ||
        lowerMessage.includes('3rd sem') || lowerMessage.includes('5th sem') || lowerMessage.includes('7th sem') ||
        lowerMessage.includes('lateral entry') || lowerMessage.includes('valid student') ||
        lowerMessage.includes('first 5') || lowerMessage.includes('starting with') ||
        lowerMessage.includes('ending with') || lowerMessage.includes('belong to')) {
      return 'student_query';
    }
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return 'greeting';
    }
    
    return 'general_inquiry';
  }

  extractKeyInformation(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    const extracted = {
      semester: null,
      facultyName: null,
      courseName: null,
      specialization: null,
      labName: null
    };
    
    // Extract semester
    const semesterMatch = lowerMessage.match(/(\d+)(?:st|nd|rd|th)?\s*semester/);
    if (semesterMatch) {
      extracted.semester = semesterMatch[1];
    }
    
    // Extract faculty name
    const facultyNames = this.knowledgeBase.faculty.map(f => f.name.toLowerCase());
    for (const name of facultyNames) {
      if (lowerMessage.includes(name)) {
        extracted.facultyName = name;
        break;
      }
    }
    
    // Extract course name
    const courseNames = this.knowledgeBase.courses.map(c => c.name.toLowerCase());
    for (const name of courseNames) {
      if (lowerMessage.includes(name)) {
        extracted.courseName = name;
        break;
      }
    }
    
    // Extract lab name
    const labNames = this.knowledgeBase.infrastructure.labs.map(l => l.name.toLowerCase());
    for (const name of labNames) {
      if (lowerMessage.includes(name)) {
        extracted.labName = name;
        break;
      }
    }
    
    return extracted;
  }

  extractLabName(message) {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('ml lab 1') || lowerMessage.includes('machine learning lab 1')) {
      return 'Machine Learning Lab 1';
    }
    if (lowerMessage.includes('ml lab 2') || lowerMessage.includes('machine learning lab 2')) {
      return 'Machine Learning Lab 2';
    }
    if (lowerMessage.includes('ml lab 3') || lowerMessage.includes('machine learning lab 3')) {
      return 'Machine Learning Lab 3';
    }
    if (lowerMessage.includes('b.s. narayan') || lowerMessage.includes('center of excellence')) {
      return 'B.S. Narayan Center of Excellence in AI & ML';
    }
    return 'lab';
  }

  createComprehensiveContext() {
    return {
      faculty: this.knowledgeBase.faculty,
      courses: this.knowledgeBase.courses,
      infrastructure: this.knowledgeBase.infrastructure,
      students: this.knowledgeBase.students,
      calendar: this.knowledgeBase.calendar,
      placements: this.knowledgeBase.placements,
      placementStats: this.knowledgeBase.placementStats,
      latestPlacementYear: this.knowledgeBase.latestPlacementYear
    };
  }

  updateConversationHistory(sessionId, userMessage, aiResponse) {
    const conversationHistory = this.conversationHistory.get(sessionId) || [];
    conversationHistory.push({ role: 'user', content: userMessage });
    conversationHistory.push({ role: 'assistant', content: aiResponse });
    
    // Keep only last 10 messages
    if (conversationHistory.length > 10) {
      conversationHistory.splice(0, conversationHistory.length - 10);
    }
    
    this.conversationHistory.set(sessionId, conversationHistory);
  }

  saveFacultyData() {
    try {
      const facultyPath = path.join(__dirname, 'data/comprehensive_faculty.json');
      fs.writeFileSync(facultyPath, JSON.stringify(this.knowledgeBase.faculty, null, 2));
      console.log('✅ Faculty data saved successfully');
    } catch (error) {
      console.error('❌ Error saving faculty data:', error);
    }
  }

  saveCoursesData() {
    try {
      const coursesPath = path.join(__dirname, 'data/comprehensive_courses.json');
      fs.writeFileSync(coursesPath, JSON.stringify(this.knowledgeBase.courses, null, 2));
      console.log('✅ Courses data saved successfully');
    } catch (error) {
      console.error('❌ Error saving courses data:', error);
    }
  }

  startServer() {
    this.app.listen(this.port, () => {
      console.log(`🚀 AIML AI Agent running on port ${this.port}`);
      console.log(`📊 Serving ${this.knowledgeBase.faculty.length} faculty members`);
      console.log(`📚 Serving ${this.knowledgeBase.courses.length} courses`);
      console.log(`🏢 Serving infrastructure data`);
      console.log(`👥 Serving ${this.knowledgeBase.students.totalStudents} students`);
      console.log(`📅 Serving calendar data`);
      console.log(`🤖 AIML AI Agent ready for intelligent conversations!`);
    });
  }
}

// Start the server
new AIMLAgent();
