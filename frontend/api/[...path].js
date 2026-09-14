let simulatedRainfall = 40.3;
let hydratedAt = 0;

let terrain = [
  {id: 1, name: 'Shivajinagar', latitude: 18.5308, longitude: 73.8475, elevation: 560, slope: 2.1, terrainType: 'Low-lying urban', historicalRisk: 0.72, accumulationPotential: 0.88, runoffCoefficient: 0.9, catchmentAreaKm2: 1.4},
  {id: 2, name: 'Kothrud', latitude: 18.5074, longitude: 73.8077, elevation: 574, slope: 4.5, terrainType: 'Mixed urban slope', historicalRisk: 0.36, accumulationPotential: 0.48, runoffCoefficient: 0.7, catchmentAreaKm2: 1.1},
  {id: 3, name: 'Hadapsar', latitude: 18.5089, longitude: 73.926, elevation: 555, slope: 1.4, terrainType: 'Low-lying urban', historicalRisk: 0.8, accumulationPotential: 0.95, runoffCoefficient: 0.92, catchmentAreaKm2: 1.7},
  {id: 4, name: 'Katraj', latitude: 18.452, longitude: 73.865, elevation: 620, slope: 7, terrainType: 'Open / permeable hillside', historicalRisk: 0.18, accumulationPotential: 0.2, runoffCoefficient: 0.38, catchmentAreaKm2: 0.8},
  {id: 5, name: 'Yerawada', latitude: 18.553, longitude: 73.878, elevation: 552, slope: 1.7, terrainType: 'River plain', historicalRisk: 0.76, accumulationPotential: 0.98, runoffCoefficient: 0.88, catchmentAreaKm2: 1.9},
];

let nodes = [
  {id: 1, name: 'Mutha Outfall', latitude: 18.532, longitude: 73.855, elevation: 552, currentWaterLevel: 0.68, type: 'Outlet'},
  {id: 2, name: 'Shivajinagar Junction', latitude: 18.531, longitude: 73.847, elevation: 559, currentWaterLevel: 0.82, type: 'Junction'},
  {id: 3, name: 'Hadapsar Culvert', latitude: 18.509, longitude: 73.926, elevation: 554, currentWaterLevel: 0.91, type: 'Manhole'},
  {id: 4, name: 'Yerawada Channel', latitude: 18.553, longitude: 73.878, elevation: 551, currentWaterLevel: 0.88, type: 'Outlet'},
];

let baseSegments = [
  {id: 1, name: 'DR-01', sourceNode: 2, destinationNode: 1, location: 'Shivajinagar', length: 940, diameter: 1.2, capacity: 3.8, currentFlow: 3},
  {id: 2, name: 'DR-02', sourceNode: 3, destinationNode: 1, location: 'Hadapsar', length: 2800, diameter: 0.9, capacity: 2.1, currentFlow: 2},
  {id: 3, name: 'DR-03', sourceNode: 4, destinationNode: 1, location: 'Yerawada', length: 1700, diameter: 0.8, capacity: 1.7, currentFlow: 1.65},
];

let rainfall = [
  {id: 1, location: 'Shivajinagar', latitude: 18.5308, longitude: 73.8475, secondsAgo: 1800, rainfallIntensity: 32.6, rainfallAmount: 16.3},
  {id: 2, location: 'Hadapsar', latitude: 18.5089, longitude: 73.926, secondsAgo: 1200, rainfallIntensity: 48.9, rainfallAmount: 24.5},
  {id: 3, location: 'Yerawada', latitude: 18.553, longitude: 73.878, secondsAgo: 600, rainfallIntensity: 40.7, rainfallAmount: 20.4},
  {id: 4, location: 'Kothrud', latitude: 18.5074, longitude: 73.8077, secondsAgo: 900, rainfallIntensity: 27.4, rainfallAmount: 13.7},
  {id: 5, location: 'Katraj', latitude: 18.452, longitude: 73.865, secondsAgo: 1500, rainfallIntensity: 22.1, rainfallAmount: 11.1},
];

const round = value => Math.round(value * 10) / 10;
const riskLevel = depth => depth <= 10 ? 'LOW' : depth <= 25 ? 'MODERATE' : depth <= 50 ? 'HIGH' : 'SEVERE';

async function hydrateFromSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || Date.now() - hydratedAt < 15000) return;
  const headers = {apikey: key, Authorization: `Bearer ${key}`};
  const read = async table => { const response = await fetch(`${url}/rest/v1/${table}?select=*`, {headers}); if (!response.ok) throw new Error(`${table} unavailable`); return response.json(); };
  try {
    const [rainfallRows, terrainRows, nodeRows, segmentRows, simulationRows] = await Promise.all([read('rainfall_readings'), read('terrain_cells'), read('drain_nodes'), read('drain_segments'), read('simulation_settings')]);
    if (rainfallRows.length) rainfall = rainfallRows.map(row => ({id: row.id, location: row.location, latitude: row.latitude, longitude: row.longitude, timestamp: row.recorded_at, rainfallIntensity: row.rainfall_intensity, rainfallAmount: row.rainfall_amount}));
    if (terrainRows.length) terrain = terrain.map(zone => ({...zone, ...(terrainRows.find(row => row.id === zone.id) ? {name: terrainRows.find(row => row.id === zone.id).name, elevation: terrainRows.find(row => row.id === zone.id).elevation, slope: terrainRows.find(row => row.id === zone.id).slope, terrainType: terrainRows.find(row => row.id === zone.id).terrain_type, historicalRisk: terrainRows.find(row => row.id === zone.id).historical_risk} : {})}));
    if (nodeRows.length) nodes = nodeRows.map(row => ({id: row.id, name: row.name, latitude: row.latitude, longitude: row.longitude, elevation: row.elevation, currentWaterLevel: row.current_water_level, type: row.id === 1 ? 'Outlet' : 'Junction'}));
    if (segmentRows.length) baseSegments = segmentRows.map(row => ({id: row.id, name: row.name, sourceNode: row.source_node_id, destinationNode: row.destination_node_id, location: row.name === 'DR-02' || row.name === 'HC-07' ? 'Hadapsar' : row.name === 'DR-03' || row.name === 'YC-03' ? 'Yerawada' : 'Shivajinagar', length: row.length_m, diameter: row.diameter_m, capacity: row.capacity_cumecs, currentFlow: row.current_flow_cumecs}));
    if (simulationRows.length) simulatedRainfall = Number(simulationRows[0].rainfall_intensity) || simulatedRainfall;
    hydratedAt = Date.now();
  } catch (error) { console.warn('Supabase unavailable; using model fallback', error.message); }
}

async function saveSimulation(value) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  await fetch(`${url}/rest/v1/simulation_settings?id=eq.1`, {method: 'PATCH', headers: {'Content-Type': 'application/json', Prefer: 'return=minimal', apikey: key, Authorization: `Bearer ${key}`}, body: JSON.stringify({rainfall_intensity: value, updated_at: new Date().toISOString()})});
}

function rainfallData(horizon = 0) {
  const pulse = 1 + Math.sin(Date.now() / 30000) * 0.04;
  const horizonFactor = 1 + horizon / 900;
  const scale = simulatedRainfall / 40.3;
  return rainfall.map(item => ({id: item.id, location: item.location, latitude: item.latitude, longitude: item.longitude, timestamp: item.timestamp || new Date(Date.now() - item.secondsAgo * 1000).toISOString(), rainfallIntensity: round(item.rainfallIntensity * scale * pulse * horizonFactor), rainfallAmount: round(item.rainfallAmount * scale * pulse * horizonFactor)})).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

function modelAt(horizonMinutes) {
  const readings = rainfallData(horizonMinutes);
  const zones = terrain.map(zone => {
    const reading = readings.find(item => item.location === zone.name);
    const rain = reading?.rainfallIntensity || simulatedRainfall;
    const runoff = rain * zone.catchmentAreaKm2 * zone.runoffCoefficient * 0.00278;
    const routingFactor = 1 + (1 - zone.slope / 10) * zone.accumulationPotential * 0.35;
    return {...zone, rainfallIntensity: round(rain), estimatedRunoff: round(runoff), routedRunoff: round(runoff * routingFactor), terrainRisk: zone.accumulationPotential > 0.8 ? 'High' : zone.accumulationPotential > 0.45 ? 'Moderate' : 'Low'};
  });
  const totalRunoff = zones.reduce((sum, zone) => sum + zone.routedRunoff, 0);
  const segmentRows = baseSegments.map(segment => {
    const locationRunoff = zones.find(zone => zone.name === segment.location)?.routedRunoff || totalRunoff / baseSegments.length;
    const estimatedInflow = round(segment.currentFlow * (0.55 + simulatedRainfall / 75) + locationRunoff * 0.42);
    const utilization = round(estimatedInflow / segment.capacity * 100);
    const excessFlow = round(Math.max(0, estimatedInflow - segment.capacity));
    const status = utilization > 100 ? 'SURCHARGED' : utilization > 85 ? 'AT RISK' : utilization > 70 ? 'WARNING' : 'NORMAL';
    return {...segment, estimatedInflow, utilization, excessFlow, status, currentFlow: estimatedInflow};
  });
  const totalExcess = segmentRows.reduce((sum, segment) => sum + segment.excessFlow, 0);
  const capacityUtilization = segmentRows.reduce((sum, segment) => sum + segment.utilization, 0) / segmentRows.length;
  const predictions = zones.map(zone => {
    const local = segmentRows.find(segment => segment.location === zone.name) || segmentRows[0];
    const affectedAreaM2 = Math.max(500, zone.catchmentAreaKm2 * 1000000 * (0.18 + zone.accumulationPotential * 0.12));
    const accumulatedVolume = Math.max(0, (local.excessFlow * 900 * zone.accumulationPotential) + zone.routedRunoff * 120);
    const waterDepthCm = round(accumulatedVolume / affectedAreaM2 * 100);
    return {horizon: `${horizonMinutes} minutes`, location: zone.name, latitude: zone.latitude, longitude: zone.longitude, rainfallIntensity: zone.rainfallIntensity, estimatedRunoff: zone.routedRunoff, terrainRisk: zone.terrainRisk, drainageCapacity: local.capacity, estimatedInflow: local.estimatedInflow, capacityUtilization: local.utilization, excessFlow: local.excessFlow, accumulatedVolume: round(accumulatedVolume), affectedAreaM2: round(affectedAreaM2), riskLevel: riskLevel(waterDepthCm), riskScore: round(Math.min(100, waterDepthCm * 1.7)), waterDepthCm, overflowProbability: round(Math.min(99, Math.max(0, (local.utilization - 65) * 1.8))), criticalDrains: segmentRows.filter(segment => segment.utilization > 85).map(segment => segment.name)};
  });
  return {zones, segments: segmentRows, predictions, totalRunoff: round(totalRunoff), totalExcess: round(totalExcess), capacityUtilization: round(capacityUtilization)};
}

function predictions() { return [30, 60, 120, 180].flatMap(minutes => modelAt(minutes).predictions); }
function alerts() { return predictions().filter(item => (item.capacityUtilization > 100 || item.waterDepthCm > 25) && item.horizon === '60 minutes').map((item, index) => ({id: index + 1, severity: item.riskLevel, location: item.location, horizon: '1 Hour', message: item.capacityUtilization > 100 ? `Predicted runoff exceeds modelled drainage capacity in ${item.location}. Surface overflow is expected.` : `Water accumulation may reach approximately ${item.waterDepthCm} cm within the next 1 hour.`, waterDepthCm: item.waterDepthCm, recommendedAction: item.capacityUtilization > 100 ? 'Inspect inlets, monitor surcharge, and restrict access to low-lying roads.' : 'Monitor low-lying roads and drainage network conditions.'})); }

function send(res, status, body) { res.status(status).setHeader('Access-Control-Allow-Origin', '*').json(body); }
export default async function handler(req, res) {
  await hydrateFromSupabase();
  if (req.method === 'OPTIONS') return send(res, 204, null);
  const requestUrl = new URL(req.url, 'http://localhost');
  const path = (requestUrl.searchParams.get('path') || requestUrl.pathname.replace(/^\/api\/?/, '')).replace(/\/$/, '');
  const currentModel = modelAt(0);
  if (req.method === 'GET' && path === 'rainfall') return send(res, 200, rainfallData());
  if (req.method === 'GET' && path === 'rainfall/latest') return send(res, 200, rainfallData()[0]);
  if (req.method === 'GET' && path === 'terrain') return send(res, 200, terrain);
  if (req.method === 'GET' && path === 'drainage/nodes') return send(res, 200, nodes);
  if (req.method === 'GET' && path === 'drainage/segments') return send(res, 200, currentModel.segments);
  if (req.method === 'GET' && path === 'predictions') return send(res, 200, predictions());
  if (req.method === 'GET' && path === 'alerts') return send(res, 200, alerts());
  if (req.method === 'GET' && path === 'simulation') return send(res, 200, {rainfallIntensity: simulatedRainfall, totalRunoff: currentModel.totalRunoff, totalExcessFlow: currentModel.totalExcess, capacityUtilization: currentModel.capacityUtilization});
  if (req.method === 'POST' && path === 'simulation') { const value = Number(req.body?.rainfallIntensity); if (!Number.isFinite(value) || value < 10 || value > 100) return send(res, 400, {error: 'Rainfall intensity must be between 10 and 100 mm/hr'}); simulatedRainfall = value; await saveSimulation(value); return send(res, 200, {rainfallIntensity: simulatedRainfall}); }
  if (req.method === 'POST' && path === 'routes/safe') { const {source, destination} = req.body || {}; if (!source || !destination) return send(res, 400, {error: 'Source and destination are required'}); const forecast = modelAt(60).predictions; const maxDepth = Math.max(...forecast.map(item => item.waterDepthCm)); return send(res, 200, {route: [source, 'Kothrud Safe Corridor', 'University Road', destination], distanceKm: 10.8, maxFloodDepthCm: round(maxDepth), avoidedAreas: forecast.filter(item => item.riskLevel === 'HIGH' || item.riskLevel === 'SEVERE').map(item => `${item.location} (${item.waterDepthCm} cm)`), note: 'Prototype flood-aware routing simulation using predicted depth and surcharge risk.'}); }
  if (req.method === 'GET' && path === 'model-status') return send(res, 200, {model: 'Prototype Hydraulic Simulation', status: 'Modelled estimation active', pipeline: 'Rainfall -> runoff -> DEM routing -> drainage graph -> hydraulic capacity -> surcharge -> flood depth'});
  return send(res, 404, {error: 'API route not found'});
}
