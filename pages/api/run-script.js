import fs from 'fs';
import path from 'path';

import { searchAndRecolor } from '../../scripts/color-change.mjs';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { selectedArea, searchTerm } = req.body;
    const imagePreviews = req.body.imagePreviews;

    // Fixed output format to jpeg
    const outputFormat = 'jpeg';

    // Define temporary directory
    const tempDir = path.join('/tmp');
    // Create the directory if it does not exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Temporarily save the image file
    const rand = Math.floor(Math.random() * 1000000);
    const imagePath = `uploaded-image-${rand}.png`;
    const tempImagePath = path.join(tempDir, imagePath);
    fs.writeFileSync(tempImagePath, imagePreviews.split(',')[1], 'base64');

    try {
      // Call the recolor script
      const { imagePath: recoloredImagePath } = await searchAndRecolor(tempImagePath, selectedArea, searchTerm);
      const base64Image = fs.readFileSync(recoloredImagePath, { encoding: 'base64' });

      // Return the image as a response
      res.status(200).json({ base64Image: `data:image/${outputFormat};base64,${base64Image}` });
    } catch (error) {
      console.error("Script execution error:", error);
      res.status(500).json({ error: error.message || "Failed to execute the script" });
    } finally {
      // Delete the temporary file
      fs.unlinkSync(tempImagePath);
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
