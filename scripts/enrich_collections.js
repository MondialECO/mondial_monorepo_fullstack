const fs = require('fs');

const collections = JSON.parse(fs.readFileSync('scripts/scan_collections.js', 'utf8') ? '[]' : '[]');
// Read scan_collections.js logic to get the 93 collections
const execSync = require('child_process').execSync;
const scanOutput = execSync('node scripts/scan_collections.js', { encoding: 'utf8' });
const colLines = scanOutput.trim().split('\n').slice(1).map(l => JSON.parse(l));

const parsedClasses = new Map(JSON.parse(fs.readFileSync('scripts/parsed_classes.json', 'utf8')));

// Map known classes for repos that had model 'Unknown'
const unknownOverrides = {
  'AICredits': 'AiCreditLedger',
  'AIFeedback': 'AiFeedback',
  'AIInsights': 'AiInsight',
  'AIRequests': 'AiRequest',
  'AIResponses': 'AiResponse',
  'BackgroundJobs': 'BackgroundJobRecord',
  'BusinessPlanSessions': 'BusinessPlanSession',
  'ClarifierSessions': 'ClarifierSession',
  'ForecastSessions': 'ForecastSession',
  'ModelUsage': 'AiModelUsage',
  'PromptVersions': 'PromptVersion'
};

const enriched = colLines.map(c => {
  let modelName = c.model;
  if (modelName === 'Unknown' && unknownOverrides[c.collection]) {
    modelName = unknownOverrides[c.collection];
  }
  const classInfo = parsedClasses.get(modelName);
  return {
    collection: c.collection,
    model: modelName,
    primaryFile: c.primaryFile,
    hasParsedClass: !!classInfo,
    properties: classInfo ? classInfo.properties : []
  };
});

fs.writeFileSync('scripts/enriched_collections.json', JSON.stringify(enriched, null, 2));
console.log('Enriched collections count:', enriched.length);
let matched = enriched.filter(e => e.hasParsedClass).length;
console.log('Collections matched with parsed classes:', matched);
