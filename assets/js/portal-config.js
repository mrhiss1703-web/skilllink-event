// React portal base URL and unified API configuration
const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
window.SKILLLINK_PORTAL_URL = isLocal
  ? `http://${window.location.hostname}:5173`
  : 'https://skilllink-admin-fawn.vercel.app';
window.SKILLLINK_API_URL = `${window.SKILLLINK_PORTAL_URL}/api`;
