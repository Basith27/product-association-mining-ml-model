import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  CircularProgress,
  Alert,
  AlertTitle,
  Divider,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Slider,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  BuildCircle,
  ExpandMore,
  Refresh,
  Info,
  PlayArrow,
  LineStyle,
  BarChart,
  FolderOpen,
  Upload,
} from '@mui/icons-material';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

// TabPanel component for the tabbed interface
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ModelImplementation = () => {
  // State for model training parameters
  const [minSupport, setMinSupport] = useState(0.01);
  const [minConfidence, setMinConfidence] = useState(0.5);
  const [useSampleData, setUseSampleData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [modelStatus, setModelStatus] = useState(null);
  const [frequentItemsets, setFrequentItemsets] = useState([]);
  const [associationRules, setAssociationRules] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [resultsLimit, setResultsLimit] = useState(10);
  const [minLift, setMinLift] = useState(1.0);
  const [modelResult, setModelResult] = useState(null);
  const [maxItemsetLength, setMaxItemsetLength] = useState(4);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();

  // Fetch model status on component mount
  useEffect(() => {
    fetchModelStatus();
  }, []);

  // Function to fetch model status
  const fetchModelStatus = async () => {
    try {
      // Call the API to get model status
      const response = await api.getStatus();
      
      // Use the response data
      setModelStatus(response);
    } catch (err) {
      console.error('Error fetching model status:', err);
      setError('Failed to fetch model status. Please try again.');
    }
  };

  // Function to train the model
  const handleTrainModel = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Call the API to train the model
      const response = await api.trainModel({
        min_support: minSupport,
        min_threshold: minConfidence,
        use_sample_data: useSampleData
      });
      
      setModelResult(response);
      setSuccess(true);
      
      // Update model status
      fetchModelStatus();
      
      // After training, fetch the frequent itemsets and rules
      fetchFrequentItemsets();
      fetchAssociationRules();

      // Show a message that user can now return to dashboard
      setSuccessMessage("Model trained successfully! You can now return to the Dashboard to see real data.");
    } catch (err) {
      console.error('Error training model:', err);

      setError(err.message || 'Failed to train model. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch frequent itemsets
  const fetchFrequentItemsets = async () => {
    try {
      // Call the API to get frequent itemsets
      const response = await api.getFrequentItemsets({
        limit: resultsLimit,
        min_support: minSupport
      });
      
      // Check if the response contains frequent itemsets
      if (response && response.frequent_itemsets) {
        setFrequentItemsets(response.frequent_itemsets);
      } else {
        setFrequentItemsets([]);
      }
    } catch (err) {
      console.error('Error fetching frequent itemsets:', err);
      setError('Failed to fetch frequent itemsets. Please try again.');
    }
  };

  // Function to fetch association rules
  const fetchAssociationRules = async () => {
    try {
      // Call the API to get association rules
      const response = await api.getAssociationRules({
        limit: resultsLimit,
        min_confidence: minConfidence,
        min_lift: minLift
      });
      
      // Check if the response contains rules
      if (response && response.rules) {
        setAssociationRules(response.rules);
      } else {
        setAssociationRules([]);
      }
    } catch (err) {
      console.error('Error fetching association rules:', err);
      setError('Failed to fetch association rules. Please try again.');
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Fetch data based on the selected tab
    if (newValue === 1) {
      fetchFrequentItemsets();
    } else if (newValue === 2) {
      fetchAssociationRules();
    }
  };

  // Function to refresh results
  const handleRefreshResults = () => {
    if (tabValue === 1) {
      fetchFrequentItemsets();
    } else if (tabValue === 2) {
      fetchAssociationRules();
    }
  };

  return (
    <Box sx={{ flexGrow: 1, py: 2 }}>
      <Typography variant="h4" gutterBottom>
        Model Implementation
      </Typography>
      
      <Typography variant="body1" color="text.secondary" paragraph>
        Train and manage the market basket analysis model to generate product recommendations.
      </Typography>

      {/* Tabs for different functionality */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<BuildCircle />} label="Train Model" />
          <Tab icon={<LineStyle />} label="Frequent Itemsets" />
          <Tab icon={<BarChart />} label="Association Rules" />
        </Tabs>

        {/* Train Model Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Training Parameters
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ mb: 3 }}>
                  <Typography gutterBottom>
                    Minimum Support: {minSupport}
                  </Typography>
                  <Slider
                    value={minSupport}
                    onChange={(e, value) => setMinSupport(value)}
                    step={0.01}
                    min={0.01}
                    max={0.5}
                    valueLabelDisplay="auto"
                    disabled={loading}
                  />
                  <Typography variant="body2" color="text.secondary">
                    The minimum support threshold for an itemset to be considered frequent.
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography gutterBottom>
                    Minimum Confidence: {minConfidence}
                  </Typography>
                  <Slider
                    value={minConfidence}
                    onChange={(e, value) => setMinConfidence(value)}
                    step={0.05}
                    min={0.1}
                    max={1}
                    valueLabelDisplay="auto"
                    disabled={loading}
                  />
                  <Typography variant="body2" color="text.secondary">
                    The minimum confidence threshold for generating association rules.
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Dataset Processing
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={useSampleData}
                        onChange={(e) => setUseSampleData(e.target.checked)}
                        disabled={loading}
                      />
                    }
                    label="Standard Processing"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {useSampleData 
                      ? "Using standard processing for smaller datasets (faster but may not handle large datasets well)."
                      : "Using chunked processing for large datasets (more memory efficient but slower)."}
                  </Typography>
                </Box>
                
                {!useSampleData && (
                  <Box sx={{ mb: 3 }}>
                    <Typography gutterBottom>
                      Maximum Itemset Length
                    </Typography>
                    <TextField
                      type="number"
                      label="Max Length"
                      value={maxItemsetLength || 4}
                      onChange={(e) => setMaxItemsetLength(Math.max(2, parseInt(e.target.value) || 4))}
                      inputProps={{ min: 2, max: 10 }}
                      disabled={loading}
                      size="small"
                      sx={{ width: 150, mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Limits the maximum number of items in an itemset. Lower values improve performance for large datasets.
                    </Typography>
                  </Box>
                )}
                
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                  onClick={handleTrainModel}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? 'Training Model...' : 'Train Model'}
                </Button>
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
                  {successMessage}
                </Alert>
              )}

              {success && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/dashboard')}
                  >
                    Return to Dashboard
                  </Button>
                </Box>
              )}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Model Status
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {modelStatus ? (
                    <List>
                      <ListItem divider>
                        <ListItemText 
                          primary="Model Trained" 
                          secondary={modelStatus.model_trained ? "Yes" : "No"} 
                        />
                      </ListItem>
                      <ListItem divider>
                        <ListItemText 
                          primary="Transactions Count" 
                          secondary={modelStatus.transactions_count} 
                        />
                      </ListItem>
                      <ListItem divider>
                        <ListItemText 
                          primary="Rules Count" 
                          secondary={modelStatus.rules_count} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Last Training Time" 
                          secondary={modelStatus.last_training_time ? new Date(modelStatus.last_training_time).toLocaleString() : "Never"} 
                        />
                      </ListItem>
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CircularProgress size={40} />
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        Loading model status...
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
              
              {modelResult && (
                <Card sx={{ mt: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Training Results
                    </Typography>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <List>
                      <ListItem divider>
                        <ListItemText 
                          primary="Status" 
                          secondary={modelResult.status} 
                        />
                      </ListItem>
                      <ListItem divider>
                        <ListItemText 
                          primary="Transactions Processed" 
                          secondary={modelResult.transactions_count} 
                        />
                      </ListItem>
                      <ListItem divider>
                        <ListItemText 
                          primary="Frequent Itemsets Found" 
                          secondary={modelResult.frequent_itemsets_count} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Association Rules Generated" 
                          secondary={modelResult.rules_count} 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Frequent Itemsets Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Frequent Itemsets
            </Typography>
            <Box>
              <TextField
                label="Limit"
                type="number"
                size="small"
                value={resultsLimit}
                onChange={(e) => setResultsLimit(Math.max(1, parseInt(e.target.value) || 1))}
                InputProps={{ inputProps: { min: 1 } }}
                sx={{ width: 100, mr: 2 }}
              />
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRefreshResults}
              >
                Refresh
              </Button>
            </Box>
          </Box>
          
          {frequentItemsets.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No frequent itemsets found. Try training the model first or adjusting the minimum support.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {frequentItemsets.map((itemset, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" component="div">
                          Itemset {index + 1}
                        </Typography>
                        <Chip 
                          label={`Support: ${(itemset.support * 100).toFixed(1)}%`} 
                          color="primary" 
                          variant="outlined" 
                        />
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      <Box>
                        {itemset.itemset.map((item, idx) => (
                          <Chip 
                            key={idx} 
                            label={`${item.slice(0, 8)}...`} 
                            size="small" 
                            sx={{ m: 0.5 }} 
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Association Rules Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Association Rules
            </Typography>
            <Box>
              <TextField
                label="Limit"
                type="number"
                size="small"
                value={resultsLimit}
                onChange={(e) => setResultsLimit(Math.max(1, parseInt(e.target.value) || 1))}
                InputProps={{ inputProps: { min: 1 } }}
                sx={{ width: 80, mr: 1 }}
              />
              <TextField
                label="Min Lift"
                type="number"
                size="small"
                value={minLift}
                onChange={(e) => setMinLift(Math.max(1, parseFloat(e.target.value) || 1))}
                InputProps={{ inputProps: { min: 1, step: 0.1 } }}
                sx={{ width: 100, mr: 1 }}
              />
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={handleRefreshResults}
                sx={{ ml: 1 }}
              >
                Refresh
              </Button>
            </Box>
          </Box>
          
          {associationRules.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No association rules found. Try training the model first or adjusting the parameters.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {associationRules.map((rule, index) => (
                <Grid item xs={12} key={index}>
                  <Accordion defaultExpanded={index === 0}>
                    <AccordionSummary
                      expandIcon={<ExpandMore />}
                      aria-controls={`rule-content-${index}`}
                      id={`rule-header-${index}`}
                    >
                      <Typography sx={{ width: '33%', flexShrink: 0 }}>
                        Rule {index + 1}
                      </Typography>
                      <Typography sx={{ color: 'text.secondary' }}>
                        Confidence: {(rule.confidence * 100).toFixed(1)}% | Lift: {rule.lift.toFixed(2)}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={5}>
                          <Typography variant="subtitle2" gutterBottom>
                            If Customer Buys:
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            {rule.antecedents.map((item, idx) => (
                              <Chip 
                                key={idx} 
                                label={`${item.slice(0, 8)}...`} 
                                size="small" 
                                color="primary"
                                variant="outlined"
                                sx={{ m: 0.5 }} 
                              />
                            ))}
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Typography variant="h6">→</Typography>
                        </Grid>
                        <Grid item xs={12} md={5}>
                          <Typography variant="subtitle2" gutterBottom>
                            They Will Likely Buy:
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            {rule.consequents.map((item, idx) => (
                              <Chip 
                                key={idx} 
                                label={`${item.slice(0, 8)}...`} 
                                size="small" 
                                color="secondary"
                                sx={{ m: 0.5 }} 
                              />
                            ))}
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Divider sx={{ my: 1 }} />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Chip 
                              icon={<Info />}
                              label={`Support: ${(rule.support * 100).toFixed(1)}%`} 
                              size="small" 
                              sx={{ mr: 1 }} 
                            />
                            <Chip 
                              icon={<Info />}
                              label={`Confidence: ${(rule.confidence * 100).toFixed(1)}%`} 
                              size="small" 
                              sx={{ mr: 1 }} 
                            />
                            <Chip 
                              icon={<Info />}
                              label={`Lift: ${rule.lift.toFixed(2)}`} 
                              size="small" 
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default ModelImplementation; 