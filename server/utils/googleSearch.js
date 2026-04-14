const axios = require('axios');

// Using DuckDuckGo API (more reliable than scraping Google)
const googleSearch = async (query) => {
  try {
    console.log('🔍 Searching for:', query);
    
    // Try multiple search methods for reliability
    let results = [];
    
    // Method 1: Try DuckDuckGo Instant Answer API
    try {
      const ddgResponse = await axios.get('https://api.duckduckgo.com/', {
        params: {
          q: query,
          format: 'json',
          no_html: 1,
          skip_disambig: 1
        },
        timeout: 5000
      });

      if (ddgResponse.data.AbstractText) {
        results.push({
          title: ddgResponse.data.Heading || 'DuckDuckGo Result',
          description: ddgResponse.data.AbstractText,
          link: ddgResponse.data.AbstractURL || 'https://duckduckgo.com/?q=' + encodeURIComponent(query)
        });
      }

      // Get related topics as additional results
      if (ddgResponse.data.RelatedTopics && ddgResponse.data.RelatedTopics.length > 0) {
        ddgResponse.data.RelatedTopics.slice(0, 3).forEach((topic, index) => {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.substring(0, 60),
              description: topic.Text.substring(0, 150),
              link: 'https://duckduckgo.com' + topic.FirstURL
            });
          }
        });
      }
    } catch (ddgError) {
      console.log('⚠️ DuckDuckGo API error, trying alternative...', ddgError.message);
    }

    // If DuckDuckGo fails, try a simple web search approach
    if (results.length === 0) {
      console.log('📡 Trying alternative search method via Wikipedia...');
      try {
        const wikiResponse = await axios.get('https://en.wikipedia.org/w/api.php', {
          params: {
            action: 'query',
            list: 'search',
            srsearch: query,
            format: 'json',
            srlimit: 3
          },
          timeout: 5000
        });

        if (wikiResponse.data.query.search.length > 0) {
          wikiResponse.data.query.search.forEach((item) => {
            results.push({
              title: item.title,
              description: item.snippet.replace(/<[^>]*>/g, ''),
              link: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`
            });
          });
        }
      } catch (wikiError) {
        console.log('⚠️ Wikipedia search error:', wikiError.message);
      }
    }

    console.log(`✅ Found ${results.length} results`);
    return results;
  } catch (error) {
    console.error('❌ Search error:', error.message);
    return [];
  }
};

// Format search results for bot response
const formatSearchResults = (results) => {
  if (results.length === 0) {
    return '';
  }

  let formatted = '\n\n📍 **Search Results for Reference:**\n';
  results.forEach((result, index) => {
    formatted += `\n${index + 1}. **${result.title}**\n   ${result.description.substring(0, 200)}...\n   🔗 [Read More](${result.link})`;
  });

  return formatted;
};

module.exports = {
  googleSearch,
  formatSearchResults
};
