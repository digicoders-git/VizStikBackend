import sharp from "sharp";
import fetch from "node-fetch";

const getPlaceNameFromLatLong = async (lat, lng) => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "vizstik-app" }
    });
    const data = await res.json();

    if (data && data.display_name) {
      return data.display_name;
    }

    return "Unknown Location";
  } catch (err) {
    console.error("Reverse geocode error:", err.message);
    return "Unknown Location";
  }
};

const wrapText = (text, maxCharsPerLine = 40) => {
  if (!text) return [""];

  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).length <= maxCharsPerLine) {
      currentLine = currentLine ? currentLine + " " + word : word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);

  return lines;
};


export const addOutletStamp = async ({
  inputPath,
  outputPath,
  branchName,
  wdCode,
  activity,
  latitude,
  longitude,
  salesmanName,
  sectionName
}) => {
  const image = sharp(inputPath);
  const meta = await image.metadata();

  const now = new Date();
  const date = now.toLocaleDateString("en-GB");
  const time = now.toLocaleTimeString("en-IN");

  // 🔥 Convert lat/long to place name
  const placeName = await getPlaceNameFromLatLong(latitude, longitude);

// 🔥 Wrap place text into multiple lines
const placeLines = wrapText(`Market Place: ${placeName}`, 45);

// 🔥 Dynamic box height
const baseHeight = 300;
const extraHeight = placeLines.length * 30;
const boxHeight = baseHeight + extraHeight;

let placeTextSvg = "";
let startY = 155;

placeLines.forEach((line, index) => {
  placeTextSvg += `<text x="30" y="${startY + index * 30}" class="text">${line}</text>\n`;
});

// Calculate next Y after place lines
const nextY = startY + placeLines.length * 30 + 10;

const svg = `
<svg width="${meta.width}" height="${boxHeight}">
  <style>
    .title { fill: white; font-size: 34px; font-weight: bold; }
    .text { fill: white; font-size: 24px; }
  </style>

  <rect x="0" y="0" width="${meta.width}" height="${boxHeight}" rx="20" ry="20" fill="black" opacity="0.7"/>

  <text x="30" y="45" class="title">${branchName}</text>
  <text x="30" y="85" class="text">WD Code: ${wdCode}</text>
  <text x="30" y="120" class="text">Activity: ${activity}</text>

  ${placeTextSvg}

  <text x="30" y="${nextY + 30}" class="text">Salesman: ${salesmanName}</text>
  <text x="30" y="${nextY + 65}" class="text">Section: ${sectionName}</text>
  <text x="30" y="${nextY + 105}" class="text">${date} | ${time}</text>
</svg>
`;


  await image
    .jpeg({ quality: 50 })
    .composite([
      {
        input: Buffer.from(svg),
        top: meta.height - boxHeight - 20,
        left: 20
      }
    ])
    .toFile(outputPath);

  return outputPath;
};

