const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (file.endsWith('.cs')) {
      results.push(full);
    }
  });
  return results;
}

const modelFiles = walk('backend/Models/DatabaseModels');

// Parse classes and properties
const classes = new Map();

modelFiles.forEach(filePath => {
  const content = fs.readFileSync(filePath, 'utf8');
  // Simple state machine or regex to find classes and their properties
  const lines = content.split('\n');
  let currentClass = null;
  let braceCount = 0;
  let classBraceLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Class declaration
    const classMatch = line.match(/^public\s+(?:sealed\s+)?class\s+(\w+)(?:\s*:\s*([^{\r\n]+))?/);
    if (classMatch) {
      currentClass = classMatch[1];
      const baseClass = classMatch[2] ? classMatch[2].trim() : '';
      classes.set(currentClass, {
        name: currentClass,
        file: filePath.replace(/\\/g, '/'),
        baseClass,
        properties: []
      });
      classBraceLevel = braceCount;
    }

    // Property declaration
    // e.g. public string Name { get; set; }
    // or [BsonElement("Name")] public string Name { get; set; }
    const propMatch = line.match(/(?:\[BsonElement\("([^"]+)"\)\]\s*)?public\s+(?:virtual\s+|override\s+)?([A-Za-z0-9_<>?, ]+)\s+(\w+)\s*\{\s*get;\s*set;\s*\}(?:\s*=\s*([^;]+);)?/);
    if (propMatch && currentClass) {
      const bsonName = propMatch[1] || propMatch[3];
      const type = propMatch[2].trim();
      const propName = propMatch[3];
      const defaultValue = propMatch[4] ? propMatch[4].trim() : (type.endsWith('?') ? 'null' : 'default');
      
      classes.get(currentClass).properties.push({
        name: propName,
        bsonName,
        type,
        defaultValue,
        isNullable: type.endsWith('?') || defaultValue === 'null',
      });
    }

    for (const ch of line) {
      if (ch === '{') braceCount++;
      if (ch === '}') {
        braceCount--;
        if (currentClass && braceCount <= classBraceLevel) {
          currentClass = null;
        }
      }
    }
  }
});

console.log('PARSED CLASSES:', classes.size);
fs.writeFileSync('scripts/parsed_classes.json', JSON.stringify(Array.from(classes.entries()), null, 2));
