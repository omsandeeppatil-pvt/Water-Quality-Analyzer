import { NextResponse } from "next/server";
import { Jimp } from "jimp";

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

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Process image using Jimp
    const image = await Jimp.read(buffer);
    
    let totalBlue = 0;
    let totalPixels = 0;

    image.scan(0, 0, image.bitmap.width, image.bitmap.height, (_x, _y, idx) => {
      const blue = image.bitmap.data[idx + 2];
      totalBlue += blue;
      totalPixels++;
    });

    const averageBlue = totalBlue / totalPixels;

    let waterQuality = "Unknown";
    if (averageBlue > 200) {
      waterQuality = "Excellent";
    } else if (averageBlue > 150) {
      waterQuality = "Good";
    } else if (averageBlue > 100) {
      waterQuality = "Fair";
    } else {
      waterQuality = "Poor";
    }

    return NextResponse.json({ result: waterQuality }, { status: 200 });
  } catch (error) {
    console.error("Error processing image:", error);
    return NextResponse.json(
      { error: "Failed to analyze the image" },
      { status: 500 }
    );
  }
}
