import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper, Chip, CircularProgress, Alert, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { ML_SERVICE_URL } from '../config';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: 0,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: 'none',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  overflow: 'hidden'
}));

const MetricBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: 'none',
  border: '1px solid #e0e0e0',
  borderRadius: '8px'
}));

const ProgressBar = styled(Box)(({ width = '100%' }) => ({
  height: 4,
  borderRadius: 2,
  backgroundColor: '#e3f2fd',
  marginTop: 8,
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: width,
    backgroundColor: '#2196f3',
    borderRadius: 2,
    transition: 'width 0.5s ease-in-out'
  }
}));

const SectionHeader = styled(Box)(({ theme, color = '#2196f3' }) => ({
  backgroundColor: color,
  color: '#fff',
  padding: '16px 20px',
  fontWeight: 500,
  fontSize: '1.1rem'
}));

const ContentBox = styled(Box)({
  padding: '20px'
});

const StyledChip = styled(Chip)(({ theme, variant }) => ({
  marginRight: 8,
  marginBottom: 8,
  borderRadius: 4,
  backgroundColor: variant === 'outlined' ? '#fff' : '#2196f3',
  color: variant === 'outlined' ? '#666' : '#fff',
  border: variant === 'outlined' ? '1px solid #e0e0e0' : 'none',
  '& .MuiChip-label': {
    padding: '4px 8px'
  }
}));

const MetricValue = styled(Typography)({
  fontSize: '2rem',
  fontWeight: 500,
  marginBottom: 4
});

const MetricLabel = styled(Typography)({
  color: '#666',
  fontSize: '0.875rem'
});

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
      <Typography variant="h5" gutterBottom>
        Market Basket Analysis Dashboard
      </Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Analyze frequently bought-together items using the Apriori algorithm.
      </Typography>

      {/* Metrics Section */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricBox>
            <Box display="flex" alignItems="center" mb={1}>
              <Typography variant="body2" color="primary" sx={{ mr: 1 }}>📈</Typography>
              <MetricLabel>Transactions</MetricLabel>
            </Box>
            <MetricValue>
              {metrics?.total_transactions?.toLocaleString() || 0}
            </MetricValue>
            <MetricLabel>
              Total processed transactions
            </MetricLabel>
          </MetricBox>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricBox>
            <Box display="flex" alignItems="center" mb={1}>
              <Typography variant="body2" color="primary" sx={{ mr: 1 }}>🛍️</Typography>
              <MetricLabel>Products</MetricLabel>
            </Box>
            <MetricValue>
              {metrics?.unique_products?.toLocaleString() || 0}
            </MetricValue>
            <MetricLabel>
              Unique products in database
            </MetricLabel>
          </MetricBox>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricBox>
            <Box display="flex" alignItems="center" mb={1}>
              <Typography variant="body2" color="primary" sx={{ mr: 1 }}>🛒</Typography>
              <MetricLabel>Avg. Basket Size</MetricLabel>
            </Box>
            <MetricValue>
              {metrics?.avg_basket_size?.toFixed(1) || 0}
            </MetricValue>
            <MetricLabel>
              Items per transaction
            </MetricLabel>
          </MetricBox>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricBox>
            <Box display="flex" alignItems="center" mb={1}>
              <Typography variant="body2" color="primary" sx={{ mr: 1 }}>💰</Typography>
              <MetricLabel>Avg. Basket Value</MetricLabel>
            </Box>
            <MetricValue>
              ${metrics?.avg_basket_value?.toFixed(2) || 0}
            </MetricValue>
            <MetricLabel>
              Average transaction value
            </MetricLabel>
          </MetricBox>
        </Grid>
      </Grid>

      {/* Top Products and Combinations */}
      <Grid container spacing={3}>
        {/* Top Products */}
        <Grid item xs={12} md={6}>
          <StyledPaper>
            <SectionHeader>Top Products</SectionHeader>
            <ContentBox>
              {dashboardData?.top_products?.map((product, index) => (
                <Box key={product.id} mb={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body1">
                      {product.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {product.transactions.toLocaleString()} transactions
                    </Typography>
                  </Box>
                  <ProgressBar width={`${(product.transactions / Math.max(...dashboardData.top_products.map(p => p.transactions))) * 100}%`} />
                </Box>
              ))}
            </ContentBox>
          </StyledPaper>
        </Grid>

        {/* Top Product Combinations */}
        <Grid item xs={12} md={6}>
          <StyledPaper>
            <SectionHeader color="#e91e63">Top Product Combinations</SectionHeader>
            <ContentBox>
              {dashboardData?.top_combinations?.map((combination, index) => (
                <Box key={index} mb={3}>
                  <Box mb={1}>
                    {combination.antecedents.map((item, i) => (
                      <StyledChip
                        key={i}
                        label={item}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                    <Typography 
                      variant="body2" 
                      component="span" 
                      sx={{ mx: 1, color: '#666' }}
                    >
                      →
                    </Typography>
                    {combination.consequents.map((item, i) => (
                      <StyledChip
                        key={i}
                        label={item}
                        size="small"
                      />
                    ))}
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Support: {(combination.support * 100).toFixed(1)}% • 
                    Confidence: {(combination.confidence * 100).toFixed(1)}% • 
                    Lift: {combination.lift.toFixed(2)}
                  </Typography>
                </Box>
              ))}
            </ContentBox>
          </StyledPaper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>Quick Actions</Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button variant="contained" color="primary">
              SIMULATE TRANSACTION
            </Button>
          </Grid>
          <Grid item>
            <Button variant="outlined" color="primary">
              VIEW FREQUENT ITEMSETS
            </Button>
          </Grid>
          <Grid item>
            <Button variant="outlined" color="primary">
              GET RECOMMENDATIONS
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard; 