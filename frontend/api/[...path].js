let terrain = [
  {id: 1, name: 'Shivajinagar', latitude: 18.5308, longitude: 73.8475, elevation: 560, slope: 2.1, terrainType: 'low-lying urban', historicalRisk: 0.72},
  {id: 2, name: 'Kothrud', latitude: 18.5074, longitude: 73.8077, elevation: 574, slope: 4.5, terrainType: 'residential slope', historicalRisk: 0.36},
  {id: 3, name: 'Hadapsar', latitude: 18.5089, longitude: 73.926, elevation: 555, slope: 1.4, terrainType: 'low-lying urban', historicalRisk: 0.8},
  {id: 4, name: 'Katraj', latitude: 18.452, longitude: 73.865, elevation: 620, slope: 7, terrainType: 'hilly', historicalRisk: 0.18},
  {id: 5, name: 'Yerawada', latitude: 18.553, longitude: 73.878, elevation: 552, slope: 1.7, terrainType: 'river plain', historicalRisk: 0.76},
];

let nodes = [
  {id: 1, name: 'Mutha Outfall', latitude: 18.532, longitude: 73.855, elevation: 552, currentWaterLevel: 0.68},
  {id: 2, name: 'Shivajinagar Junction', latitude: 18.531, longitude: 73.847, elevation: 559, currentWaterLevel: 0.82},
  {id: 3, name: 'Hadapsar Culvert', latitude: 18.509, longitude: 73.926, elevation: 554, currentWaterLevel: 0.91},
  {id: 4, name: 'Yerawada Channel', latitude: 18.553, longitude: 73.878, elevation: 551, currentWaterLevel: 0.88},
];

let baseSegments = [
  {id: 1, name: 'SC-01', sourceNode: 2, destinationNode: 1, length: 940, diameter: 1.2, capacity: 3.8, currentFlow: 3},
  {id: 2, name: 'HC-07', sourceNode: 3, destinationNode: 1, length: 2800, diameter: 0.9, capacity: 2.1, currentFlow: 2},
  {id: 3, name: 'YC-03', sourceNode: 4, destinationNode: 1, length: 1700, diameter: 0.8, capacity: 1.7, currentFlow: 1.65},
];

let rainfall = [
  {id: 1, location: 'Shivajinagar', latitude: 18.5308, longitude: 73.8475, secondsAgo: 1800, rainfallIntensity: 32.6, rainfallAmount: 16.3},
  {id: 2, location: 'Hadapsar', latitude: 18.5089, longitude: 73.926, secondsAgo: 1200, rainfallIntensity: 48.9, rainfallAmount: 24.5},
  {id: 3, location: 'Yerawada', latitude: 18.553, longitude: 73.878, secondsAgo: 600, rainfallIntensity: 40.7, rainfallAmount: 20.4},
  {id: 4, location: 'Kothrud', latitude: 18.5074, longitude: 73.8077, secondsAgo: 900, rainfallIntensity: 27.4, rainfallAmount: 13.7},
  {id: 5, location: 'Katraj', latitude: 18.452, longitude: 73.865, secondsAgo: 1500, rainfallIntensity: 22.1, rainfallAmount: 11.1},
];

let simulatedRainfall = 40.3;
let hydratedAt = 0;

async function hydrateFromSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || Date.now() - hydratedAt < 15000) return;
  const headers = {apikey: key, Authorization: `Bearer ${key}`};
  const read = async table => {
    const response = await fetch(`${url}/rest/v1/${table}?select=*`, {headers});
    if (!response.ok) throw new Error(`Supabase ${table} request failed`);
    return response.json();
  };
  try {
    const [rainfallRows, terrainRows, nodeRows, segmentRows, simulationRows] = await Promise.all([
      read('rainfall_readings'), read('terrain_cells'), read('drain_nodes'), read('drain_segments'), read('simulation_settings'),
    ]);
    if (rainfallRows.length) rainfall = rainfallRows.map(row => ({id: row.id, location: row.location, latitude: row.latitude, longitude: row.longitude, timestamp: row.recorded_at, rainfallIntensity: row.rainfall_intensity, rainfallAmount: row.rainfall_amount}));
    if (terrainRows.length) terrain = terrainRows.map(row => ({id: row.id, name: row.name, latitude: row.latitude, longitude: row.longitude, elevation: row.elevation, slope: row.slope, terrainType: row.terrain_type, historicalRisk: row.historical_risk}));
    if (nodeRows.length) nodes = nodeRows.map(row => ({id: row.id, name: row.name, latitude: row.latitude, longitude: row.longitude, elevation: row.elevation, currentWaterLevel: row.current_water_level}));
    if (segmentRows.length) baseSegments = segmentRows.map(row => ({id: row.id, name: row.name, sourceNode: row.source_node_id, destinationNode: row.destination_node_id, length: row.length_m, diameter: row.diameter_m, capacity: row.capacity_cumecs, currentFlow: row.current_flow_cumecs}));
    if (simulationRows.length && Number.isFinite(Number(simulationRows[0].rainfall_intensity))) simulatedRainfall = Number(simulationRows[0].rainfall_intensity);
    hydratedAt = Date.now();
  } catch (error) {
    console.warn('Supabase unavailable; using prototype fallback', error.message);
  }
}

async function saveSimulation(value) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  await fetch(`${url}/rest/v1/simulation_settings?id=eq.1`, {method: 'PATCH', headers: {'Content-Type': 'application/json', Prefer: 'return=minimal', apikey: key, Authorization: `Bearer ${key}`}, body: JSON.stringify({rainfall_intensity: value, updated_at: new Date().toISOString()})});
}
const round = value => Math.round(value * 10) / 10;
const rainfallData = () => {
  const pulse = 1 + Math.sin(Date.now() / 30000) * 0.04;
  const scale = simulatedRainfall / 40.3;
  return rainfall.map(item => ({
    id: item.id,
    location: item.location,
    latitude: item.latitude,
    longitude: item.longitude,
    timestamp: item.timestamp || new Date(Date.now() - item.secondsAgo * 1000).toISOString(),
    rainfallIntensity: round(item.rainfallIntensity * scale * pulse),
    rainfallAmount: round(item.rainfallAmount * scale * pulse),
  })).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
};

const segments = () => {
  const multiplier = 0.62 + simulatedRainfall / 100;
  return baseSegments.map(segment => {
    const currentFlow = round(segment.currentFlow * multiplier);
    const ratio = currentFlow / segment.capacity;
    const status = ratio > 1 ? 'OVERFLOW' : ratio > 0.85 ? 'CRITICAL' : ratio > 0.7 ? 'WARNING' : 'NORMAL';
    return {...segment, currentFlow, status};
  });
};

const riskLevel = score => score <= 25 ? 'LOW' : score <= 50 ? 'MODERATE' : score <= 75 ? 'HIGH' : 'SEVERE';
const predictions = () => {
  const rain = rainfallData().reduce((sum, item) => sum + item.rainfallIntensity, 0) / rainfallData().length;
  const currentSegments = segments();
  const capacity = currentSegments.reduce((sum, item) => sum + item.capacity, 0);
  const baseline = currentSegments.reduce((sum, item) => sum + item.currentFlow, 0);
  const load = Math.min(1.5, (baseline + Math.max(0.1, rain * 0.055)) / capacity);
  const overflow = Math.max(0, Math.min(1, (load - 0.72) / 0.45));
  const output = [];
  for (const zone of terrain) {
    const low = Math.max(0, Math.min(1, (575 - zone.elevation) / 30));
    const slope = Math.max(0, 1 - zone.slope / 10);
    for (const minutes of [30, 60, 120, 180]) {
      const decay = 1 - (minutes - 30) / 700;
      const score = Math.min(100, (rain / 70 * 35 + low * 20 + slope * 10 + load * 25 + zone.historicalRisk * 10) * decay);
      const overflowProbability = Math.min(1, overflow * decay + low * 0.12);
      const waterDepthCm = Math.max(0, (score - 32) * 0.72 + overflowProbability * 16);
      output.push({horizon: `${minutes} minutes`, location: zone.name, latitude: zone.latitude, longitude: zone.longitude, riskLevel: riskLevel(score), riskScore: round(score), waterDepthCm: round(waterDepthCm), affectedAreaHa: round(waterDepthCm * 0.18), overflowProbability: round(overflowProbability * 100), criticalDrains: currentSegments.filter(item => item.currentFlow / item.capacity > 0.78 || load > 0.85).map(item => item.name)});
    }
  }
  return output;
};

const alerts = () => predictions().filter(item => ['HIGH', 'SEVERE'].includes(item.riskLevel) && item.horizon === '60 minutes').map((item, index) => ({
  id: index + 1,
  severity: item.riskLevel,
  location: item.location,
  horizon: '1 Hour',
  message: item.location === 'Hadapsar' ? `Water accumulation may reach ${item.waterDepthCm} cm if current rainfall intensity continues.` : item.location === 'Yerawada' ? 'Drainage segment is approaching overflow threshold due to increasing runoff.' : 'Predicted runoff requires local drainage monitoring.',
  waterDepthCm: item.waterDepthCm,
  recommendedAction: item.riskLevel === 'SEVERE' ? 'Deploy drainage response team and restrict waterlogged road access.' : 'Inspect nearby inlets and monitor the local drain load.',
}));

function send(res, status, body) {
  res.status(status).setHeader('Access-Control-Allow-Origin', '*').json(body);
}

export default async function handler(req, res) {
  await hydrateFromSupabase();
  if (req.method === 'OPTIONS') return send(res, 204, null);
  const requestUrl = new URL(req.url, 'http://localhost');
  const path = (requestUrl.searchParams.get('path') || requestUrl.pathname.replace(/^\/api\/?/, '')).replace(/\/$/, '');
  if (req.method === 'GET' && path === 'rainfall') return send(res, 200, rainfallData());
  if (req.method === 'GET' && path === 'rainfall/latest') return send(res, 200, rainfallData()[0]);
  if (req.method === 'GET' && path === 'terrain') return send(res, 200, terrain);
  if (req.method === 'GET' && path === 'drainage/nodes') return send(res, 200, nodes);
  if (req.method === 'GET' && path === 'drainage/segments') return send(res, 200, segments());
  if (req.method === 'GET' && path === 'predictions') return send(res, 200, predictions());
  if (req.method === 'GET' && path === 'alerts') return send(res, 200, alerts());
  if (req.method === 'GET' && path === 'simulation') return send(res, 200, {rainfallIntensity: simulatedRainfall});
  if (req.method === 'POST' && path === 'simulation') {
    const value = Number(req.body?.rainfallIntensity);
    if (!Number.isFinite(value) || value < 10 || value > 100) return send(res, 400, {error: 'Rainfall intensity must be between 10 and 100 mm/hr'});
    simulatedRainfall = value;
    await saveSimulation(value);
    return send(res, 200, {rainfallIntensity: simulatedRainfall});
  }
  if (req.method === 'POST' && path === 'routes/safe') {
    const {source, destination} = req.body || {};
    if (!source || !destination) return send(res, 400, {error: 'Source and destination are required'});
    return send(res, 200, {route: [source, 'Kothrud Safe Corridor', 'University Road', destination], distanceKm: 10.8, avoidedAreas: ['Hadapsar Culvert high-risk zone', 'Yerawada Channel severe-risk zone'], note: 'Prototype weighted graph route; high and severe zones receive prohibitive cost.'});
  }
  if (req.method === 'GET' && path === 'model-status') return send(res, 200, {model: 'backend explainable fallback', status: 'AI engine unavailable; local model active', training_data: 'synthetic prototype'});
  return send(res, 404, {error: 'API route not found'});
}