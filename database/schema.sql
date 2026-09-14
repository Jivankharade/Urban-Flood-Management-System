-- Prototype schema. Every seed value is synthetic / illustrative only.
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TABLE rainfall_readings (id BIGSERIAL PRIMARY KEY, location VARCHAR(100) NOT NULL, latitude DOUBLE PRECISION NOT NULL, longitude DOUBLE PRECISION NOT NULL, recorded_at TIMESTAMPTZ NOT NULL, rainfall_intensity DOUBLE PRECISION NOT NULL, rainfall_amount DOUBLE PRECISION NOT NULL, geom geometry(Point,4326));
CREATE TABLE terrain_cells (id BIGSERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, latitude DOUBLE PRECISION NOT NULL, longitude DOUBLE PRECISION NOT NULL, elevation DOUBLE PRECISION NOT NULL, slope DOUBLE PRECISION NOT NULL, terrain_type VARCHAR(60) NOT NULL, historical_risk DOUBLE PRECISION NOT NULL, geom geometry(Point,4326));
CREATE TABLE drain_nodes (id BIGSERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, latitude DOUBLE PRECISION NOT NULL, longitude DOUBLE PRECISION NOT NULL, elevation DOUBLE PRECISION NOT NULL, current_water_level DOUBLE PRECISION NOT NULL);
CREATE TABLE drain_segments (id BIGSERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, source_node_id BIGINT REFERENCES drain_nodes(id), destination_node_id BIGINT REFERENCES drain_nodes(id), length_m DOUBLE PRECISION NOT NULL, diameter_m DOUBLE PRECISION NOT NULL, capacity_cumecs DOUBLE PRECISION NOT NULL, current_flow_cumecs DOUBLE PRECISION NOT NULL, status VARCHAR(20) NOT NULL);
CREATE TABLE simulation_settings (id BIGINT PRIMARY KEY, rainfall_intensity DOUBLE PRECISION NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now());
INSERT INTO simulation_settings (id, rainfall_intensity) VALUES (1, 40.3) ON CONFLICT (id) DO NOTHING;

INSERT INTO rainfall_readings (id, location, latitude, longitude, recorded_at, rainfall_intensity, rainfall_amount) VALUES
	(1, 'Shivajinagar', 18.5308, 73.8475, now() - interval '30 minutes', 32.6, 16.3),
	(2, 'Hadapsar', 18.5089, 73.9260, now() - interval '20 minutes', 48.9, 24.5),
	(3, 'Yerawada', 18.5530, 73.8780, now() - interval '10 minutes', 40.7, 20.4),
	(4, 'Kothrud', 18.5074, 73.8077, now() - interval '15 minutes', 27.4, 13.7),
	(5, 'Katraj', 18.4520, 73.8650, now() - interval '25 minutes', 22.1, 11.1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO terrain_cells (id, name, latitude, longitude, elevation, slope, terrain_type, historical_risk) VALUES
	(1, 'Shivajinagar', 18.5308, 73.8475, 560, 2.1, 'low-lying urban', 0.72),
	(2, 'Kothrud', 18.5074, 73.8077, 574, 4.5, 'residential slope', 0.36),
	(3, 'Hadapsar', 18.5089, 73.9260, 555, 1.4, 'low-lying urban', 0.80),
	(4, 'Katraj', 18.4520, 73.8650, 620, 7.0, 'hilly', 0.18),
	(5, 'Yerawada', 18.5530, 73.8780, 552, 1.7, 'river plain', 0.76)
ON CONFLICT (id) DO NOTHING;

INSERT INTO drain_nodes (id, name, latitude, longitude, elevation, current_water_level) VALUES
	(1, 'Mutha Outfall', 18.5320, 73.8550, 552, 0.68),
	(2, 'Shivajinagar Junction', 18.5310, 73.8470, 559, 0.82),
	(3, 'Hadapsar Culvert', 18.5090, 73.9260, 554, 0.91),
	(4, 'Yerawada Channel', 18.5530, 73.8780, 551, 0.88)
ON CONFLICT (id) DO NOTHING;

INSERT INTO drain_segments (id, name, source_node_id, destination_node_id, length_m, diameter_m, capacity_cumecs, current_flow_cumecs, status) VALUES
	(1, 'SC-01', 2, 1, 940, 1.2, 3.8, 3.0, 'WARNING'),
	(2, 'HC-07', 3, 1, 2800, 0.9, 2.1, 2.0, 'WARNING'),
	(3, 'YC-03', 4, 1, 1700, 0.8, 1.7, 1.65, 'CRITICAL')
ON CONFLICT (id) DO NOTHING;
