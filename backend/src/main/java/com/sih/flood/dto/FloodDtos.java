package com.sih.flood.dto;
import java.util.List;
public final class FloodDtos {
 private FloodDtos() {}
 public record TerrainDto(long id,String name,double latitude,double longitude,double elevation,double slope,String terrainType,double historicalRisk) {}
 public record DrainNodeDto(long id,String name,double latitude,double longitude,double elevation,double currentWaterLevel) {}
 public record DrainSegmentDto(long id,String name,long sourceNode,long destinationNode,double length,double diameter,double capacity,double currentFlow,String status) {}
 public record PredictionDto(String horizon,String location,double latitude,double longitude,String riskLevel,double riskScore,double waterDepthCm,double affectedAreaHa,double overflowProbability,List<String> criticalDrains) {}
 public record AlertDto(long id,String severity,String location,String horizon,String message,double waterDepthCm,String recommendedAction) {}
 public record SimulationDto(double rainfallIntensity) {}
 public record RouteRequest(String source,String destination) {}
 public record RouteDto(List<String> route,double distanceKm,List<String> avoidedAreas,String note) {}
}
