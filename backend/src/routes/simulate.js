const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Service URL
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://ml-service:8000';

/**
 * @route   POST /api/simulate
 * @desc    Simulate a transaction and get recommendations
 * @access  Public
 */
router.post('/', async (req, res, next) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: {
          message: 'Items array is required',
          status: 400
        }
      });
    }
    
    // Format transaction data for ML service
    const transactionData = {
      transaction_id: uuidv4(),
      items: items.map(item => ({
        item_id: item.id || item,
        item_name: item.name || null,
        quantity: item.quantity || 1.0
      })),
      timestamp: new Date().toISOString()
    };
    
    // Call ML service to simulate transaction
    const response = await axios.post(`${ML_SERVICE_URL}/simulate`, transactionData);
    
    return res.json({
      ...response.data,
      timestamp: new Date().toISOString(),
      request_id: req.id
    });
  } catch (error) {
    console.error('Error simulating transaction:', error.message);
    
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
 * @route   POST /api/simulate/batch
 * @desc    Process multiple transactions in batch
 * @access  Public
 */
router.post('/batch', async (req, res, next) => {
  try {
    const { transactions } = req.body;
    
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        error: {
          message: 'Transactions array is required',
          status: 400
        }
      });
    }
    
    // Process each transaction
    const results = [];
    for (const transaction of transactions) {
      try {
        // Format transaction data
        const transactionData = {
          transaction_id: transaction.id || uuidv4(),
          items: transaction.items.map(item => ({
            item_id: item.id || item,
            item_name: item.name || null,
            quantity: item.quantity || 1.0
          })),
          timestamp: transaction.timestamp || new Date().toISOString()
        };
        
        // Call ML service
        const response = await axios.post(`${ML_SERVICE_URL}/simulate`, transactionData);
        
        results.push({
          transaction_id: transactionData.transaction_id,
          status: 'success',
          data: response.data
        });
      } catch (err) {
        results.push({
          transaction_id: transaction.id || 'unknown',
          status: 'error',
          error: err.message
        });
      }
    }
    
    return res.json({
      status: 'success',
      processed: results.length,
      results
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 