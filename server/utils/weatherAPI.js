const axios = require('axios');

// Get weather information
const getWeather = async (location) => {
  try {
    console.log('🌤️ Fetching weather for:', location);
    
    // Use Open-Meteo API (free, no API key required)
    const geoResponse = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
      params: {
        name: location,
        count: 1,
        language: 'en',
        format: 'json'
      },
      timeout: 5000
    });

    if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
      return null;
    }

    const geo = geoResponse.data.results[0];
    const { latitude, longitude, name, country } = geo;

    // Get weather data
    const weatherResponse = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude,
        longitude,
        current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
        temperature_unit: 'celsius',
        wind_speed_unit: 'kmh'
      },
      timeout: 5000
    });

    const current = weatherResponse.data.current;
    const weatherDesc = getWeatherDescription(current.weather_code);

    return {
      location: `${name}, ${country}`,
      temperature: current.temperature_2m,
      condition: weatherDesc,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m
    };
  } catch (error) {
    console.error('❌ Weather lookup error:', error.message);
    return null;
  }
};

// Decode WMO weather codes to descriptions
const getWeatherDescription = (code) => {
  const weatherCodes = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };

  return weatherCodes[code] || 'Unknown';
};

// Format weather for bot response
const formatWeather = (weather) => {
  if (!weather) return '';

  return `\n\n🌤️ **Weather for ${weather.location}:**
- 🌡️ Temperature: ${weather.temperature}°C
- ☁️ Condition: ${weather.condition}
- 💧 Humidity: ${weather.humidity}%
- 💨 Wind Speed: ${weather.windSpeed} km/h`;
};

module.exports = {
  getWeather,
  formatWeather
};
