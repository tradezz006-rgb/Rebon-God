const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/data/sessions/session1_workspace_tasks.json');
let raw = fs.readFileSync(filePath, 'utf8');

// The file currently has:
//   "C1.1": { ... }
//   }
// }
// 
// "C1.2": { ...
// we need to fix it.

// Let's just manually reconstruct the lessons object.
// We can use regex to extract all "C1.x": { ...workspace_tasks: [...] }
const regex = /"C1\.\d":\s*\{\s*"workspace_tasks":\s*\[[\s\S]*?(?="C1\.\d":\s*\{\s*"workspace_tasks"|\s*$)/g;
const matches = raw.match(regex);

if (matches) {
  console.log(`Found ${matches.length} lesson blocks.`);
  let combined = matches.join(',\n');
  
  // Clean up trailing brackets at the very end if they exist and are malformed
  combined = combined.replace(/\]\s*\}\s*\]\s*\}\s*$/g, '] }');

  const finalJson = `{
  "session_id": "CS1",
  "domain": "cloud",
  "lessons": {
    ${combined}
  }
}`;

  try {
    const parsed = JSON.parse(finalJson);
    console.log('Parsed successfully. Lessons:', Object.keys(parsed.lessons));
    fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2));
    console.log('File written successfully.');
  } catch (e) {
    console.error('Error parsing reconstructed JSON:', e.message);
    // Print a bit around the error
    const posMatch = e.message.match(/position (\d+)/);
    if (posMatch) {
        const pos = parseInt(posMatch[1]);
        console.log("Around error:", finalJson.substring(Math.max(0, pos - 50), pos + 50));
    }
  }
} else {
  console.log("No matches found.");
}
