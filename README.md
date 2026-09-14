# Urban Flood Nowcasting System — Pune

A full-stack Smart India Hackathon prototype for urban flood nowcasting. It couples rainfall, terrain, drainage capacity, AI runoff prediction and hydraulic analysis to forecast Pune flood risk 0–3 hours ahead. It is not an IoT system.

## Quick start

```bash
# terminal 1
cd ai-engine && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt && .venv/bin/uvicorn app.main:app --reload --port 8000
# terminal 2
cd backend && mvn spring-boot:run
# terminal 3
cd frontend && npm install && npm run dev
```

Open the Vite URL (normally `http://localhost:5173`). The backend's Swagger UI is at `http://localhost:8080/swagger-ui/index.html`.

The application works when the AI service is unavailable: the backend switches to an explainable local fallback model. PostgreSQL/PostGIS and EPA SWMM are intentionally integration seams, not requirements for this prototype.

## Architecture

```text
React + Leaflet → Spring Boot orchestration → FastAPI prediction
                                      ↓
                         hydraulic prototype / future EPA SWMM
                                      ↓
                        coupled predictions + alerts + safe routing
```

See [docs/architecture.md](docs/architecture.md) and [docs/setup.md](docs/setup.md).
