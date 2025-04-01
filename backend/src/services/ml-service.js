const axios = require('axios');
const logger = require('../utils/logger');

// ML Service URL from environment variable or default
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://ml-service:8000';

/**
 * ML Service client
 */
class MLService {
  /**
   * Get the status of the ML model
   * @returns {Promise<Object>} Model status
   */
  async getStatus() {
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/status`);
      return response.data;
    } catch (error) {
      logger.error('Error getting ML model status:', error.message);
      throw error;
    }
  }

  /**
   * Train the ML model
   * @param {Object} params - Training parameters
   * @param {number} [params.min_support=0.01] - Minimum support threshold
   * @param {number} [params.min_threshold=0.5] - Minimum confidence threshold
   * @param {boolean} [params.use_sample_data=true] - Whether to use sample data
   * @returns {Promise<Object>} Training result
   */
  async trainModel(params = {}) {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/train`, {
        min_support: params.min_support || 0.01,
        min_threshold: params.min_threshold || 0.5,
        use_sample_data: params.use_sample_data !== undefined ? params.use_sample_data : true
      });
      return response.data;
    } catch (error) {
      logger.error('Error training ML model:', error.message);
      throw error;
    }
  }

  /**
   * Get recommendations based on item IDs
   * @param {string[]} items - Array of item IDs
   * @param {Object} params - Optional parameters
   * @param {number} [params.min_support=0.01] - Minimum support threshold
   * @param {number} [params.min_threshold=0.5] - Minimum confidence threshold
   * @returns {Promise<Object>} Recommendations
   */
  async getRecommendations(items, params = {}) {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/recommend`, {
        items,
        min_support: params.min_support || 0.01,
        min_threshold: params.min_threshold || 0.5
      });
      return response.data;
    } catch (error) {
      logger.error('Error getting recommendations:', error.message);
      throw error;
    }
  }

  /**
   * Simulate a transaction and get recommendations
   * @param {Object} transaction - Transaction data
   * @returns {Promise<Object>} Simulation result
   */
  async simulateTransaction(transaction) {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/simulate`, transaction);
      return response.data;
    } catch (error) {
      logger.error('Error simulating transaction:', error.message);
      throw error;
    }
  }

  /**
   * Get frequent itemsets
   * @param {Object} params - Optional parameters
   * @param {number} [params.limit=20] - Maximum number of results
   * @param {number} [params.min_support=0.01] - Minimum support threshold
   * @returns {Promise<Object>} Frequent itemsets
   */
  async getFrequentItemsets(params = {}) {
    try {
      // Build query string
      let queryParams = '';
      if (params.limit) queryParams += `limit=${params.limit}&`;
      if (params.min_support) queryParams += `min_support=${params.min_support}`;
      
      const url = `${ML_SERVICE_URL}/frequent-itemsets${queryParams ? `?${queryParams}` : ''}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      logger.error('Error getting frequent itemsets:', error.message);
      throw error;
    }
  }

  /**
   * Get association rules
   * @param {Object} params - Optional parameters
   * @param {number} [params.limit=20] - Maximum number of results
   * @param {number} [params.min_confidence=0.5] - Minimum confidence threshold
   * @param {number} [params.min_lift=1.0] - Minimum lift threshold
   * @returns {Promise<Object>} Association rules
   */
  async getAssociationRules(params = {}) {
    try {
      // Build query string
      let queryParams = '';
      if (params.limit) queryParams += `limit=${params.limit}&`;
      if (params.min_confidence) queryParams += `min_confidence=${params.min_confidence}&`;
      if (params.min_lift) queryParams += `min_lift=${params.min_lift}`;
      
      const url = `${ML_SERVICE_URL}/rules${queryParams ? `?${queryParams}` : ''}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      logger.error('Error getting association rules:', error.message);
      throw error;
    }
  }
}

module.exports = new MLService(); 