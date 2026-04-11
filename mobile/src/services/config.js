// IMPORTANT: Update this IP to match your computer's local network IP
// On Windows: run 'ipconfig' and look for IPv4 Address
// On Mac/Linux: run 'ifconfig' and look for inet

// For Android emulator: use 'http://10.0.2.2:5000'
// For iOS simulator: use 'http://localhost:5000'

const getApiUrl = () => {
  // You can change this to your actual IP address
  return 'http://192.168.1.5:5000';
};

export const API_URL = getApiUrl();
export const UPLOADS_URL = `${API_URL}/uploads/`;
