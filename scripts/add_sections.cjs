/**
 * Script: add_sections.cjs
 * Adds a "sections" key to generatedCurriculum.json for all 11 phases
 * Maps existing phases into S1 through S11
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/generatedCurriculum.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Define all 11 sections of Rebon Full-Stack Curriculum based on phase_id
const sectionMapping = [
  {
    section_id: "S1",
    section_name: "Digital World",
    section_description: "Internet infrastructure, DNS, URL journey, HTTP, HTTPS, browser rendering",
    phase_id: "1"
  },
  {
    section_id: "S2",
    section_name: "HTML & CSS",
    section_description: "Semantic HTML, CSS box model + positioning, Flexbox + Grid, Responsive design",
    phase_id: "2"
  },
  {
    section_id: "S3",
    section_name: "JavaScript",
    section_description: "What JS does, Variables + types, Arrays + functions, Async + Promises, Fetch + Axios",
    phase_id: "3"
  },
  {
    section_id: "S4",
    section_name: "React",
    section_description: "Why React exists, Components + props + state, useEffect, Real patterns",
    phase_id: "4"
  },
  {
    section_id: "S5",
    section_name: "APIs & Backend Thinking",
    section_description: "Node.js, Express, REST APIs, HTTP requests, routing, status codes, backend architecture",
    phase_id: "5"
  },
  {
    section_id: "S6",
    section_name: "Databases & Data Systems",
    section_description: "Relational databases, SQL vs NoSQL, Postgres/Supabase, schemas, keys, queries, JOINs",
    phase_id: "6"
  },
  {
    section_id: "S7",
    section_name: "Authentication & Security",
    section_description: "Auth flow, JWT, session, cookies, encryption, Supabase Auth, security best practices",
    phase_id: "7"
  },
  {
    section_id: "S8",
    section_name: "Git & Deployment",
    section_description: "Git commands, branching, GitHub, Vercel/Netlify, environment variables, hosting, DNS setup",
    phase_id: "8"
  },
  {
    section_id: "S9",
    section_name: "React in the Real World",
    section_description: "React Router, client-side routing, protected routes, custom hooks, global state, performance",
    phase_id: "9"
  },
  {
    section_id: "S10",
    section_name: "The Developer Toolkit",
    section_description: "TypeScript, developer tools, package managers, linters, debuggers, production tooling",
    phase_id: "10"
  },
  {
    section_id: "S11",
    section_name: "Ship It",
    section_description: "Capstone full-stack project building, deployment, production optimization, final checklist",
    phase_id: "11"
  }
];

// Build sections from existing phases
const sections = sectionMapping.map(mapping => {
  const matchingPhase = data.phases.find(p => p.phase_id === mapping.phase_id);
  
  if (!matchingPhase) {
    console.warn(`WARNING: Phase ${mapping.phase_id} not found! Creating empty section.`);
    return {
      section_id: mapping.section_id,
      section_name: mapping.section_name,
      section_description: mapping.section_description,
      lessons: []
    };
  }

  console.log(`✓ Section ${mapping.section_id} (${mapping.section_name}): ${matchingPhase.lessons.length} lessons [${matchingPhase.lessons.map(l => l.lesson_id).join(', ')}]`);
  
  return {
    section_id: mapping.section_id,
    section_name: mapping.section_name,
    section_description: mapping.section_description,
    phase_name: matchingPhase.phase_name,
    phase_theme: matchingPhase.phase_theme,
    phase_purpose: matchingPhase.phase_purpose,
    lessons: matchingPhase.lessons
  };
});

// Build comprehensive plan metadata
const comprehensivePlan = {
  title: "Phase 1 & Phase 2 — Complete Full-Stack Plan",
  description: "55 lessons across 11 sections — Complete 2-month developer curriculum",
  sections_overview: sectionMapping.map(m => ({
    id: m.section_id,
    name: m.section_name,
    content: m.section_description
  }))
};

// Add sections key BEFORE phases in the JSON
const newData = {
  meta: {
    ...data.meta,
    total_phases: 11,
    total_lessons: 55,
    version: "3.0 — Complete"
  },
  comprehensive_plan: comprehensivePlan,
  sections,
  phases: data.phases,
  ...Object.fromEntries(
    Object.entries(data).filter(([k]) => !['meta', 'comprehensive_plan', 'sections', 'phases'].includes(k))
  )
};

fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf8');

const totalLessons = sections.reduce((sum, s) => sum + s.lessons.length, 0);
console.log(`\n✅ Done! Added ${sections.length} sections with ${totalLessons} total lessons to generatedCurriculum.json`);
console.log(`   File size: ${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB`);
