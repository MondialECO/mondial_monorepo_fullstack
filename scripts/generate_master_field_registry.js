const fs = require('fs');

const enriched = JSON.parse(fs.readFileSync('scripts/enriched_collections.json', 'utf8'));
const parsedClasses = new Map(JSON.parse(fs.readFileSync('scripts/parsed_classes.json', 'utf8')));

// Recursive expander for embedded classes
function expandProperties(className, prefix = '', visited = new Set()) {
  if (visited.has(className)) return [];
  visited.add(className);

  const c = parsedClasses.get(className);
  if (!c) return [];

  let fields = [];
  c.properties.forEach(p => {
    const fullPath = prefix ? `${prefix}.${p.name}` : p.name;
    const cleanType = p.type.replace(/List<([^>]+)>/, '$1').replace(/\?/, '').trim();
    const isArray = p.type.includes('List<') || p.type.endsWith('[]');
    const isEmbedded = parsedClasses.has(cleanType);

    fields.push({
      fieldPath: fullPath,
      property: p.name,
      bsonName: p.bsonName,
      type: p.type,
      defaultValue: p.defaultValue,
      isNullable: p.isNullable,
      isArray,
      isEmbedded
    });

    if (isEmbedded && !visited.has(cleanType)) {
      const nested = expandProperties(cleanType, fullPath, new Set(visited));
      fields = fields.concat(nested);
    }
  });

  return fields;
}

const masterRegistry = [];

enriched.forEach(col => {
  const fields = expandProperties(col.model, col.collection);
  masterRegistry.push({
    collection: col.collection,
    model: col.model,
    primaryFile: col.primaryFile,
    fieldCount: fields.length,
    fields: fields
  });
});

const artifactPath = 'C:/Users/Siraj/.gemini/antigravity-ide/brain/2d0daa45-d34e-40bc-b9cb-4f345668ad58/master_database_field_registry.json';
fs.writeFileSync(artifactPath, JSON.stringify(masterRegistry, null, 2));

console.log('MASTER REGISTRY GENERATED.');
console.log('Total Collections:', masterRegistry.length);
let totalFields = 0;
masterRegistry.forEach(m => totalFields += m.fieldCount);
console.log('Total Deep Fields Cataloged:', totalFields);
