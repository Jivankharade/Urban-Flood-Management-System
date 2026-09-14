package com.sih.flood.controller;
import com.sih.flood.dto.RainfallDto; import com.sih.flood.dto.FloodDtos.*; import com.sih.flood.service.FloodService;
import io.swagger.v3.oas.annotations.Operation; import jakarta.validation.Valid; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api") public class FloodController {
 private final FloodService svc; public FloodController(FloodService svc){this.svc=svc;}
 @GetMapping("/rainfall") @Operation(summary="Synthetic prototype rainfall history") List<RainfallDto> rainfall(){return svc.rainfall();}
 @GetMapping("/rainfall/latest") RainfallDto latest(){return svc.latest();} @PostMapping("/rainfall") RainfallDto add(@Valid @RequestBody RainfallDto r){return svc.add(r);} @GetMapping("/rainfall/location/{id}") List<RainfallDto> at(@PathVariable long id){return svc.rainfallAt(id);}
 @GetMapping("/terrain") List<TerrainDto> terrain(){return svc.terrain();} @GetMapping("/drainage/nodes") List<DrainNodeDto> nodes(){return svc.nodes();} @GetMapping("/drainage/segments") List<DrainSegmentDto> segments(){return svc.segments();}
 @GetMapping("/predictions") List<PredictionDto> predictions(){return svc.predictions();} @GetMapping("/alerts") List<AlertDto> alerts(){return svc.alerts();} @GetMapping("/simulation") SimulationDto simulation(){return svc.simulation();} @PostMapping("/simulation") SimulationDto simulation(@RequestBody SimulationDto input){return svc.setSimulation(input);} @PostMapping("/routes/safe") RouteDto route(@RequestBody RouteRequest r){return svc.route(r);} @GetMapping("/model-status") Map<String,Object> status(){return svc.modelStatus();}
}
