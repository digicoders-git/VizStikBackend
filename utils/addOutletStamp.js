import sharp from "sharp";

export const addOutletStamp = async ({
  inputPath,
  outputPath,
  branchName,
  wdCode,
  activity,
  latitude,
  longitude
}) => {
  const image = sharp(inputPath);

  const meta = await image.metadata();

  const now = new Date();
  const date = now.toLocaleDateString("en-GB"); // 23/01/2026
  const time = now.toLocaleTimeString("en-IN"); // 12:09 PM

  const boxHeight = 200;

  const svg = `
  <svg width="${meta.width}" height="${boxHeight}">
    <style>
      .title { fill: white; font-size: 34px; font-weight: bold; }
      .text { fill: white; font-size: 26px; }
    </style>

    <rect x="0" y="0" width="${meta.width}" height="${boxHeight}" rx="20" ry="20" fill="black" opacity="0.7"/>

    <text x="30" y="45" class="title">${branchName}</text>
    <text x="30" y="85" class="text">WD Code: ${wdCode}</text>
    <text x="30" y="120" class="text">Activity: ${activity}</text>
    <text x="30" y="155" class="text">Lat: ${latitude} , Long: ${longitude}</text>
    <text x="30" y="190" class="text">${date} | ${time}</text>
  </svg>
  `;

  await image
    .jpeg({ quality: 50 }) // ✅ 50% compression
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
