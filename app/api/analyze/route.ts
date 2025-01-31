import { NextResponse } from "next/server";
import sharp from 'sharp'; // Use sharp for image processing

interface WaterQualityMetrics {
  ph: number;
  turbidity: number;
  dissolvedOxygen: number;
  temperature: number;
  conductivity: number;
  totalDissolvedSolids: number;
  chlorine: number;
  hardness: number;
}

interface ColorAverages {
  red: number;
  green: number;
  blue: number;
  brightness: number;
  saturation: number;
  variance: number;
}

interface AnalysisResult {
  overallQuality: string;
  metrics: WaterQualityMetrics;
  recommendations: string[];
  safetyStatus: {
    isDrinkable: boolean;
    isSwimmable: boolean;
    isIrrigationSafe: boolean;
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Invalid file input" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Process image using sharp
    const image = sharp(buffer);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    if (!width || !height) {
      throw new Error("Failed to read image dimensions");
    }

    const rawPixelData = await image.raw().toBuffer(); // Get raw pixel data
    const metrics = analyzeImage(rawPixelData, width, height);
    const overallQuality = determineWaterQuality(metrics);
    const safetyStatus = assessWaterSafety(metrics);
    const recommendations = generateRecommendations(metrics, safetyStatus);

    const result: AnalysisResult = {
      overallQuality,
      metrics,
      recommendations,
      safetyStatus
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error processing image:", error);
    return NextResponse.json(
      { error: "Failed to analyze the image" },
      { status: 500 }
    );
  }
}

function analyzeImage(pixelData: Buffer, width: number, height: number): WaterQualityMetrics {
  let colorTotals = {
    red: 0,
    green: 0,
    blue: 0,
    brightness: 0,
    saturation: 0,
    variance: 0
  };

  const totalPixels = width * height;

  // First pass: calculate averages
  for (let i = 0; i < pixelData.length; i += 4) {
    const red = pixelData[i];
    const green = pixelData[i + 1];
    const blue = pixelData[i + 2];

    colorTotals.red += red;
    colorTotals.green += green;
    colorTotals.blue += blue;
    colorTotals.brightness += (red + green + blue) / 3;

    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    colorTotals.saturation += max > 0 ? (max - min) / max : 0;
  }

  const averages: ColorAverages = {
    red: colorTotals.red / totalPixels,
    green: colorTotals.green / totalPixels,
    blue: colorTotals.blue / totalPixels,
    brightness: colorTotals.brightness / totalPixels,
    saturation: colorTotals.saturation / totalPixels,
    variance: 0
  };

  // Second pass: calculate variance
  for (let i = 0; i < pixelData.length; i += 4) {
    const red = pixelData[i];
    const green = pixelData[i + 1];
    const blue = pixelData[i + 2];

    colorTotals.variance +=
      Math.pow(red - averages.red, 2) +
      Math.pow(green - averages.green, 2) +
      Math.pow(blue - averages.blue, 2);
  }

  averages.variance = Math.sqrt(colorTotals.variance / (totalPixels * 3));

  return {
    ph: calculatePH(averages),
    turbidity: calculateTurbidity(averages),
    dissolvedOxygen: calculateDissolvedOxygen(averages),
    temperature: calculateTemperature(averages),
    conductivity: calculateConductivity(averages),
    totalDissolvedSolids: calculateTDS(averages),
    chlorine: calculateChlorine(averages),
    hardness: calculateHardness(averages)
  };
}

function calculatePH(averages: ColorAverages): number {
  const rgRatio = averages.red / averages.green;
  const bModifier = averages.blue / 255;
  const baseValue = 7 + (rgRatio - 1) * 3.5;
  return Math.max(0, Math.min(14, baseValue + (bModifier - 0.5)));
}

function calculateTurbidity(averages: ColorAverages): number {
  const brightnessComponent = (255 - averages.brightness) / 6.375;
  const varianceComponent = averages.variance / 30;
  return Math.max(0, Math.min(40, brightnessComponent + varianceComponent));
}

function calculateDissolvedOxygen(averages: ColorAverages): number {
  return Math.max(0, Math.min(15, (averages.blue / 255) * 10 + (averages.saturation * 5)));
}

function calculateTemperature(averages: ColorAverages): number {
  return Math.max(0, Math.min(40, (averages.red / 255) * 40));
}

function calculateConductivity(averages: ColorAverages): number {
  return Math.max(0, Math.min(2000, averages.variance * 5 + (averages.brightness / 255) * 1000));
}

function calculateTDS(averages: ColorAverages): number {
  return Math.max(0, Math.min(1000, (averages.brightness / 255) * 500 + averages.variance * 2));
}

function calculateChlorine(averages: ColorAverages): number {
  return Math.max(0, Math.min(4, ((averages.green - averages.blue) / 255) * 4));
}

function calculateHardness(averages: ColorAverages): number {
  return Math.max(0, Math.min(300, ((averages.red + averages.green) / (2 * 255)) * 300));
}

function determineWaterQuality(metrics: WaterQualityMetrics): string {
  const scores = {
    ph: scoreInRange(metrics.ph, 6.5, 8.5),
    turbidity: scoreInRange(metrics.turbidity, 0, 5),
    dissolvedOxygen: scoreInRange(metrics.dissolvedOxygen, 6, 8),
    tds: scoreInRange(metrics.totalDissolvedSolids, 0, 500),
    chlorine: scoreInRange(metrics.chlorine, 0.2, 2),
    hardness: scoreInRange(metrics.hardness, 60, 180)
  };

  const averageScore = Object.values(scores).reduce((a, b) => a + b) / Object.keys(scores).length;

  if (averageScore >= 0.9) return "Excellent";
  if (averageScore >= 0.7) return "Good";
  if (averageScore >= 0.5) return "Fair";
  return "Poor";
}

function scoreInRange(value: number, min: number, max: number): number {
  if (value >= min && value <= max) return 1;
  const midpoint = (min + max) / 2;
  const deviation = Math.abs(value - midpoint) / (max - min);
  return Math.max(0, 1 - deviation);
}

function assessWaterSafety(metrics: WaterQualityMetrics) {
  const isDrinkable =
    metrics.ph >= 6.5 && metrics.ph <= 8.5 &&
    metrics.turbidity <= 1 &&
    metrics.dissolvedOxygen >= 6 &&
    metrics.totalDissolvedSolids <= 500 &&
    metrics.chlorine >= 0.2 && metrics.chlorine <= 4;

  const isSwimmable =
    metrics.ph >= 6.0 && metrics.ph <= 9.0 &&
    metrics.turbidity <= 5 &&
    metrics.dissolvedOxygen >= 4;

  const isIrrigationSafe =
    metrics.ph >= 6.0 && metrics.ph <= 8.5 &&
    metrics.totalDissolvedSolids <= 2000;

  return {
    isDrinkable,
    isSwimmable,
    isIrrigationSafe
  };
}

function generateRecommendations(
  metrics: WaterQualityMetrics,
  safety: { isDrinkable: boolean; isSwimmable: boolean; isIrrigationSafe: boolean }
): string[] {
  const recommendations: string[] = [];

  if (!safety.isDrinkable) {
    if (metrics.ph < 6.5 || metrics.ph > 8.5) {
      recommendations.push(`pH level (${metrics.ph.toFixed(1)}) is outside safe drinking range. Consider pH adjustment.`);
    }
    if (metrics.turbidity > 1) {
      recommendations.push("Water turbidity is high. Filtration recommended before consumption.");
    }
    if (metrics.chlorine < 0.2) {
      recommendations.push("Chlorine levels are low. Consider additional disinfection.");
    }
  }

  if (metrics.hardness > 180) {
    recommendations.push("Water is very hard. Consider using a water softener.");
  }

  if (metrics.totalDissolvedSolids > 500) {
    recommendations.push("High TDS levels detected. Consider reverse osmosis treatment.");
  }

  if (recommendations.length === 0) {
    recommendations.push("Water quality is within acceptable ranges. Regular monitoring recommended.");
  }

  return recommendations;
}