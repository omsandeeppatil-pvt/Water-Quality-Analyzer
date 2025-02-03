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
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "Invalid file input" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const image = sharp(buffer);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    if (!width || !height) {
      throw new Error("Failed to read image dimensions");
    }

    const rawPixelData = await image.raw().toBuffer();
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
  const colorTotals = {
    red: 0,
    green: 0,
    blue: 0,
    brightness: 0,
    saturation: 0,
    variance: 0
  };

  const totalPixels = width * height;

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

  let varianceSum = 0;
  for (let i = 0; i < pixelData.length; i += 4) {
    const red = pixelData[i];
    const green = pixelData[i + 1];
    const blue = pixelData[i + 2];

    varianceSum +=
      Math.pow(red - averages.red, 2) +
      Math.pow(green - averages.green, 2) +
      Math.pow(blue - averages.blue, 2);
  }

  averages.variance = Math.sqrt(varianceSum / (totalPixels * 3));

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

function determineWaterQuality(metrics: WaterQualityMetrics): string {
  return "Good";
}

function assessWaterSafety(metrics: WaterQualityMetrics) {
  return {
    isDrinkable: true,
    isSwimmable: true,
    isIrrigationSafe: true
  };
}

function generateRecommendations(
  metrics: WaterQualityMetrics,
  safety: { isDrinkable: boolean; isSwimmable: boolean; isIrrigationSafe: boolean }
): string[] {
  return ["Regular monitoring recommended."];
}
