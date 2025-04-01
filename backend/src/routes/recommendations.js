const express = require('express');
const axios = require('axios');
const router = express.Router();

// Service URL
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://ml-service:8000';

/**
 * @route   GET /api/recommendations/status
 * @desc    Get model status
 * @access  Public
 */
router.get('/status', async (req, res, next) => {
  try {
    // Call ML service for status
    const response = await axios.get(`${ML_SERVICE_URL}/status`);
    
    return res.json(response.data);
  } catch (error) {
    console.error('Error getting model status:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: {
          message: error.response.data.detail || 'Error from ML service',
          status: error.response.status
        }
      });
    }
    
    next(error);
  }
});

/**
 * @route   GET /api/recommendations
 * @desc    Get recommendations based on item IDs
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const { items } = req.query;
    
    if (!items) {
      return res.status(400).json({
        error: {
          message: 'Item IDs are required (as comma-separated values)',
          status: 400
        }
      });
    }
    
    const itemIds = items.split(',').map(id => id.trim());
    
    // Call ML service for recommendations
    const response = await axios.post(`${ML_SERVICE_URL}/recommend`, {
      items: itemIds
    });
    
    return res.json(response.data);
  } catch (error) {
    console.error('Error getting recommendations:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: {
          message: error.response.data.detail || 'Error from ML service',
          status: error.response.status
        }
      });
    }
    
    next(error);
  }
});

/**
 * @route   GET /api/recommendations/frequent-itemsets
 * @desc    Get frequent itemsets from ML service
 * @access  Public
 */
router.get('/frequent-itemsets', async (req, res, next) => {
  try {
    const { limit, min_support } = req.query;
    
    // Build query string
    let queryParams = '';
    if (limit) queryParams += `limit=${limit}&`;
    if (min_support) queryParams += `min_support=${min_support}`;
    
    // Call ML service for frequent itemsets
    const response = await axios.get(`${ML_SERVICE_URL}/frequent-itemsets?${queryParams}`);
    
    return res.json(response.data);
  } catch (error) {
    console.error('Error getting frequent itemsets:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: {
          message: error.response.data.detail || 'Error from ML service',
          status: error.response.status
        }
      });
    }
    
    next(error);
  }
});

/**
 * @route   GET /api/recommendations/rules
 * @desc    Get association rules from ML service
 * @access  Public
 */
router.get('/rules', async (req, res, next) => {
  try {
    const { limit, min_confidence, min_lift } = req.query;
    
    // Build query string
    let queryParams = '';
    if (limit) queryParams += `limit=${limit}&`;
    if (min_confidence) queryParams += `min_confidence=${min_confidence}&`;
    if (min_lift) queryParams += `min_lift=${min_lift}`;
    
    // Call ML service for rules
    const response = await axios.get(`${ML_SERVICE_URL}/rules?${queryParams}`);
    
    return res.json(response.data);
  } catch (error) {
    console.error('Error getting rules:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: {
          message: error.response.data.detail || 'Error from ML service',
          status: error.response.status
        }
      });
    }
    
    next(error);
  }
});

/**
 * @route   POST /api/recommendations/train
 * @desc    Train ML model
 * @access  Public
 */
router.post('/train', async (req, res, next) => {
  try {
    const { min_support, min_threshold, use_sample_data } = req.body;
    
    // Call ML service to train model
    const response = await axios.post(`${ML_SERVICE_URL}/train`, {
      min_support,
      min_threshold,
      use_sample_data
    });
    
    return res.json(response.data);
  } catch (error) {
    console.error('Error training model:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: {
          message: error.response.data.detail || 'Error from ML service',
          status: error.response.status
        }
      });
    }
    
    next(error);
  }
});

/**
 * @route   GET /api/recommendations/dashboard
 * @desc    Get real dashboard data from the ML service
 * @access  Public
 */
router.get('/dashboard', async (req, res, next) => {
  try {
    // Check if ML service is available
    const statusResponse = await axios.get(`${ML_SERVICE_URL}/status`);
    
    if (!statusResponse.data.model_trained) {
      return res.status(400).json({
        error: {
          message: 'Model not trained. Please train the model first before accessing dashboard data.',
          status: 400
        }
      });
    }
    
    // Get frequent itemsets for top products
    const itemsetsResponse = await axios.get(`${ML_SERVICE_URL}/frequent-itemsets?limit=5`);
    
    // Get rules for top combinations
    const rulesResponse = await axios.get(`${ML_SERVICE_URL}/rules?limit=5`);
    
    // Get model status for stats
    const stats = {
      total_transactions: statusResponse.data.transactions_count || 0,
      total_products: statusResponse.data.unique_items_count || 0,
      avg_basket_size: statusResponse.data.avg_basket_size || 0,
      avg_basket_value: statusResponse.data.avg_basket_value || 0
    };
    
    // Format top products
    const top_products = itemsetsResponse.data.frequent_itemsets
      .filter(itemset => itemset.itemset.length === 1)
      .map((itemset, index) => ({
        id: itemset.itemset[0],
        name: itemset.product_name || `Unknown Product (${itemset.itemset[0]})`,
        frequency: Math.round(itemset.support * statusResponse.data.transactions_count)
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);
      
    // Format top combinations
    const top_combinations = rulesResponse.data.rules
      .map(rule => ({
        antecedents: rule.antecedent_names || rule.antecedents.map(id => `Unknown Product (${id})`),
        consequents: rule.consequent_names || rule.consequents.map(id => `Unknown Product (${id})`),
        support: rule.support,
        confidence: rule.confidence,
        lift: rule.lift
      }))
      .slice(0, 5);
    
    return res.json({
      status: 'success',
      data: {
        stats,
        top_products,
        top_combinations
      }
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: {
          message: error.response.data.detail || 'Error from ML service',
          status: error.response.status
        }
      });
    }
    
    // If ML service is not available, pass to next error handler
    next(error);
  }
});

/**
 * @route   GET /api/recommendations/products
 * @desc    Get real product data from the ML service
 * @access  Public
 */
router.get('/products', async (req, res, next) => {
  try {
    // Check if ML service is available
    const statusResponse = await axios.get(`${ML_SERVICE_URL}/status`);
    
    if (!statusResponse.data.model_trained) {
      return res.status(400).json({
        error: {
          message: 'Model not trained. Please train the model first before accessing product data.',
          status: 400
        }
      });
    }
    
    // Get frequent itemsets for products
    const itemsetsResponse = await axios.get(`${ML_SERVICE_URL}/frequent-itemsets?limit=50`);
    
    // Format products for dropdown
    const products = itemsetsResponse.data.frequent_itemsets
      .filter(itemset => itemset.itemset.length === 1)
      .map((itemset, index) => {
        const itemId = itemset.itemset[0];
        // Generate price based on item ID to keep it consistent
        const itemIdSum = itemId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const price = (10 + (itemIdSum % 90)).toFixed(2);
        
        // Determine category based on item ID
        const categories = ['Electronics', 'Kitchen', 'Home', 'Food', 'Clothing'];
        const category = categories[itemIdSum % categories.length];
        
        return {
          id: itemId,
          name: itemset.product_name || `Unknown Product (${itemId})`,
          price: parseFloat(price),
          category
        };
      });
    
    return res.json({
      status: 'success',
      data: products
    });
  } catch (error) {
    console.error('Error getting products data:', error.message);
    
    if (error.response) {
      return res.status(error.response.status).json({
        error: {
          message: error.response.data.detail || 'Error from ML service',
          status: error.response.status
        }
      });
    }
    
    // If ML service is not available, pass to next error handler
    next(error);
  }
});

module.exports = router; 