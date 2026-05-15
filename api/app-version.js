import fs from 'node:fs';
import path from 'node:path';

function readAppVersion() {
  const filePath = path.join(process.cwd(), 'utils', 'appversion.ts');
  const source = fs.readFileSync(filePath, 'utf8');
  const match = source.match(/APP_VERSION\s*=\s*['"`]([^'"`]+)['"`]/);
  if (!match || !match[1]) {
    throw new Error('APP_VERSION not found in utils/appversion.ts');
  }
  return match[1].trim();
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const version = readAppVersion();
    return res.status(200).json({ version });
  } catch (error) {
    console.error('app-version error:', error);
    return res.status(500).json({ error: 'Failed to read app version' });
  }
}
