import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = 3000;

// Simple HTML interface
const htmlInterface = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weather App</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
        }
        
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 15px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
            width: 100%;
        }
        
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        
        .weather-card {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 30px;
            margin: 20px 0;
            border: 1px solid #e9ecef;
        }
        
        .temperature {
            font-size: 48px;
            font-weight: bold;
            color: #667eea;
            margin: 10px 0;
        }
        
        .unit {
            font-size: 24px;
            color: #666;
        }
        
        .status {
            display: inline-block;
            padding: 8px 16px;
            background: #e7f5ff;
            color: #1864ab;
            border-radius: 20px;
            font-size: 14px;
            margin-bottom: 20px;
        }
        
        .btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 25px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 20px;
        }
        
        .btn:hover {
            background: #5a67d8;
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.2);
        }
        
        .loading {
            color: #666;
            font-style: italic;
        }
        
        .error {
            color: #ff6b6b;
            background: #ffe3e3;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
        
        .info {
            color: #666;
            font-size: 14px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌤️ Weather App</h1>
        <div class="weather-card">
            <div class="status" id="status">Ready</div>
            <div id="temperatureDisplay">
                <div class="loading">Click the button to get weather</div>
            </div>
        </div>
        
        <button class="btn" onclick="getWeather()">Get Current Weather</button>
        
        <div class="info">
            Location: Tunis, Tunisia (36°N, 10°E)<br>
            Data provided by Open-Meteo API
        </div>
    </div>
    
    <script>
        async function getWeather() {
            const statusEl = document.getElementById('status');
            const tempDisplay = document.getElementById('temperatureDisplay');
            
            statusEl.textContent = 'Loading...';
            statusEl.style.background = '#fff3cd';
            statusEl.style.color = '#856404';
            
            tempDisplay.innerHTML = '<div class="loading">Fetching weather data...</div>';
            
            try {
                const response = await fetch('/weather');
                const data = await response.json();
                
                if (data.status === 'success') {
                    statusEl.textContent = 'Live Weather';
                    statusEl.style.background = '#d4edda';
                    statusEl.style.color = '#155724';
                    
                    tempDisplay.innerHTML = \`
                        <div class="temperature">\${data.temperature}<span class="unit">°C</span></div>
                        <div>Current Temperature</div>
                    \`;
                } else {
                    throw new Error(data.message || 'Failed to fetch weather');
                }
            } catch (error) {
                statusEl.textContent = 'Error';
                statusEl.style.background = '#f8d7da';
                statusEl.style.color = '#721c24';
                
                tempDisplay.innerHTML = \`
                    <div class="error">\${error.message}</div>
                    <div>Please try again</div>
                \`;
            }
        }
    </script>
</body>
</html>
`;

app.get('/', (req, res) => {
  res.send(htmlInterface);
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
  console.log(`Open your browser and go to: http://localhost:${PORT}`);
});