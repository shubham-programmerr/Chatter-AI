// Comprehensive bad words list - keep base forms only, no common words with bad word substrings
const BAD_WORDS = [
  'fuck', 'shit', 'damn', 'crap', 'ass', 'bitch', 'bastard', 'asshole', 'motherfucker',
  'dick', 'cock', 'pussy', 'twat', 'whore', 'slut', 'prick', 'arsehole', 'bollocks',
  'cunt', 'dildo', 'piss', 'arse', 'fart', 'turd', 'shitty', 'damned', 'goddamn',
  'nob', 'knob', 'wanker', 'shag', 'bugger', 'bullshit', 'horseshit', 'batshit',
  'nigger', 'nigga', 'faggot', 'fag', 'dike', 'dyke', 'chink', 'gook', 'spic',
  'wetback', 'cracker', 'honky', 'kike', 'paki',
  'porn', 'xxx', 'viagra', 'cialis', 'casino', 'levitra',
  'nazi', 'racist', 'racism', 'sexist', 'sexism', 'rape', 'rapist',
  'pedophile', 'pedo', 'kys', 'kill yourself'
];

/**
 * Filter content for profanity with smart pattern matching
 * Detects base words and their common variations (fucking, shitty, etc.)
 * @param {string} content - Message content to filter
 * @returns {Object} - { isFlagged: boolean, flaggedWords: string[], cleanContent: string }
 */
const filterContent = (content) => {
  try {
    if (!content || typeof content !== 'string') {
      return {
        isFlagged: false,
        flaggedWords: [],
        cleanContent: content
      };
    }

    const lowerContent = content.toLowerCase();
    let cleanContent = content;
    const foundBadWords = new Set();

    // Check for each bad word with variations
    BAD_WORDS.forEach(badWord => {
      // Escape special regex characters in the bad word
      const escapedWord = badWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // For multi-word phrases, just use substring match
      if (badWord.includes(' ')) {
        const regex = new RegExp(escapedWord, 'gi');
        if (regex.test(lowerContent)) {
          foundBadWords.add(badWord);
          cleanContent = cleanContent.replace(
            new RegExp(escapedWord, 'gi'),
            (match) => '*'.repeat(match.length)
          );
        }
        return;
      }
      
      // For single-word bad words, create patterns with common suffixes
      // Match: word, word-ing, word-ed, word-s, word-er, word-ly, etc.
      const variations = [
        escapedWord,                // exact word
        `${escapedWord}s`,          // plural
        `${escapedWord}ed`,         // past tense
        `${escapedWord}ing`,        // gerund (-ing)
        `${escapedWord}er`,         // comparative
        `${escapedWord}ers`,        // plural comparative
        `${escapedWord}ings`,       // plural gerund
        `${escapedWord}ly`,         // adverb
        `${escapedWord}y`,          // adjective
        `${escapedWord}ier`,        // comparative adjective
        `${escapedWord}iest`,       // superlative adjective
        `${escapedWord}'s`,         // possessive
      ];
      
      // Try each variation with word boundary to avoid partial matches
      variations.forEach(variation => {
        const pattern = `\\b${variation}\\b`;
        const regex = new RegExp(pattern, 'gi');
        
        if (regex.test(lowerContent)) {
          foundBadWords.add(badWord);
          // Replace all occurrences
          cleanContent = cleanContent.replace(
            new RegExp(pattern, 'gi'),
            (match) => '*'.repeat(match.length)
          );
        }
      });
    });

    const isFlagged = foundBadWords.size > 0;

    return {
      isFlagged,
      flaggedWords: Array.from(foundBadWords),
      cleanContent
    };
  } catch (error) {
    console.error('Content filter error:', error);
    return {
      isFlagged: false,
      flaggedWords: [],
      cleanContent: content
    };
  }
};

module.exports = {
  filterContent
};
