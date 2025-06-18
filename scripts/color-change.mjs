import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';

// Get your API key from https://platform.stability.ai/account/keys
const STABILITY_KEY = 'sk-Zt04Erl3isku07L87Uv1F7whOos4BCOj1XVSD4T6u2aT9z6n';
const DEEPL_API_KEY = '7109a586-8fde-4466-8aa9-adb4b624d254:fx';

// Define functions
async function sendGenerationRequest(host, params) {
    const headers = {
        "Accept": "application/json",
        "Authorization": `Bearer ${STABILITY_KEY}`
    };

    const formData = new FormData();
    
    for (const [key, value] of Object.entries(params)) {
        if (key === 'image' && value) {
            formData.append(key, await fs.readFile(value), path.basename(value));
        } else {
            formData.append(key, value);
        }
    }

    try {
        console.log(`Sending REST request to ${host}...`);
        const response = await axios.post(host, formData, {
            headers: {
                ...headers,
                ...formData.getHeaders(),
            },
        });

        return response.data.image;
    } catch (error) {
        console.error("Error response:", error.response?.data || error.message);
        throw error;
    }
}

// DeepL APIを使用した翻訳関数
async function translateText(text) {
    const response = await axios.post('https://api-free.deepl.com/v2/translate', null, {
        params: {
            auth_key: DEEPL_API_KEY, 
            text: text,
            source_lang: 'JA',
            target_lang: 'EN',
        }
    });
    return response.data.translations[0].text; 
}

// Search-and-Recolor
export const  searchAndRecolor = async (image_path, selected_area, color) => {
    selected_area = await translateText(selected_area); 
    color = await translateText(color); 

    const image = image_path
    const prompt = `${color} ${selected_area}`;
    const select_prompt = selected_area;
    const negative_prompt = `Avoid colorful accents, do not change the color of windows, doors, etc., except for the ${selected_area}`;
    const grow_mask = 0;
    const seed = 0;
    const outputFormat = 'jpeg';

    const host = "https://api.stability.ai/v2beta/stable-image/edit/search-and-recolor";

    console.log("Translated selected area:", selected_area);
    console.log("Translated color:", color);

    const params = {
        "image": image, 
        "grow_mask": grow_mask,
        "seed": seed,
        "mode": "search",
        "output_format": outputFormat,
        "prompt": prompt,
        "negative_prompt": negative_prompt,
        "select_prompt": select_prompt
      };

    console.log("Request parameters:", params);

    const response = await sendGenerationRequest(host, params);

    // Specify the directory to save the image
    const outputDirectory = path.join('/tmp');
    await fs.mkdir(outputDirectory, { recursive: true });

    // Create a unique filename
    const outputImageFilename = `outputData.${outputFormat}`;
    const outputImagePath = path.join(outputDirectory, outputImageFilename);
    const Imagebuffer = Buffer.from(response,'base64');

    // Save the image
    await fs.writeFile(outputImagePath, Imagebuffer);


    // Return the file path
    return {
        "imagePath": outputImagePath,
    };
}
