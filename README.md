git init# AIML Department AI Agent - BMSCE

A smart website for the AIML Department with an AI chatbot named LIAM that can answer questions about faculty, courses, and department information.

## What This Project Does

- **LIAM Chatbot**: Ask questions and get smart answers about the department
- **Faculty Page**: See all teachers and their information
- **Courses Page**: Browse all subjects and courses
- **Calendar**: Check important dates and events
- **Admin Panel**: Add or edit information (password protected)

## What You Need Before Starting

1. **VS Code** - Download from [code.visualstudio.com](https://code.visualstudio.com/)
2. **Node.js** - Download from [nodejs.org](https://nodejs.org/) (choose the LTS version)
3. **Git** - Download from [git-scm.com](https://git-scm.com/)
4. **Google Account** - For the AI chatbot to work

## 🚀 How to Run This Project in VS Code

### Step 1: Download the Project
1. Open VS Code
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "Git: Clone" and press Enter
4. Paste this link: `https://github.com/m-s-aashish/AIML_Agent`
5. Choose a folder to save the project
6. Click "Open" when asked

### Step 2: Get Your AI Key (For Chatbot)
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key"
4. Click "Create API Key"
5. Copy the key (it looks like: `AIzaSy...`)

### Step 3: Add Your AI Key to the Project
1. In VS Code, look for a file called `.env` in the main folder
2. If you don't see it, create a new file called `.env`
3. Add this line to the file:
```
GEMINI_API_KEY=your_copied_key_here
```
4. Replace `your_copied_key_here` with the key you copied
5. Save the file (`Ctrl+S`)

### Step 4: Install Required Software
1. In VS Code, press `Ctrl+`` (backtick key) to open terminal
2. Type this command and press Enter:
```bash
npm install
```
3. Wait for it to finish, then type:
```bash
cd frontend
npm install
cd ..
```
4. Wait for this to finish too

### Step 5: Start the Website
1. In the terminal, type this command and press Enter:
```bash
node ai-agent.js
```
2. You should see a message saying "AI Agent server running on port 5001"
3. **Keep this terminal open** - don't close it!

### Step 6: Open a New Terminal
1. In VS Code, click the `+` button next to the terminal tab
2. Or press `Ctrl+Shift+`` (backtick)
3. In the new terminal, type:
```bash
cd frontend
npm start
```
4. Wait for it to finish - your browser should open automatically
5. If it doesn't open, go to `http://localhost:3000` in your browser

### Step 7: You're Done! 🎉
- The website should now be running
- You can chat with LIAM (the AI assistant)
- Browse faculty, courses, and other pages
- Everything should be working!

## 🎯 How to Use the Website

### For Everyone:
- **Home Page**: Click "Start Chatting with LIAM" to talk to the AI
- **Faculty**: See all teachers and their details
- **Courses**: Browse subjects by semester
- **Calendar**: Check important dates
- **About**: Learn about the department

### For Admins:
- Go to `/admin` in your browser
- Password: `Aashish@15`
- Add, edit, or delete faculty and courses

## ❗ If Something Goes Wrong

### Problem: Website won't start
**Solution**: 
1. Make sure both terminals are running
2. Check if you copied the API key correctly
3. Try closing VS Code and opening it again

### Problem: Chatbot not working
**Solution**:
1. Check your `.env` file has the correct API key
2. Make sure you have internet connection
3. Restart both terminals

### Problem: "Port already in use" error
**Solution**:
1. Close all terminals in VS Code
2. Close your browser
3. Wait 30 seconds
4. Try again

### Problem: Can't find files
**Solution**:
1. Make sure you opened the right folder in VS Code
2. Check if all files are there (logo.png, hod.png, etc.)
3. Try downloading the project again

## 📞 Need Help?

If you're still having trouble:
1. Make sure you followed all steps exactly
2. Check that Node.js is installed properly
3. Try restarting your computer
4. Ask someone who knows programming for help

## 🎉 That's It!

You now have a working AIML Department website with an AI chatbot! 

**Remember:**
- Keep both terminals running when using the website
- The chatbot needs internet to work
- You can customize the content through the admin panel

**Happy Learning! 🚀**

to run:
pkill -f "node ai-agent.js" && sleep 2 && node ai-agent.js

pkill -f "react-scripts" && sleep 2 && cd frontend && npm start

sleep 5 && echo "🚀 Checking server status..." && curl -s http://localhost:5001/api/health || echo "Backend starting..." && curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend is running at http://localhost:3000" || echo "Frontend starting..."