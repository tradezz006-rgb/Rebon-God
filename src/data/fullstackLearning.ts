export interface CodeQuestion {
  id: string;
  question: string;
  type: "multiple_choice" | "code_completion" | "code_fix" | "code_output";
  options?: string[];
  correctIndex?: number;
  codeTemplate?: string;
  expectedOutput?: string;
  testCases?: { input: string; expectedOutput: string }[];
  explanation: string;
  language: "javascript" | "typescript" | "html" | "css" | "sql";
}

export interface FullStackQuiz {
  id: string;
  questions: CodeQuestion[];
}

export interface FullStackTaskAssessment {
  id: string;
  title: string;
  prompt: string;
  timeLimit: number;
  starterCode: string;
  testCases: { input: string; expectedOutput: string; description: string }[];
  language: "javascript" | "typescript";
  evaluationCriteria: string[];
}

export interface FullStackNanoVideo {
  id: string;
  title: string;
  description: string;
  duration: string;
  durationSeconds: number;
  category: "frontend" | "backend" | "devops" | "architecture" | "testing";
  level: "beginner" | "moderate" | "pro" | "ultra_pro";
  videoUrl?: string;
  thumbnailUrl?: string;
  keyPoints: string[];
  quiz: CodeQuestion[];
  taskAssessment: FullStackTaskAssessment;
}

export const fullstackLearningContent: FullStackNanoVideo[] = [
  // BEGINNER LEVEL
  {
    id: "fs-v1-html-structure",
    title: "Semantic HTML Structure",
    description: "Learn to write meaningful, accessible HTML that search engines and screen readers love.",
    duration: "10 min",
    durationSeconds: 600,
    category: "frontend",
    level: "beginner",
    keyPoints: [
      "Semantic vs div-soup HTML",
      "Header, main, section, article, aside, footer",
      "Accessibility benefits of semantic HTML",
      "SEO advantages of proper structure"
    ],
    quiz: [
      {
        id: "q1",
        question: "Which HTML element should contain the main navigation links?",
        type: "multiple_choice",
        options: ["<div id='nav'>", "<nav>", "<header>", "<menu>"],
        correctIndex: 1,
        explanation: "The <nav> element is specifically designed for navigation links and helps screen readers identify navigation areas.",
        language: "html"
      },
      {
        id: "q2",
        question: "What will this code output?",
        type: "code_output",
        codeTemplate: `document.querySelector('article').tagName`,
        expectedOutput: "ARTICLE",
        explanation: "The tagName property returns the element's tag name in uppercase.",
        language: "javascript"
      },
      {
        id: "q3",
        question: "Fix the semantic structure of this HTML:",
        type: "code_fix",
        codeTemplate: `<div class="header">
  <div class="logo">My Site</div>
  <div class="nav">
    <a href="/">Home</a>
  </div>
</div>`,
        expectedOutput: `<header>
  <h1>My Site</h1>
  <nav>
    <a href="/">Home</a>
  </nav>
</header>`,
        explanation: "Using semantic elements like <header>, <h1>, and <nav> improves accessibility and SEO.",
        language: "html"
      }
    ],
    taskAssessment: {
      id: "t1",
      title: "Build a Semantic Page Structure",
      prompt: "Create a semantic HTML structure for a blog post page with header, navigation, main article content, sidebar, and footer.",
      timeLimit: 180,
      starterCode: `<!-- Create a semantic HTML structure -->
<!DOCTYPE html>
<html>
<head>
  <title>My Blog Post</title>
</head>
<body>
  <!-- Add your semantic HTML here -->
  
</body>
</html>`,
      testCases: [
        { input: "", expectedOutput: "contains <header>", description: "Has header element" },
        { input: "", expectedOutput: "contains <nav>", description: "Has navigation element" },
        { input: "", expectedOutput: "contains <main>", description: "Has main element" },
        { input: "", expectedOutput: "contains <article>", description: "Has article element" },
        { input: "", expectedOutput: "contains <footer>", description: "Has footer element" }
      ],
      language: "javascript",
      evaluationCriteria: ["Proper semantic elements", "Logical structure", "Accessibility considerations"]
    }
  },
  {
    id: "fs-v2-css-flexbox",
    title: "CSS Flexbox Mastery",
    description: "Master the Flexbox layout system for creating responsive, flexible layouts.",
    duration: "12 min",
    durationSeconds: 720,
    category: "frontend",
    level: "beginner",
    keyPoints: [
      "Flex container vs flex items",
      "Main axis and cross axis",
      "justify-content, align-items, align-content",
      "flex-grow, flex-shrink, flex-basis"
    ],
    quiz: [
      {
        id: "q1",
        question: "Which property centers items horizontally in a flex container?",
        type: "multiple_choice",
        options: ["align-items: center", "justify-content: center", "text-align: center", "margin: auto"],
        correctIndex: 1,
        explanation: "justify-content works on the main axis (horizontal by default), while align-items works on the cross axis.",
        language: "css"
      },
      {
        id: "q2",
        question: "Complete the CSS to create a centered flex container:",
        type: "code_completion",
        codeTemplate: `.container {
  display: flex;
  ___________: center;
  ___________: center;
  height: 100vh;
}`,
        expectedOutput: `justify-content, align-items`,
        explanation: "justify-content centers horizontally, align-items centers vertically.",
        language: "css"
      }
    ],
    taskAssessment: {
      id: "t2",
      title: "Create a Responsive Card Layout",
      prompt: "Build a responsive card grid that shows 3 cards per row on desktop, 2 on tablet, and 1 on mobile using Flexbox.",
      timeLimit: 240,
      starterCode: `/* Create a responsive flex layout */
.card-container {
  /* Add your flexbox styles */
}

.card {
  /* Card styling */
}`,
      testCases: [
        { input: "desktop", expectedOutput: "3 columns", description: "Desktop shows 3 cards per row" },
        { input: "tablet", expectedOutput: "2 columns", description: "Tablet shows 2 cards per row" },
        { input: "mobile", expectedOutput: "1 column", description: "Mobile shows 1 card per row" }
      ],
      language: "javascript",
      evaluationCriteria: ["Proper flex properties", "Responsive breakpoints", "Clean spacing"]
    }
  },
  {
    id: "fs-v3-js-fundamentals",
    title: "JavaScript Functions & Scope",
    description: "Understand how functions work, including closures and the different function syntaxes.",
    duration: "15 min",
    durationSeconds: 900,
    category: "frontend",
    level: "beginner",
    keyPoints: [
      "Function declarations vs expressions",
      "Arrow functions and this binding",
      "Closures and lexical scope",
      "Parameters, arguments, and default values"
    ],
    quiz: [
      {
        id: "q1",
        question: "What will this code output?",
        type: "code_output",
        codeTemplate: `function outer() {
  let count = 0;
  return function inner() {
    count++;
    return count;
  }
}
const counter = outer();
console.log(counter());
console.log(counter());`,
        expectedOutput: "1\n2",
        explanation: "This demonstrates a closure - inner() retains access to count from outer()'s scope.",
        language: "javascript"
      },
      {
        id: "q2",
        question: "Fix this arrow function:",
        type: "code_fix",
        codeTemplate: `const multiply = (a, b) {
  return a * b;
}`,
        expectedOutput: `const multiply = (a, b) => {
  return a * b;
}`,
        explanation: "Arrow functions use => syntax after the parameters.",
        language: "javascript"
      }
    ],
    taskAssessment: {
      id: "t3",
      title: "Create a Counter Factory",
      prompt: "Build a function that creates counter objects with increment, decrement, and getValue methods using closures.",
      timeLimit: 300,
      starterCode: `function createCounter(initialValue = 0) {
  // Your code here
  // Return an object with increment, decrement, and getValue methods
}

// Usage:
// const counter = createCounter(5);
// counter.increment(); // 6
// counter.decrement(); // 5
// counter.getValue(); // 5`,
      testCases: [
        { input: "createCounter(0).increment()", expectedOutput: "1", description: "Increment from 0" },
        { input: "createCounter(10).decrement()", expectedOutput: "9", description: "Decrement from 10" },
        { input: "createCounter(5).getValue()", expectedOutput: "5", description: "Get initial value" }
      ],
      language: "javascript",
      evaluationCriteria: ["Proper closure usage", "All methods work correctly", "Initial value handling"]
    }
  },

  // MODERATE LEVEL
  {
    id: "fs-v4-async-await",
    title: "Async/Await & Promises",
    description: "Master asynchronous JavaScript with Promises and async/await syntax.",
    duration: "15 min",
    durationSeconds: 900,
    category: "frontend",
    level: "moderate",
    keyPoints: [
      "Promise states: pending, fulfilled, rejected",
      "Async/await syntax and error handling",
      "Promise.all, Promise.race, Promise.allSettled",
      "Common async patterns and pitfalls"
    ],
    quiz: [
      {
        id: "q1",
        question: "What's wrong with this async code?",
        type: "code_fix",
        codeTemplate: `async function fetchUsers() {
  const users = fetch('/api/users');
  return users.json();
}`,
        expectedOutput: `async function fetchUsers() {
  const response = await fetch('/api/users');
  return response.json();
}`,
        explanation: "You need to await fetch() to get the response, then call .json() on it.",
        language: "javascript"
      },
      {
        id: "q2",
        question: "Which method waits for all promises but doesn't reject on failure?",
        type: "multiple_choice",
        options: ["Promise.all", "Promise.race", "Promise.allSettled", "Promise.any"],
        correctIndex: 2,
        explanation: "Promise.allSettled waits for all promises and returns their outcomes regardless of success/failure.",
        language: "javascript"
      }
    ],
    taskAssessment: {
      id: "t4",
      title: "Build a Retry Mechanism",
      prompt: "Create a function that retries a failed async operation up to 3 times with exponential backoff.",
      timeLimit: 360,
      starterCode: `async function retryWithBackoff(fn, maxRetries = 3) {
  // Implement retry logic with exponential backoff
  // Wait 1s, 2s, 4s between retries
}

// Test with:
// const unreliableFetch = async () => {
//   if (Math.random() < 0.7) throw new Error('Random failure');
//   return 'Success!';
// };`,
      testCases: [
        { input: "always succeeds", expectedOutput: "returns value", description: "Returns on success" },
        { input: "fails then succeeds", expectedOutput: "returns after retry", description: "Retries and succeeds" },
        { input: "always fails", expectedOutput: "throws after 3 tries", description: "Throws after max retries" }
      ],
      language: "javascript",
      evaluationCriteria: ["Proper async/await", "Exponential backoff", "Error handling"]
    }
  },
  {
    id: "fs-v5-react-hooks",
    title: "React Hooks Deep Dive",
    description: "Master useState, useEffect, and custom hooks for clean React components.",
    duration: "18 min",
    durationSeconds: 1080,
    category: "frontend",
    level: "moderate",
    keyPoints: [
      "useState for local component state",
      "useEffect for side effects and cleanup",
      "Dependency arrays and common pitfalls",
      "Building custom hooks for reuse"
    ],
    quiz: [
      {
        id: "q1",
        question: "What's the issue with this useEffect?",
        type: "code_fix",
        codeTemplate: `useEffect(() => {
  const interval = setInterval(() => {
    console.log('Tick');
  }, 1000);
});`,
        expectedOutput: `useEffect(() => {
  const interval = setInterval(() => {
    console.log('Tick');
  }, 1000);
  return () => clearInterval(interval);
}, []);`,
        explanation: "Missing cleanup function and dependency array causes memory leaks and re-runs on every render.",
        language: "typescript"
      }
    ],
    taskAssessment: {
      id: "t5",
      title: "Create a useLocalStorage Hook",
      prompt: "Build a custom hook that syncs state with localStorage, handling SSR and invalid JSON gracefully.",
      timeLimit: 420,
      starterCode: `function useLocalStorage(key, initialValue) {
  // 1. Initialize state from localStorage or initialValue
  // 2. Update localStorage when state changes
  // 3. Handle SSR (window might not exist)
  // 4. Handle invalid JSON in localStorage
  
  return [value, setValue];
}`,
      testCases: [
        { input: "set value", expectedOutput: "persists to localStorage", description: "Saves to localStorage" },
        { input: "reload page", expectedOutput: "restores value", description: "Restores from localStorage" },
        { input: "invalid JSON", expectedOutput: "uses initialValue", description: "Handles corrupt data" }
      ],
      language: "typescript",
      evaluationCriteria: ["Proper state initialization", "Sync with localStorage", "Error handling"]
    }
  },
  {
    id: "fs-v6-nodejs-basics",
    title: "Node.js & Express Fundamentals",
    description: "Build REST APIs with Express.js including routing, middleware, and error handling.",
    duration: "20 min",
    durationSeconds: 1200,
    category: "backend",
    level: "moderate",
    keyPoints: [
      "Express app setup and routing",
      "Middleware chain and next()",
      "Request and response objects",
      "Error handling middleware"
    ],
    quiz: [
      {
        id: "q1",
        question: "What's the correct order for Express middleware?",
        type: "multiple_choice",
        options: [
          "Routes → Error handler → Body parser",
          "Body parser → Routes → Error handler",
          "Error handler → Body parser → Routes",
          "Routes → Body parser → Error handler"
        ],
        correctIndex: 1,
        explanation: "Body parser must come before routes to parse request bodies. Error handlers come last.",
        language: "javascript"
      },
      {
        id: "q2",
        question: "Fix this error handling middleware:",
        type: "code_fix",
        codeTemplate: `app.use((err, req, res) => {
  res.status(500).json({ error: err.message });
});`,
        expectedOutput: `app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});`,
        explanation: "Error handling middleware must have 4 parameters (err, req, res, next) to be recognized.",
        language: "javascript"
      }
    ],
    taskAssessment: {
      id: "t6",
      title: "Build a CRUD API",
      prompt: "Create a complete REST API for a 'todos' resource with proper error handling and validation.",
      timeLimit: 600,
      starterCode: `const express = require('express');
const app = express();

app.use(express.json());

let todos = [];

// GET /todos - List all todos
// GET /todos/:id - Get single todo
// POST /todos - Create todo
// PUT /todos/:id - Update todo
// DELETE /todos/:id - Delete todo

// Your code here`,
      testCases: [
        { input: "POST /todos", expectedOutput: "201 Created", description: "Creates new todo" },
        { input: "GET /todos/invalid", expectedOutput: "404 Not Found", description: "Returns 404 for missing" },
        { input: "PUT /todos/1", expectedOutput: "200 OK", description: "Updates existing todo" }
      ],
      language: "javascript",
      evaluationCriteria: ["All CRUD operations", "Proper status codes", "Error handling"]
    }
  },

  // PRO LEVEL
  {
    id: "fs-v7-react-performance",
    title: "React Performance Optimization",
    description: "Learn to identify and fix performance issues in React applications.",
    duration: "20 min",
    durationSeconds: 1200,
    category: "frontend",
    level: "pro",
    keyPoints: [
      "React.memo and when to use it",
      "useMemo and useCallback",
      "Virtual list rendering",
      "Code splitting and lazy loading"
    ],
    quiz: [
      {
        id: "q1",
        question: "When should you use useMemo?",
        type: "multiple_choice",
        options: [
          "For every computed value",
          "For expensive computations with stable dependencies",
          "Instead of useState",
          "For all function props"
        ],
        correctIndex: 1,
        explanation: "useMemo should be used for expensive calculations that would slow down renders, not for everything.",
        language: "typescript"
      }
    ],
    taskAssessment: {
      id: "t7",
      title: "Optimize a Slow Component",
      prompt: "Fix the performance issues in this component that re-renders unnecessarily.",
      timeLimit: 480,
      starterCode: `function ExpensiveList({ items, filter, onSelect }) {
  const filteredItems = items.filter(item => 
    item.name.includes(filter)
  );
  
  return (
    <ul>
      {filteredItems.map(item => (
        <li key={item.id} onClick={() => onSelect(item.id)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
}`,
      testCases: [
        { input: "parent re-renders", expectedOutput: "child doesn't re-render if props same", description: "Memoized correctly" },
        { input: "items change", expectedOutput: "recalculates filter", description: "Updates when needed" }
      ],
      language: "typescript",
      evaluationCriteria: ["Proper memoization", "useCallback usage", "Performance improvement"]
    }
  },
  {
    id: "fs-v8-testing",
    title: "Testing Best Practices",
    description: "Write effective unit and integration tests for frontend and backend code.",
    duration: "18 min",
    durationSeconds: 1080,
    category: "testing",
    level: "pro",
    keyPoints: [
      "Test structure: Arrange, Act, Assert",
      "Mocking dependencies effectively",
      "Testing async code",
      "React Testing Library best practices"
    ],
    quiz: [
      {
        id: "q1",
        question: "What's the recommended query priority in React Testing Library?",
        type: "multiple_choice",
        options: [
          "getByTestId → getByRole → getByText",
          "getByRole → getByText → getByTestId",
          "getByText → getByRole → getByTestId",
          "getById → getByClass → getByRole"
        ],
        correctIndex: 1,
        explanation: "getByRole is preferred as it tests accessibility. getByTestId should be a last resort.",
        language: "typescript"
      }
    ],
    taskAssessment: {
      id: "t8",
      title: "Write Tests for a Component",
      prompt: "Write comprehensive tests for a LoginForm component including validation and submission.",
      timeLimit: 540,
      starterCode: `import { render, screen, fireEvent } from '@testing-library/react';

describe('LoginForm', () => {
  it('shows validation errors for empty fields', () => {
    // Your test here
  });
  
  it('calls onSubmit with credentials on valid form', () => {
    // Your test here
  });
  
  it('disables submit button while loading', () => {
    // Your test here
  });
});`,
      testCases: [
        { input: "empty form submit", expectedOutput: "shows errors", description: "Validates empty fields" },
        { input: "valid credentials", expectedOutput: "calls onSubmit", description: "Submits correctly" }
      ],
      language: "typescript",
      evaluationCriteria: ["Proper assertions", "User-centric queries", "Async handling"]
    }
  },

  // ULTRA PRO LEVEL
  {
    id: "fs-v9-system-design",
    title: "System Design Fundamentals",
    description: "Learn to design scalable, reliable systems for production environments.",
    duration: "25 min",
    durationSeconds: 1500,
    category: "architecture",
    level: "ultra_pro",
    keyPoints: [
      "Scalability patterns: horizontal vs vertical",
      "Database sharding and replication",
      "Caching strategies",
      "Load balancing and CDNs"
    ],
    quiz: [
      {
        id: "q1",
        question: "For a read-heavy application with 1M daily users, which scaling strategy is most appropriate?",
        type: "multiple_choice",
        options: [
          "Vertical scaling only",
          "Read replicas with caching",
          "Sharding by user ID",
          "Single database with indexes"
        ],
        correctIndex: 1,
        explanation: "Read-heavy workloads benefit from read replicas and caching to distribute load.",
        language: "javascript"
      }
    ],
    taskAssessment: {
      id: "t9",
      title: "Design a URL Shortener",
      prompt: "Design the architecture for a URL shortener handling 100M URLs with low latency.",
      timeLimit: 900,
      starterCode: `// Design a URL shortener system
// Consider:
// - How to generate unique short codes
// - Storage strategy for 100M+ URLs
// - Caching for popular URLs
// - High availability and redundancy

const systemDesign = {
  components: [],
  dataFlow: [],
  scalingStrategy: '',
  estimatedCapacity: {}
};`,
      testCases: [
        { input: "create short URL", expectedOutput: "< 100ms latency", description: "Fast URL creation" },
        { input: "redirect popular URL", expectedOutput: "cache hit", description: "Caching works" }
      ],
      language: "javascript",
      evaluationCriteria: ["Scalability consideration", "Data modeling", "Trade-off analysis"]
    }
  },
  {
    id: "fs-v10-security",
    title: "Web Security Deep Dive",
    description: "Understand and prevent common security vulnerabilities in web applications.",
    duration: "22 min",
    durationSeconds: 1320,
    category: "backend",
    level: "ultra_pro",
    keyPoints: [
      "OWASP Top 10 vulnerabilities",
      "XSS prevention and CSP",
      "SQL injection and parameterized queries",
      "Authentication security best practices"
    ],
    quiz: [
      {
        id: "q1",
        question: "Which is vulnerable to SQL injection?",
        type: "code_fix",
        codeTemplate: `const query = \`SELECT * FROM users WHERE id = \${userId}\`;
db.execute(query);`,
        expectedOutput: `const query = 'SELECT * FROM users WHERE id = ?';
db.execute(query, [userId]);`,
        explanation: "String interpolation allows SQL injection. Use parameterized queries instead.",
        language: "javascript"
      }
    ],
    taskAssessment: {
      id: "t10",
      title: "Secure an API Endpoint",
      prompt: "Review and fix security vulnerabilities in this user registration endpoint.",
      timeLimit: 600,
      starterCode: `app.post('/register', async (req, res) => {
  const { email, password, role } = req.body;
  
  // Create user directly
  const query = \`INSERT INTO users VALUES ('\${email}', '\${password}', '\${role}')\`;
  await db.execute(query);
  
  res.json({ message: 'User created', password });
});`,
      testCases: [
        { input: "SQL injection attempt", expectedOutput: "blocked", description: "Prevents SQL injection" },
        { input: "role escalation", expectedOutput: "blocked", description: "Validates role input" }
      ],
      language: "javascript",
      evaluationCriteria: ["SQL injection prevention", "Password handling", "Input validation"]
    }
  }
];
