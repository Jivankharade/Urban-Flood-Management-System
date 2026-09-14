# Setup

All displayed Pune data and model training features are synthetic prototype data, and must not be interpreted as government, sensor, or operational flood data.

The backend defaults to an in-memory dataset to keep the demo zero-config. To use PostgreSQL/PostGIS, run `database/schema.sql`, configure a datasource in `backend/src/main/resources/application.yml`, and add JPA repositories at the existing DTO/service boundaries.

`ai-engine/app/main.py` exposes an ML-shaped FastAPI contract. It uses a deterministic synthetic-data regression fallback by default; `train_lstm.py` documents the optional TensorFlow/Keras LSTM extension. The Spring service automatically falls back if FastAPI is offline.

The hydraulic simulation is in `FloodService.simulateHydraulics`. Replace that one method with an EPA SWMM adapter without changing API consumers.
