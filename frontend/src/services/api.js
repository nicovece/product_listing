const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const fetchProducts = async (filters = {}) => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== '') {
      params.append(key, value);
    }
  });

  const response = await fetch(`${API_BASE_URL}/api/products?${params}`);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

export const healthCheck = async () => {
  const response = await fetch(`${API_BASE_URL}/health`);
  
  if (!response.ok) {
    throw new Error(`Health check failed! status: ${response.status}`);
  }
  
  return response.json();
};