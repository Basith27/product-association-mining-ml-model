const express = require('express');
const router = express.Router();

// Sample product data
const products = [
  { id: '47BEEB5D-1BDB-4F6C-86E4-1F797B880FE3', name: 'Product A', price: 92.99, category: 'Electronics' },
  { id: '96FCBA4F-242A-401B-A594-3F0387D343C1', name: 'Product B', price: 22.21, category: 'Kitchen' },
  { id: '4237C225-F034-4EAE-9942-6C1345A5E154', name: 'Product C', price: 35.00, category: 'Home' },
  { id: '904785D3-E6F4-4463-B535-720A806A5B79', name: 'Product D', price: 25.50, category: 'Kitchen' },
  { id: '43333FC2-C275-4A0E-9B78-A25B3CEC6CDC', name: 'Product E', price: 134.00, category: 'Electronics' },
  { id: '63B86B47-FFA3-497F-982E-A5CB447A23AA', name: 'Product F', price: 146.08, category: 'Clothing' },
  { id: '8DE784F8-47B2-4EE4-9F96-BF41F479E6A6', name: 'Product G', price: 149.11, category: 'Electronics' },
  { id: 'F457C50F-1F02-47F8-8FFE-CE48970EF1FD', name: 'Product H', price: 220.00, category: 'Home' },
  { id: '6FF48F85-2033-4170-9A96-D676D6AB71EF', name: 'Product I', price: 21.00, category: 'Kitchen' },
  { id: '4B87FABD-B0F2-4744-ACF9-39DD03270B9C', name: 'Product J', price: 9.88, category: 'Food' },
  { id: 'F1991D45-C318-43FA-AF75-6A8AC62D8B37', name: 'Product K', price: 41.00, category: 'Clothing' },
  { id: '9DCB57F8-0581-4BCB-ACA4-6B767820A1FF', name: 'Product L', price: 62.00, category: 'Electronics' },
  { id: '09A7F304-1025-4B6D-A244-A74FF24EA7F6', name: 'Product M', price: 24.86, category: 'Food' },
  { id: 'B546C83E-B24D-4845-B801-AEB215734650', name: 'Product N', price: 19.80, category: 'Kitchen' }
];

// Sample transaction data
const transactions = [
  {
    id: '655EE3A0-8417-4D85-A538-BB659294AC58',
    date: '2023-04-01T18:20:23.537Z',
    items: [
      { id: '47BEEB5D-1BDB-4F6C-86E4-1F797B880FE3', quantity: 1 },
      { id: '96FCBA4F-242A-401B-A594-3F0387D343C1', quantity: 1 },
      { id: '4237C225-F034-4EAE-9942-6C1345A5E154', quantity: 1 }
    ],
    total: 150.20
  },
  {
    id: 'E654D0DC-5DEB-4D0A-AB86-C428CA04F23B',
    date: '2023-04-15T17:55:59.887Z',
    items: [
      { id: '904785D3-E6F4-4463-B535-720A806A5B79', quantity: 1 },
      { id: '43333FC2-C275-4A0E-9B78-A25B3CEC6CDC', quantity: 1 }
    ],
    total: 159.50
  },
  {
    id: 'C88D9742-5D00-4503-91D8-EB361C6261FC',
    date: '2023-04-02T19:12:29.007Z',
    items: [
      { id: '63B86B47-FFA3-497F-982E-A5CB447A23AA', quantity: 1 },
      { id: '8DE784F8-47B2-4EE4-9F96-BF41F479E6A6', quantity: 1 },
      { id: 'F457C50F-1F02-47F8-8FFE-CE48970EF1FD', quantity: 1 }
    ],
    total: 515.19
  }
];

// Sample association rules
const rules = [
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
  },
  {
    antecedents: ['63B86B47-FFA3-497F-982E-A5CB447A23AA', '8DE784F8-47B2-4EE4-9F96-BF41F479E6A6'],
    consequents: ['F457C50F-1F02-47F8-8FFE-CE48970EF1FD'],
    support: 0.15,
    confidence: 0.65,
    lift: 1.8
  }
];

/**
 * @route   GET /api/dummy-data/products
 * @desc    Get sample product data
 * @access  Public
 */
router.get('/products', (req, res) => {
  return res.json({
    status: 'success',
    data: products
  });
});

/**
 * @route   GET /api/dummy-data/products/:id
 * @desc    Get sample product by ID
 * @access  Public
 */
router.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  
  if (!product) {
    return res.status(404).json({
      error: {
        message: 'Product not found',
        status: 404
      }
    });
  }
  
  return res.json({
    status: 'success',
    data: product
  });
});

/**
 * @route   GET /api/dummy-data/transactions
 * @desc    Get sample transaction data
 * @access  Public
 */
router.get('/transactions', (req, res) => {
  return res.json({
    status: 'success',
    data: transactions
  });
});

/**
 * @route   GET /api/dummy-data/rules
 * @desc    Get sample association rules
 * @access  Public
 */
router.get('/rules', (req, res) => {
  return res.json({
    status: 'success',
    data: rules
  });
});

/**
 * @route   GET /api/dummy-data/dashboard
 * @desc    Get sample dashboard data
 * @access  Public
 */
router.get('/dashboard', (req, res) => {
  return res.json({
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
      top_combinations: rules
    }
  });
});

module.exports = router; 