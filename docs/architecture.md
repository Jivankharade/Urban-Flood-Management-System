# Urban flood nowcasting architecture and risk model

The coupled engine runs every request: rainfall → runoff model → hydraulic network simulation → terrain sensitivity → flood-risk, overflow, and 0–3 hour forecasts/alerts.

`risk = rainfall×35% + lowElevation×20% + slope×10% + drainageLoad×25% + historicalRisk×10%`.

Weights are returned on `/api/predictions` so the calculation is transparent. Score bands are LOW (0–25), MODERATE (26–50), HIGH (51–75), SEVERE (76–100). Safe routing uses a local weighted road graph and penalizes high/severe zones; it is deliberately a prototype, not turn-by-turn navigation.
