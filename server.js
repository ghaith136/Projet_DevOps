import express from 'express';

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.json({
    message: "API Météo DevOps",
    version: process.env.VERSION || "dev",
    endpoints: ["/", "/weather", "/health"]
  });
});

app.get('/weather', async (req, res) => {
  try {
    const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=36&longitude=10&current_weather=true');
    const data = await response.json();
    
    res.json({
      status: "success",
      temperature: data.current_weather?.temperature,
      windspeed: data.current_weather?.windspeed,
      time: data.current_weather?.time
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Unable to fetch weather"
    });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Serveur démarré sur port ${PORT}`);
});
