import convert from 'heic-convert';
import imageType from 'image-type';

// API Body Parser の設定
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { fileBuffer, fileName } = req.body;

  if (!fileBuffer || !fileName) {
    return res.status(400).json({ message: 'Invalid request data.' });
  }

  try {
    // Base64をバッファに変換
    const buffer = Buffer.from(fileBuffer, 'base64');
    
    // ファイルタイプ確認
    const type = await imageType(buffer);
    console.log('Detected file type:', type); 

    if (!type || type.ext !== 'heic') {
      return res.status(400).json({ message: 'Uploaded file is not a HEIC image.' });
    }

    // HEIC変換
    const outputBuffer = await convert({
      buffer, // バッファをそのまま渡す
      format: 'JPEG', // 出力フォーマット
    });

    // 変換後の画像をBase64で返す
    res.status(200).json({
      base64Image: outputBuffer.toString('base64'),
      convertedFileName: fileName.replace(/\.heic$/i, '.jpg'),
    });
  } catch (error) {
    console.error('Error during HEIC conversion:', error);
    res.status(500).json({ message: 'Error during HEIC conversion.' });
  }
}
