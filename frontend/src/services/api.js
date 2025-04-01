import axios from 'axios';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API service functions
const api = {
  // Get model status
  getStatus: async () => {
    try {
      const response = await apiClient.get('/recommendations/status');
      return response.data;
    } catch (error) {
      console.error('Error fetching model status:', error);
      throw error;
    }
  },
  
  // Dashboard
  getDashboardData: async () => {
    try {
      // Try real dashboard endpoint first
      try {
        const response = await apiClient.get('/recommendations/dashboard');
        return response.data;
      } catch (mlError) {
        console.warn('ML dashboard endpoint failed, trying dummy data:', mlError);
        // Fall back to dummy data only if ML service endpoint fails
        const fallbackResponse = await apiClient.get('/dummy-data/dashboard');
        return fallbackResponse.data;
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  },
  
  // Products
  getProducts: async () => {
    try {
      // Try real products endpoint first
      try {
        const response = await apiClient.get('/recommendations/products');
        return response.data;
      } catch (mlError) {
        console.warn('ML products endpoint failed, trying dummy data:', mlError);
        // Fall back to dummy data only if ML service endpoint fails
        const fallbackResponse = await apiClient.get('/dummy-data/products');
        return fallbackResponse.data;
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },
  
  // Recommendations
  getRecommendations: async (itemIds) => {
    try {
      if (!itemIds || itemIds.length === 0) {
        throw new Error('Item IDs are required');
      }
      
      const response = await apiClient.get(`/recommendations?items=${itemIds.join(',')}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }
  },
  
  // Simulate transaction
  simulateTransaction: async (items) => {
    try {
      if (!items || items.length === 0) {
        throw new Error('Items are required');
      }
      
      const response = await apiClient.post('/simulate', { items });
      return response.data;
    } catch (error) {
      console.error('Error simulating transaction:', error);
      throw error;
    }
  },
  
  // Train model
  trainModel: async (params = {}) => {
    try {
      const response = await apiClient.post('/recommendations/train', params);
      return response.data;
    } catch (error) {
      console.error('Error training model:', error);
      throw error;
    }
  },

  
  // Get frequent itemsets
  getFrequentItemsets: async (params = {}) => {
    try {
      const { limit, min_support } = params;
      let url = '/recommendations/frequent-itemsets';
      
      if (limit || min_support) {
        const queryParams = [];
        if (limit) queryParams.push(`limit=${limit}`);
        if (min_support) queryParams.push(`min_support=${min_support}`);
        url += `?${queryParams.join('&')}`;
      }
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching frequent itemsets:', error);
      throw error;
    }
  },
  
  // Get association rules
  getAssociationRules: async (params = {}) => {
    try {
      const { limit, min_confidence, min_lift } = params;
      let url = '/recommendations/rules';
      
      if (limit || min_confidence || min_lift) {
        const queryParams = [];
        if (limit) queryParams.push(`limit=${limit}`);
        if (min_confidence) queryParams.push(`min_confidence=${min_confidence}`);
        if (min_lift) queryParams.push(`min_lift=${min_lift}`);
        url += `?${queryParams.join('&')}`;
      }
      
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching association rules:', error);
      throw error;
    }
  },
  
  // Mock for testing without backend
  mock: {
    getDashboardData: async () => {
      return {
        status: 'success',
        data: {
          stats: {
            total_transactions: 1265,
            total_products: 45,
            avg_basket_size: 3.2,
            avg_basket_value: 128.75
          },
          top_products: [
            { id: '47BEEB5D-1BDB-4F6C-86E4-1F797B880FE3', name: 'Product A', frequency: 325 },
            { id: '96FCBA4F-242A-401B-A594-3F0387D343C1', name: 'Product B', frequency: 287 },
            { id: '4237C225-F034-4EAE-9942-6C1345A5E154', name: 'Product C', frequency: 265 },
            { id: '904785D3-E6F4-4463-B535-720A806A5B79', name: 'Product D', frequency: 210 },
            { id: '43333FC2-C275-4A0E-9B78-A25B3CEC6CDC', name: 'Product E', frequency: 195 }
          ],
          top_combinations: [
            {
              antecedents: ['47BEEB5D-1BDB-4F6C-86E4-1F797B880FE3'],
              consequents: ['96FCBA4F-242A-401B-A594-3F0387D343C1'],
              support: 0.33,
              confidence: 0.85,
              lift: 2.5
            },
            {
              antecedents: ['904785D3-E6F4-4463-B535-720A806A5B79'],
              consequents: ['43333FC2-C275-4A0E-9B78-A25B3CEC6CDC'],
              support: 0.25,
              confidence: 0.75,
              lift: 2.1
            }
          ]
        }
      };
    }
  }
};

export default api; 