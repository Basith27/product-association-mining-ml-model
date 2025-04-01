import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  Grid,
  Chip,
  TextField,
  Autocomplete,
  Card,
  CardContent,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  ShoppingCart,
  Delete,
  Add,
  PlayArrow,
  Refresh,
  Info,
} from '@mui/icons-material';
import api from '../services/api';

const SimulateTransaction = () => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    // Fetch products
    const fetchProducts = async () => {
      try {
        // Get real product data from the API
        const response = await api.getProducts();
        
        if (response && response.data) {
          setProducts(response.data);
        } else {
          console.error('Invalid product data received');
          setError('Failed to load products data. Invalid response format.');
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
      }
    };

    fetchProducts();
  }, []);

  const handleAddProduct = () => {
    if (selectedProduct && !selectedProducts.some(p => p.id === selectedProduct.id)) {
      setSelectedProducts([...selectedProducts, { ...selectedProduct, quantity: 1 }]);
      setSelectedProduct(null);
    }
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const handleUpdateQuantity = (productId, quantity) => {
    if (quantity > 0) {
      setSelectedProducts(
        selectedProducts.map(p => 
          p.id === productId ? { ...p, quantity: parseInt(quantity, 10) } : p
        )
      );
    }
  };

  const handleSimulate = async () => {
    if (selectedProducts.length === 0) {
      setError('Please add at least one product to simulate a transaction.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Call the real API to simulate transaction and get recommendations
      const response = await api.simulateTransaction(selectedProducts);
      
      if (response && response.recommendations) {
        setRecommendations(response.recommendations);
        setSuccess(true);
      } else {
        setError('No recommendations received from the server.');
      }
    } catch (err) {
      console.error('Error simulating transaction:', err);
      setError(err.message || 'Failed to simulate transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedProducts([]);
    setRecommendations([]);
    setSuccess(false);
    setError(null);
  };

  // Calculate total
  const totalAmount = selectedProducts.reduce(
    (sum, product) => sum + product.price * product.quantity,
    0
  );

  return (
    <Box sx={{ flexGrow: 1, py: 2 }}>
      <Typography variant="h4" gutterBottom>
        Simulate Transaction
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Select products to simulate a transaction and receive product recommendations.
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ShoppingCart color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">
                Shopping Cart
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', alignItems: 'flex-end', mb: 3 }}>
              <Autocomplete
                value={selectedProduct}
                onChange={(event, newValue) => {
                  setSelectedProduct(newValue);
                }}
                sx={{ flexGrow: 1, mr: 1 }}
                options={products}
                getOptionLabel={(option) => `${option.name} - $${option.price.toFixed(2)}`}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Products"
                    variant="outlined"
                    fullWidth
                  />
                )}
              />
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={handleAddProduct}
                disabled={!selectedProduct}
              >
                Add
              </Button>
            </Box>
            
            {selectedProducts.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Your cart is empty. Add products to simulate a transaction.
                </Typography>
              </Box>
            ) : (
              <List>
                {selectedProducts.map((product) => (
                  <ListItem key={product.id} divider>
                    <ListItemText
                      primary={product.name}
                      secondary={`${product.category} • $${product.price.toFixed(2)}`}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                      <TextField
                        label="Qty"
                        type="number"
                        size="small"
                        InputProps={{ inputProps: { min: 1 } }}
                        value={product.quantity}
                        onChange={(e) => handleUpdateQuantity(product.id, e.target.value)}
                        sx={{ width: 80, mr: 2 }}
                      />
                      <Typography variant="body1" sx={{ mr: 2, minWidth: 80, textAlign: 'right' }}>
                        ${(product.price * product.quantity).toFixed(2)}
                      </Typography>
                      <IconButton
                        edge="end"
                        color="error"
                        onClick={() => handleRemoveProduct(product.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
            
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 3,
                pt: 2,
                borderTop: '1px solid #e0e0e0',
              }}
            >
              <Typography variant="h6">
                Total: ${totalAmount.toFixed(2)}
              </Typography>
              <Box>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<Refresh />}
                  onClick={handleReset}
                  sx={{ mr: 1 }}
                  disabled={selectedProducts.length === 0}
                >
                  Reset
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                  onClick={handleSimulate}
                  disabled={loading || selectedProducts.length === 0}
                >
                  {loading ? 'Simulating...' : 'Simulate Transaction'}
                </Button>
              </Box>
            </Box>
          </Paper>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
              <AlertTitle>Error</AlertTitle>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess(false)}>
              <AlertTitle>Success</AlertTitle>
              Transaction simulated successfully!
            </Alert>
          )}
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="div">
                  Recommended Products
                </Typography>
                <Tooltip title="Products frequently bought together with your selected items">
                  <IconButton size="small" sx={{ ml: 1 }}>
                    <Info fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {recommendations.length === 0 ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {loading
                      ? 'Generating recommendations...'
                      : selectedProducts.length === 0
                      ? 'Add products to the cart to see recommendations'
                      : 'Simulate a transaction to get recommendations'}
                  </Typography>
                  {loading && (
                    <CircularProgress size={40} sx={{ mt: 2 }} />
                  )}
                </Box>
              ) : (
                <List>
                  {recommendations.map((rec) => (
                    <ListItem key={rec.item_id} divider>
                      <ListItemText
                        primary={rec.name}
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Chip 
                              label={`Confidence: ${(rec.confidence * 100).toFixed(0)}%`} 
                              size="small" 
                              color="primary"
                              variant="outlined"
                              sx={{ mr: 1, mb: 1 }}
                            />
                            <Chip 
                              label={`Lift: ${rec.lift.toFixed(1)}`} 
                              size="small" 
                              color="secondary"
                              variant="outlined"
                              sx={{ mr: 1, mb: 1 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SimulateTransaction;
