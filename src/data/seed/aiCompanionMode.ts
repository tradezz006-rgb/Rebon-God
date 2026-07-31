import { AICompanionTask } from '../../types/database';

export const aiCompanionTasksSeed: AICompanionTask[] = [
  {
    task_id: "AI_001_p1",
    scenario_link: "PS_002_mod",
    without_ai_approach: "Manually searching Stack Overflow for the specific database error and spending hours scanning through source code logs to locate the broken SQL query manually.",
    with_ai_approach: "Pasting the exact error log trace into ChatGPT or Copilot and asking it to pinpoint the failing line and likely cause, speeding up debugging by 80%.",
    correct_prompt_examples: [
      "Here is my Node.js error log output ending in a 500 status code: [PASTE LOG]. Can you analyze this stack trace and tell me which function is throwing the error and why the database query failed?"
    ],
    bad_prompt_examples: [
      "My API is broken, fix it please.",
      "Why is my backend returning 500?"
    ],
    ai_output_validation_steps: [
      "Never trust the AI's provided SQL statement blindly.",
      "Always check the actual database schema using `DESCRIBE users;` to confirm the AI's suggested column names actually exist.",
      "Test the AI's suggested code in a local environment first, never straight to production."
    ],
    when_not_to_use_ai: "Do not paste sensitive user data (like raw PII, passwords, or production database connection strings) into public AI models like ChatGPT.",
    tool_used: 'ChatGPT'
  }
];
