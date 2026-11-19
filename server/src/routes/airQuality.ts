import { Router } from 'express';
import { airQualityService } from '../services/airQualityService.js';

const router = Router();

// Current Air Quality for coordinates/city
router.get('/current', async (req, res) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : 19.0760;
    const lon = req.query.lon ? parseFloat(req.query.lon as string) : 72.8777;
    const city = (req.query.city as string) || 'Mumbai';
    const neighbourhood = (req.query.neighbourhood as string) || 'Bandra West';

    const report = await airQualityService.getAirQuality(lat, lon, city, neighbourhood);
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve air quality data', message: err.message });
  }
});

// CPCB Sub-index calculator utility
router.post('/calculate-aqi', (req, res) => {
  try {
    const { pollutant, concentration } = req.body;
    if (!pollutant || concentration === undefined) {
      res.status(400).json({ error: 'Pollutant name and concentration are required' });
      return;
    }

    const subIndex = airQualityService.calculateCpcbSubIndex(pollutant, parseFloat(concentration));
    const category = airQualityService.getCpcbCategory(subIndex);

    res.json({
      pollutant,
      concentration,
      subIndex,
      category,
      isAvailable: subIndex !== null,
      standard: 'CPCB National Air Quality Index (India)'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Calculation failed', message: err.message });
  }
});

export default router;
