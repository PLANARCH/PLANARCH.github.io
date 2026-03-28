const fs = require('fs');
const path = require('path');

// Helper function to escape HTML characters safely
function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Function to parse markdown frontmatter and body
function parseMarkdown(content) {
  let title = "Untitled";
  let date = new Date().toISOString();
  let tags = [];
  let body = "";

  if (content.startsWith('---')) {
    const endMarkerIndex = content.indexOf('---', 3);
    if (endMarkerIndex !== -1) {
      const frontmatter = content.substring(3, endMarkerIndex).trim();
      const lines = frontmatter.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('title:')) {
          title = line.replace('title:', '').trim().replace(/^["']|["']$/g, '');
        } else if (line.startsWith('date:')) {
          date = line.replace('date:', '').trim();
        } else if (line.startsWith('tags:')) {
          const rawTags = line.replace('tags:', '').trim();
          try {
            tags = JSON.parse(rawTags);
          } catch (e) {
            // Fallback for non-JSON tag formats like [tag1, tag2]
            tags = rawTags.split(',').map(t => t.trim().replace(/^["']|["']$/g, ''));
          }
        } else if (line.startsWith('category:')) {
           // Extract category if needed, though we can derive from path
        }
      }
      
      body = content.substring(endMarkerIndex + 3).trim();
    } else {
      title = "Untitled";
      body = content;
    }
  } else {
    body = content;
  }

  return { title, date, tags, body };
}

// Main function to scan directories and generate data.json
function generateData() {
  const baseDir = path.join(__dirname); // docs folder
  
  // Define directories to scan relative to the script location (docs)
  // We skip 'posts' as it doesn't exist in this structure, focusing on existing ones like World_NEWS, TECH, Reviews, Gadget_Review
  const targetDirs = [
    path.join(baseDir, 'World_NEWS'),
    path.join(baseDir, 'TECH'),
    path.join(baseDir, 'Reviews'),
    path.join(baseDir, 'Gadget_Review') // Check if this exists as a subfolder or top level
  ];

  const data = [];

  targetDirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    
    for (const file of files) {
      try {
        const filePath = path.join(dir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Get relative path from docs folder for linking purposes
        const relativePath = path.relative(baseDir, filePath);
        
        const parsed = parseMarkdown(content);

        data.push({
          filename: file.replace('.md', ''),
          title: escapeHtml(parsed.title),
          date: parsed.date,
          tags: parsed.tags.map(t => escapeHtml(String(t))), // Ensure strings and escaped
          body: parsed.body, // Body is often markdown, we might want to keep it raw or escape. Keeping raw for markdown rendering usually better.
          path: relativePath
        });

      } catch (err) {
        console.error(`Error processing ${file}:`, err.message);
      }
    }
  });

  // Write to data.json in the same directory as this script
  const outputPath = path.join(__dirname, 'data.json');
  
  try {
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ Successfully generated ${outputPath} with ${data.length} entries.`);
  } catch (err) {
    console.error('❌ Failed to write data.json:', err.message);
  }

  return data;
}

// Execute if run directly
if (require.main === module) {
  generateData();
}

module.exports = { generateData };