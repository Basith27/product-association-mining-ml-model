import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, Chip, CircularProgress, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ML_SERVICE_URL } from '../config';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
}));

const MetricBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[1],
  marginBottom: theme.spacing(2)
}));

const ProgressBar = styled(Box)(({ width = '100%' }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: '#e0e0e0',
  marginTop: 8,
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: width,
    backgroundColor: '#1976d2',
    borderRadius: 4,
    transition: 'width 0.5s ease-in-out'
  }
}));

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${ML_SERVICE_URL}/dashboard`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail?.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.status === 'success' && data.data) {
        setDashboardData(data.data);
      } else {
        throw new Error('Invalid data format received from server');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert 
          severity="error" 
          action={
            <button onClick={fetchDashboardData}>
              Retry
            </button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box p={3}>
        <Alert severity="info">
          No data available. Please train the model first.
        </Alert>
      </Box>
    );
  }

  const { metrics, top_products, top_combinations } = dashboardData;

  // Calculate max transactions for progress bars
  const maxTransactions = Math.max(...(top_products?.map(p => p.transactions) || [1]));

  return (
    <Box p={3}>
      {/* Metrics Section */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricBox>
            <Typography variant="subtitle2" color="textSecondary">
              📊 Transactions
            </Typography>
            <Typography variant="h4">
              {metrics?.total_transactions?.toLocaleString() || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Total processed transactions
            </Typography>
          </MetricBox>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricBox>
            <Typography variant="subtitle2" color="textSecondary">
              🛍️ Products
            </Typography>
            <Typography variant="h4">
              {metrics?.unique_products?.toLocaleString() || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Unique products in database
            </Typography>
          </MetricBox>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricBox>
            <Typography variant="subtitle2" color="textSecondary">
              🛒 Avg. Basket Size
            </Typography>
            <Typography variant="h4">
              {metrics?.avg_basket_size?.toFixed(1) || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Items per transaction
            </Typography>
          </MetricBox>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricBox>
            <Typography variant="subtitle2" color="textSecondary">
              💰 Avg. Basket Value
            </Typography>
            <Typography variant="h4">
              ${metrics?.avg_basket_value?.toFixed(2) || 0}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Average transaction value
            </Typography>
          </MetricBox>
        </Grid>
      </Grid>

      {/* Top Products and Combinations */}
      <Grid container spacing={3}>
        {/* Top Products */}
        <Grid item xs={12} md={6}>
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Top Products
            </Typography>
            {top_products?.map((product, index) => (
              <Box key={product.id} mb={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1">{product.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {product.transactions.toLocaleString()} transactions
                  </Typography>
                </Box>
                <ProgressBar width={`${(product.transactions / maxTransactions) * 100}%`} />
              </Box>
            ))}
          </StyledPaper>
        </Grid>

        {/* Top Product Combinations */}
        <Grid item xs={12} md={6}>
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Top Product Combinations
            </Typography>
            {top_combinations?.map((rule, index) => (
              <Box key={index} mb={3}>
                <Box mb={1}>
                  {rule.antecedents.map((item, i) => (
                    <Chip
                      key={`ant-${i}`}
                      label={item}
                      size="small"
                      color="primary"
                      variant="outlined"
                      style={{ margin: '2px' }}
                    />
                  ))}
                  <Typography variant="body2" component="span" mx={1}>
                    →
                  </Typography>
                  {rule.consequents.map((item, i) => (
                    <Chip
                      key={`cons-${i}`}
                      label={item}
                      size="small"
                      color="secondary"
                      style={{ margin: '2px' }}
                    />
                  ))}
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Support: {(rule.support * 100).toFixed(1)}% • 
                  Confidence: {(rule.confidence * 100).toFixed(1)}% • 
                  Lift: {rule.lift.toFixed(2)}
                </Typography>
              </Box>
            ))}
          </StyledPaper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 