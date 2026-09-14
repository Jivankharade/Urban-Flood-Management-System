package com.sih.flood.dto;
import jakarta.validation.constraints.*;
import java.time.Instant;
public record RainfallDto(long id, @NotBlank String location, @DecimalMin("-90") @DecimalMax("90") double latitude, @DecimalMin("-180") @DecimalMax("180") double longitude, Instant timestamp, @PositiveOrZero double rainfallIntensity, @PositiveOrZero double rainfallAmount) {}
