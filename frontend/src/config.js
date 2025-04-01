// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
export const ML_SERVICE_URL = process.env.REACT_APP_ML_SERVICE_URL || 'http://localhost:8000';

// Other configuration settings
export const APP_CONFIG = {
  maxRecommendations: 5,
  defaultMinSupport: 0.01,
  defaultMinConfidence: 0.5
}; 