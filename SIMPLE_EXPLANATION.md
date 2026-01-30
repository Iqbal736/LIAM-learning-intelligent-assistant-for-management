# LIAM Project - Simple Explanation
## Everything Explained in Plain Language

---

## WHAT IS THIS PROJECT?

LIAM is an AI chatbot that helps students and visitors get information about the AIML Department at BMSCE. Instead of searching through multiple websites or asking staff members, users can simply type a question like "Tell me about Dr. Dakshayini" or "What courses are in 5th semester?" and get an instant, intelligent answer.

The project has two main parts: a website that users interact with (frontend) and a server that processes requests and talks to the AI (backend). The frontend is built with React, which creates the user interface you see in the browser. The backend is built with Node.js and Express, which handle all the logic and communication with Google's Gemini AI.

---

## WHY I CHOSE EACH TECHNOLOGY

### Frontend Technologies

**React** is the foundation of the frontend. I chose React because it allows me to break the website into reusable pieces called components. For example, the navigation bar is one component that appears on every page. This means I don't have to write the same code multiple times. React also updates the webpage very quickly when data changes, which is important for the chat interface where messages appear in real-time.

**TypeScript** is JavaScript with extra features that help catch mistakes before the code runs. When I write code, TypeScript checks if I'm using the right data types. For example, if I try to access a faculty member's email but write "emial" by mistake, TypeScript will immediately tell me there's an error. This saves a lot of debugging time and makes the code more reliable.

**Tailwind CSS** is used for styling the website. Instead of writing separate CSS files, I can add styles directly in the code using simple class names like "bg-blue-500" for a blue background. This makes development faster because I don't have to switch between different files. Tailwind also ensures consistent spacing and colors throughout the website, and it has built-in support for dark mode.

**React Router** handles navigation between different pages. When you click on "Faculty" or "Courses" in the menu, React Router changes what's displayed on the screen without reloading the entire page. This makes the website feel fast and smooth, similar to a mobile app.

**React Query** manages all the data that comes from the backend. When the frontend requests faculty information, React Query stores it in memory. If the same data is requested again, React Query uses the stored version instead of making another request. This reduces the number of API calls and makes the website faster.

**Axios** is used to communicate with the backend server. It's better than the built-in fetch function because it automatically handles JSON parsing, has better error messages, and allows me to add interceptors that can log requests or handle errors globally.

### Backend Technologies

**Node.js** is the runtime environment that runs the backend server. I chose Node.js because it uses JavaScript, the same language as the frontend. This means I only need to know one programming language for the entire project. Node.js is also excellent at handling multiple requests at the same time, which is important when multiple users are chatting with the AI simultaneously.

**Express.js** is a web framework that makes it easy to create API endpoints. It's like a foundation that handles common tasks like parsing incoming data and setting up routes. Express is simple, well-documented, and widely used, making it perfect for this project.

**CORS** (Cross-Origin Resource Sharing) is necessary because the frontend runs on port 3000 and the backend runs on port 5001. Browsers consider these different origins and block requests between them by default for security. CORS tells the browser that it's safe to allow these requests.

**dotenv** is used to store sensitive information like the Gemini API key. Instead of putting the API key directly in the code where it could be accidentally shared, dotenv reads it from a separate file called .env. This file is not uploaded to version control, keeping the API key secure.

**File System (fs)** is a built-in Node.js module that reads and writes JSON files. I use it to store all the department data in JSON format instead of using a database. This is simpler because I don't need to set up and maintain a database server, and JSON files are easy to read and edit.

### AI Technologies

**Google Gemini 2.5 Flash** is the AI model that generates responses to user questions. I chose Gemini because it's Google's latest and most advanced language model. It understands context very well and can generate natural, human-like responses. The free tier provides enough API calls for this project, and I don't need to train my own model, which would take months and require expensive hardware.

**Intent Classification** is a simple algorithm I created that analyzes user messages to determine what type of question they're asking. For example, if someone asks "Tell me about faculty", the algorithm detects keywords like "faculty" or "professor" and categorizes it as a faculty query. This helps the system load only the relevant data and create a more focused prompt for the AI.

**RAG (Retrieval-Augmented Generation)** is the approach I use to ensure accurate responses. Instead of relying solely on the AI's training data, I first retrieve all relevant information from the department's knowledge base. Then I include this information in the prompt sent to Gemini. This way, the AI has access to the exact, up-to-date information about the department, resulting in more accurate answers.

---

## HOW THE SYSTEM WORKS

When a user types a question in the chat interface, here's what happens step by step:

First, the React frontend sends the message to the backend server using Axios. The backend receives this message and immediately analyzes it using the intent classification algorithm. This algorithm looks for keywords and determines whether the question is about faculty, courses, placements, infrastructure, students, or the academic calendar.

Once the intent is identified, the backend loads all relevant data from the JSON files stored in the data folder. For example, if the question is about faculty, it loads the comprehensive_faculty.json file which contains information about all 26 faculty members. The backend also loads other related data like courses and infrastructure to provide comprehensive context.

Next, the backend creates a detailed prompt that includes all this data, the user's question, any previous conversation history, and specific instructions for how the AI should respond. This prompt is then sent to Google's Gemini API using a REST API call.

Gemini processes this prompt using its advanced language understanding capabilities. It analyzes the context, understands what information is relevant to answer the question, and generates a natural language response. The response is formatted with bullet points, bold text for important information, and includes follow-up question suggestions.

The backend receives this response from Gemini, parses it to extract the main answer and suggestions, and sends it back to the frontend. React Query stores this response, and the React frontend displays it in the chat interface using a markdown renderer that formats the text nicely.

If for some reason Gemini fails to respond (maybe due to a network error or rate limiting), the system has a fallback mechanism. It searches through the knowledge base directly and constructs a response from the available data. This ensures users always get an answer, even if the AI service is temporarily unavailable.

---

## WHY I MADE SPECIFIC CHOICES

I chose React over Angular or Vue because React has a simpler learning curve and is more flexible. It doesn't force a specific project structure, allowing me to organize the code however I want. React also has a larger community and more resources available online.

I chose TypeScript over plain JavaScript because TypeScript catches errors before the code runs. In a large project like this, it's easy to make mistakes like typing a variable name wrong. TypeScript would catch this immediately, whereas JavaScript would only show the error when the code runs, making debugging much harder.

I chose JSON files over a database like MongoDB because the data volume is manageable. We have 26 faculty members, 47 courses, and a few hundred students. This amount of data can easily fit in JSON files, and reading from files is fast enough for this use case. A database would add complexity without providing significant benefits for this project size.

I chose Gemini API over training my own AI model because training a model would require months of work, expensive GPU hardware, and a large dataset of question-answer pairs. Gemini is already trained on vast amounts of text and can understand and generate natural language responses immediately. It's also constantly being improved by Google, so I get the latest AI capabilities without any additional work.

I chose React Query over Redux or Context API because React Query is specifically designed for managing server state (data from APIs). It automatically handles caching, loading states, and error states, which would require a lot of custom code with Redux or Context API. React Query reduces the amount of code I need to write and makes the application faster by reducing unnecessary API calls.

I chose Tailwind CSS over Bootstrap because Tailwind is more flexible. With Bootstrap, you're limited to pre-built components that might not match your design. Tailwind gives you utility classes that you can combine in any way to create exactly the design you want. It also results in smaller file sizes because only the classes you actually use are included in the final code.

---

## HOW THE AI UNDERSTANDS AND RESPONDS

The AI system works through a process called RAG, which stands for Retrieval-Augmented Generation. This is a two-step process that ensures accurate responses.

In the retrieval step, when a user asks a question, the system searches through all the department data stored in JSON files. It identifies which information is relevant to answer the question. For example, if someone asks "Who teaches Machine Learning?", the system retrieves all course information and finds the Machine Learning course, then retrieves faculty information to find who teaches it.

In the augmentation step, all this retrieved information is formatted into a comprehensive prompt. The prompt includes the user's question, all relevant data, instructions on how to format the response, and any previous conversation history. This prompt is much more detailed than just sending the user's question alone.

In the generation step, this enhanced prompt is sent to Gemini. Because Gemini now has access to all the relevant department information, it can generate an accurate answer. It's like giving a student all the textbooks they need before asking them a question, rather than expecting them to answer from memory alone.

The system also uses intent classification to make this process more efficient. Before retrieving data, it first determines what type of question is being asked. This allows it to focus on loading only the most relevant data. For example, if the question is clearly about faculty, it doesn't need to load all the course information, making the process faster.

---

## HANDLING ERRORS AND EDGE CASES

The system has multiple layers of error handling to ensure it always works, even when things go wrong.

If the Gemini API is temporarily unavailable or returns an error, the system doesn't just show an error message to the user. Instead, it falls back to a direct search through the knowledge base. It uses the same intent classification to find relevant information and constructs a response manually. This ensures users always get an answer, even if the AI service is down.

The system also implements rate limiting to avoid overwhelming the Gemini API. There's a minimum five-second gap between API calls, and if the API returns a rate limit error, the system waits longer before trying again. This is called exponential backoff - if the first retry fails, it waits 5 seconds, then 10 seconds, then 20 seconds, giving the API time to recover.

For network errors, Axios interceptors catch them and display user-friendly error messages. React Query also handles errors gracefully by showing loading states and error states automatically, so users always know what's happening.

---

## THE ADMIN PANEL

The admin panel allows authorized users to update all the department data through a web interface. This is important because the data needs to be kept current - new faculty members join, courses change, and placement statistics update every year.

When an admin makes changes, the frontend sends the updated data to the backend using a PUT request. The backend validates the data to ensure it's in the correct format, then writes it to the appropriate JSON file using the file system module. After writing, it reloads the data into memory so that the next AI query uses the updated information.

This approach is simple but effective. For a larger system with many concurrent users, I would use a database with proper locking mechanisms. But for this project, where only one admin updates data at a time, file-based storage works perfectly.

---

## PROJECT STATISTICS AND SCOPE

The project consists of approximately 5,000 lines of code across the frontend and backend. The frontend has about 3,000 lines of React and TypeScript code, organized into 15 components and 8 pages. The backend has about 2,000 lines of Node.js code that handles all the API endpoints and AI integration.

The data consists of 26 faculty members, 47 courses across multiple semesters, detailed infrastructure information including multiple labs, placement data for 2024 and 2025, student information for three batches totaling over 655 students, and academic calendar events.

The system handles six different domains of information: faculty, courses, infrastructure, placements, students, and academic calendar. Each domain has its own API endpoints and can be queried independently or in combination.

---

## COMMON QUESTIONS AND ANSWERS

**Why did you use React instead of vanilla JavaScript?** React makes it much easier to build complex user interfaces. With vanilla JavaScript, I would have to manually update the DOM every time data changes, which is error-prone and time-consuming. React automatically updates the UI when data changes, and its component system makes the code organized and reusable.

**Why TypeScript instead of JavaScript?** TypeScript catches errors before the code runs. In a project this size, it's very easy to make mistakes like typing a property name wrong. TypeScript would catch this immediately when I write the code, whereas JavaScript would only show the error when someone uses that feature, making it much harder to find and fix.

**How does the AI actually work?** The AI uses a technique called RAG - Retrieval-Augmented Generation. When you ask a question, the system first retrieves all relevant information from the department's data files. Then it includes this information in a detailed prompt that's sent to Google's Gemini AI. Gemini processes this prompt and generates a natural language response. This approach is more accurate than just asking Gemini a question without context, because it has access to the exact, up-to-date department information.

**Why not train your own AI model?** Training an AI model requires months of work, expensive GPU hardware, and thousands of example question-answer pairs. Google's Gemini is already trained on vast amounts of text and can understand natural language immediately. It's also constantly being improved, so I get the latest AI capabilities without any additional work. For this project, using an existing model is the practical choice.

**Why JSON files instead of a database?** For this project size, JSON files are simpler and sufficient. We have manageable amounts of data that can easily fit in files. Reading from files is fast enough, and I don't need complex queries or relationships between data. If the project grows significantly, I would migrate to a database, but for now, JSON files work perfectly and are much simpler to set up and maintain.

**How do you handle when the AI doesn't know something?** The system has a fallback mechanism. If Gemini fails or can't generate a good response, the system searches through the knowledge base directly using the intent classification. It finds the relevant information and constructs a response manually. This ensures users always get an answer based on the available data, even if the AI service is having issues.

**Why React Query instead of just using useState?** React Query automatically caches API responses. If I fetch faculty data once, it's stored in memory. If I need it again, React Query uses the cached version instead of making another API call. This makes the application faster and reduces the load on the backend. React Query also handles loading states and errors automatically, reducing the amount of code I need to write.

**How does the system remember previous messages in a conversation?** Each user session has a unique identifier. The backend stores the last several messages from each session in memory. When generating a new response, it includes these previous messages in the prompt sent to Gemini. This way, Gemini understands the context of the conversation and can answer follow-up questions like "tell me more" or "what about that professor?"

**Why Tailwind CSS instead of writing custom CSS?** Tailwind allows me to write styles directly in the JSX code using simple class names. This is faster because I don't have to switch between different files. Tailwind also ensures design consistency with predefined spacing and colors, and it automatically removes unused styles, resulting in smaller file sizes.

**What happens if multiple people use the system at the same time?** Node.js handles multiple requests concurrently. Each user gets their own session ID, and their conversation history is stored separately. The knowledge base data is read-only for queries, so multiple users can access it simultaneously without any issues. The only potential bottleneck is the Gemini API rate limiting, which I handle with the five-second minimum delay between calls.

---

## KEY ACHIEVEMENTS

This project successfully demonstrates several important concepts. First, it shows how to integrate cutting-edge AI technology (Google Gemini) with traditional web development. Second, it implements RAG (Retrieval-Augmented Generation), which is a modern approach to making AI systems more accurate by giving them access to specific knowledge bases. Third, it's a complete full-stack application with a modern frontend, a robust backend, and intelligent AI integration.

The project solves a real-world problem - making department information easily accessible through natural language conversation. Instead of navigating complex websites or asking staff members, students can simply ask questions and get instant, accurate answers.

The architecture is scalable, meaning it can be extended with more features or migrated to use a database if needed. The code is well-organized with TypeScript providing type safety, and the use of modern frameworks and libraries ensures the project follows current best practices.

---

## FINAL SUMMARY

LIAM is an AI-powered information system for the AIML Department. It uses React and TypeScript for the frontend, Node.js and Express for the backend, and Google Gemini AI for natural language understanding. The system uses RAG to ensure accurate responses by retrieving relevant data and including it in prompts to the AI. It handles six domains of information: faculty, courses, infrastructure, placements, students, and academic calendar. The project demonstrates modern web development practices, AI integration, and solves a real-world problem of making department information easily accessible.

