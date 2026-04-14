const axios = require('axios');
const cheerio = require('cheerio');

// Google Search function using axios and cheerio
const googleSearch = async (query) => {
  try {
    console.log('🔍 Searching Google for:', query);
    
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    
    // Fetch search results with a browser user agent
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 5000
    });

    const $ = cheerio.load(response.data);
    const results = [];

    // Parse Google search results
    $('div.g').each((index, element) => {
      if (results.length >= 3) return; // Get top 3 results

      const titleElement = $(element).find('h3');
      const linkElement = $(element).find('a');
      const descriptionElement = $(element).find('div[style*="line-height"]');

      if (titleElement.length > 0 && linkElement.length > 0) {
        const title = titleElement.text().trim();
        const link = linkElement.attr('href');
        const description = descriptionElement.text().trim() || 'No description available';

        // Filter out unwanted results
        if (title && link && !link.includes('google.com/search')) {
          results.push({
            title,
            link: link.startsWith('http') ? link : `https://${link}`,
            description: description.substring(0, 150)
          });
        }
      }
    });

    console.log(`✅ Found ${results.length} results`);
    return results;
  } catch (error) {
    console.error('❌ Google search error:', error.message);
    return [];
  }
};

// Format search results for bot response
const formatSearchResults = (results) => {
  if (results.length === 0) {
    return '\n📍 No search results found.';
  }

  let formatted = '\n\n📍 **Search Results:**\n';
  results.forEach((result, index) => {
    formatted += `\n${index + 1}. **${result.title}**\n   ${result.description}\n   🔗 ${result.link}`;
  });

  return formatted;
};

module.exports = {
  googleSearch,
  formatSearchResults
};
