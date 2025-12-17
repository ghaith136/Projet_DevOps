import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send("API OK");
});

app.get('/weather', async (req, res) => {
  try {
    const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=36&longitude=10&current_weather=true');
    const data = await response.json();
    
    res.json({
      status: "success",
      temperature: data.current_weather.temperature
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Unable to fetch weather"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
