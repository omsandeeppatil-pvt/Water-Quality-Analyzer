import { NextResponse } from "next/server";
import sharp from 'sharp';

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
    // Validate request and extract file
    const formData = await request.formData();
    const file = formData.get("file");
    
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Invalid file input. Please upload a valid image." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process image with error handling
    const image = sharp(buffer);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    if (!width || !height) {
      throw new Error("Unable to determine image dimensions");
    }

    // Extract pixel data
    const rawPixelData = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Perform analysis
    const metrics = analyzeImage(rawPixelData.data, width, height);
    const overallQuality = determineWaterQuality(metrics);
    const safetyStatus = assessWaterSafety(metrics);
    const recommendations = generateRecommendations(metrics, safetyStatus);

    // Construct and return result
    const result: AnalysisResult = {
      overallQuality,
      metrics,
      recommendations,
      safetyStatus
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Water quality image analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze the image. Please try again with a different image." },
      { status: 500 }
    );
  }
}

function analyzeImage(pixelData: Buffer, width: number, height: number): WaterQualityMetrics {
  const totalPixels = width * height;
  const colorTotals = {
    red: 0,
    green: 0,
    blue: 0,
    brightness: 0,
    saturation: 0,
    variance: 0
  };

  // First pass: Calculate averages
  for (let i = 0; i < pixelData.length; i += 4) {
    const [red, green, blue] = [
      pixelData[i], 
      pixelData[i + 1], 
      pixelData[i + 2]
    ];

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

  // Second pass: Calculate variance
  const varianceSum = pixelData.reduce((sum, pixel, index) => {
    if (index % 4 < 3) {  // Only process R, G, B channels
      const channelAverage = averages[['red', 'green', 'blue'][index % 3]];
      return sum + Math.pow(pixel - channelAverage, 2);
    }
    return sum;
  }, 0);

  averages.variance = Math.sqrt(varianceSum / (totalPixels * 3));

  // Calculate metrics based on color averages
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

// Placeholder implementations - these should be replaced with actual calculation logic
function calculatePH(averages: ColorAverages): number { 
  return 7 + (averages.variance / 50); 
}

function calculateTurbidity(averages: ColorAverages): number { 
  return averages.brightness / 25.5; 
}

function calculateDissolvedOxygen(averages: ColorAverages): number { 
  return Math.min(14, averages.saturation * 2); 
}

function calculateTemperature(averages: ColorAverages): number { 
  return 20 + (averages.red / 25.5); 
}

function calculateConductivity(averages: ColorAverages): number { 
  return averages.green * 2; 
}

function calculateTDS(averages: ColorAverages): number { 
  return averages.blue * 1.5; 
}

function calculateChlorine(averages: ColorAverages): number { 
  return Math.min(4, averages.variance / 10); 
}

function calculateHardness(averages: ColorAverages): number { 
  return averages.saturation * 100; 
}

function determineWaterQuality(metrics: WaterQualityMetrics): string {
  // Implement actual water quality assessment logic
  if (metrics.ph >= 6.5 && metrics.ph <= 8.5) return "Good";
  return "Needs Investigation";
}

function assessWaterSafety(metrics: WaterQualityMetrics) {
  return {
    isDrinkable: metrics.ph >= 6.5 && metrics.ph <= 8.5 && metrics.chlorine <= 4,
    isSwimmable: metrics.turbidity < 5 && metrics.temperature >= 15 && metrics.temperature <= 30,
    isIrrigationSafe: metrics.totalDissolvedSolids < 2000
  };
}

function generateRecommendations(
  metrics: WaterQualityMetrics, 
  safetyStatus: ReturnType<typeof assessWaterSafety>
): string[] {
  const recommendations: string[] = [];

  if (!safetyStatus.isDrinkable) {
    recommendations.push("Water requires treatment before consumption");
  }

  if (metrics.ph < 6.5) recommendations.push("pH is too low, consider neutralization");
  if (metrics.ph > 8.5) recommendations.push("pH is too high, consider acid treatment");

  return recommendations;
}
