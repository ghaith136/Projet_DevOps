import express from 'express';

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send("API Météo OK");
});

app.get('/weather', async (req, res) => {
  try {
    // Utiliser fetch natif de Node 18+
    const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=36&longitude=10&current_weather=true');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    res.json({
      status: "success",
      temperature: data.current_weather?.temperature || 'N/A',
      windspeed: data.current_weather?.windspeed || 'N/A',
      time: data.current_weather?.time || 'N/A'
    });
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({
      status: "error",
      message: "Unable to fetch weather data",
      error: error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'meteo-api',
    timestamp: new Date().toISOString()
  });
});

// IMPORTANT: Écouter sur 0.0.0.0 pour Docker
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Serveur Météo démarré sur http://0.0.0.0:${PORT}`);
  console.log(`📡 Endpoints disponibles:`);
  console.log(`   - GET /          → API status`);
  console.log(`   - GET /weather   → Données météo`);
  console.log(`   - GET /health    → Health check`);
});
