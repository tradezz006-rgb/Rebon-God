import { ProfessionalScenario } from '../../types/database';

export const professionalScenariosSeed: ProfessionalScenario[] = [
  {
    id: "PS_001_beg",
    role: "Junior Web Developer",
    problem_statement: "The company's landing page is running slowly because the main hero image is 15MB, taking several seconds to load over normal internet connections and violating standard client-server efficiency.",
    company_context: "You are working at a fast-paced e-commerce startup. The marketing team just uploaded a massive high-res photo to the homepage, but customers are complaining the site is 'broken' because it takes so long to load.",
    required_skills: [
      "HTML",
      "Network Panel Debugging",
      "Basic understanding of Client-Server bandwidth limits"
    ],
    steps_to_solve: [
      "Open the browser's Developer Tools network tab.",
      "Refresh the page and identify the 15MB massive image file.",
      "Download the image and resize/compress it down to web standards (e.g. converting to WebP underneath 300KB).",
      "Replace the old image link in the HTML payload with the compressed version."
    ],
    common_mistakes: [
      "Using CSS `width` and `height` to make the image look smaller without actually reducing the file size.",
      "Deleting the image entirely without communicating with the marketing team."
    ],
    hints_level_1: [
      "Check how long the browser client is waiting for the server to send that one image."
    ],
    hints_level_2: [
      "Look into modern image formats like WebP or AVIF for the web, instead of raw PNGs."
    ],
    final_solution: "Successfully compressed `hero-image.png` (15MB) into `hero-image.webp` (150KB) and updated the `<img src=\"...\">` tag in `index.html`. Page load time reduced by 95%.",
    evaluation_metrics: [
      "Image size reduction achieved",
      "Page load time improved",
      "Original aspect ratio maintained"
    ],
    time_expected: 30, // 30 minutes
    difficulty_level: "Beginner"
  },
  {
    id: "PS_002_mod",
    role: "Backend API Developer",
    problem_statement: "Our mobile app team reported that the `/api/v1/users/login` endpoint is suddenly returning a 500 Internal Server Error when users try to log in, blocking thousands of people.",
    company_context: "You are on-call at a mid-sized SaaS company. The issue started directly after a recent database migration. The mobile app needs a JSON response to proceed, but the server is completely failing.",
    required_skills: [
      "RESTful API Debugging",
      "HTTP Status Codes",
      "JSON Parsing",
      "Log Analysis"
    ],
    steps_to_solve: [
      "Check server logs for the stack trace associated with the 500 error on the `/login` route.",
      "Identify the failed database query for the `users` table looking up the email address.",
      "Discover the migration renamed the column from `email_address` to `email`, but the API code wasn't updated.",
      "Update the backend SQL query or ORM to query the `email` column instead.",
      "Deploy the hotfix and test the HTTP POST request using Postman or cURL."
    ],
    common_mistakes: [
      "Telling the mobile team to just 'try again later' without checking logs.",
      "Returning a 200 OK with an error message in the JSON payload, breaking REST standards."
    ],
    hints_level_1: [
      "A 500 status code usually means the server hit an unhandled exception. Read the server application logs."
    ],
    hints_level_2: [
      "Compare the API route's SQL query with the actual schema of the `users` table in the database."
    ],
    final_solution: "Updated the login controller's `SELECT * FROM users WHERE email_address = ?` to `SELECT * FROM users WHERE email = ?` matching the new database schema. API now correctly returns HTTP 200 and a JWT token.",
    evaluation_metrics: [
      "Correct log analysis",
      "Fix database schema mismatch",
      "Postman/cURL verification of HTTP 200 success"
    ],
    time_expected: 60,
    difficulty_level: "Moderate"
  }
];
