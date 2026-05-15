import { APP_VERSION } from '../utils/appversion';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    return res.status(200).json({ version: APP_VERSION });
  } catch (error) {
    console.error('app-version error:', error);
    return res.status(500).json({ error: 'Failed to read app version' });
  }
}
