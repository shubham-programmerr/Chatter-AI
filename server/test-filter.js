const { filterContent } = require('./utils/contentFilter');

// Test cases
const testMessages = [
  'Hello, this is a normal message',
  'This is fucking bullshit',
  'I hate spam and viagra ads',
  "That's shit! Damn it!",
  'You are a bastard and an asshole',
  'Normal conversation here',
  'FUCK THIS! SHIT is everywhere',
  'hello world fuck',
  'test shit test'
];

console.log('\n=== PROFANITY FILTER TEST ===\n');

testMessages.forEach(msg => {
  const result = filterContent(msg);
  console.log(`Original:  "${msg}"`);
  console.log(`Flagged:   ${result.isFlagged}`);
  console.log(`Words:     ${result.flaggedWords.join(', ') || 'none'}`);
  console.log(`Cleaned:   "${result.cleanContent}"`);
  console.log('---');
});

console.log('\n=== END TEST ===\n');
