from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import pandas as pd
import os
import json
from mlxtend.frequent_patterns import apriori, association_rules, fpgrowth
from mlxtend.preprocessing import TransactionEncoder
import numpy as np
import time
from datetime import datetime
import gc
import traceback
import sys
from product_names import product_name_mapper
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Market Basket Analysis API",
    description="ML Microservice for Market Basket Analysis using Apriori Algorithm"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
model_data = None
transactions_df = None
frequent_itemsets = None
rules = None

class TransactionItem(BaseModel):
    item_id: str
    item_name: Optional[str] = None
    quantity: Optional[float] = 1.0

class Transaction(BaseModel):
    transaction_id: str
    items: List[TransactionItem]
    timestamp: Optional[str] = None

class RecommendationRequest(BaseModel):
    items: List[str]
    min_support: Optional[float] = 0.01
    min_threshold: Optional[float] = 0.5

class TrainingRequest(BaseModel):
    min_support: Optional[float] = 0.01
    min_threshold: Optional[float] = 0.5
    use_sample_data: Optional[bool] = True
    max_length: Optional[int] = None

# Helper functions
def process_transaction_data(header_file: str, detail_file: str, sample_size: Optional[int] = None) -> pd.DataFrame:
    """Process transaction data from header and detail files"""
    try:
        # Read data files with optional sampling
        header_df = pd.read_csv(header_file, nrows=sample_size)
        detail_df = pd.read_csv(detail_file, nrows=sample_size)
        
        # Merge datasets on voucher_id
        merged_df = pd.merge(detail_df, header_df, on='voucher_id', how='inner')
        
        # Ensure item_no is a string
        merged_df['item_no'] = merged_df['item_no'].astype(str)
        
        # Group by voucher_id and collect item_no into lists
        transactions = merged_df.groupby('voucher_id')['item_no'].apply(list).reset_index()
        
        return transactions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing data: {str(e)}")

def process_large_transaction_data(header_file, detail_file, chunk_size=100000):
    """Process large transaction data files in chunks to avoid memory issues"""
    try:
        # Process header file - typically smaller, can load at once
        print(f"Loading header file: {header_file}")
        header_df = pd.read_csv(header_file)
        print(f"Header data loaded, shape: {header_df.shape}")
        
        # Create empty list to hold transactions
        transactions_list = []
        
        # Process detail file in chunks to reduce memory usage
        print(f"Processing detail file in chunks of {chunk_size}")
        
        # Get total number of rows to track progress
        total_rows = sum(1 for _ in open(detail_file, 'r')) - 1  # Subtract header row
        print(f"Total rows in detail file: {total_rows}")
        
        # Process in chunks
        chunks_processed = 0
        for detail_chunk in pd.read_csv(detail_file, chunksize=chunk_size):
            # Merge with header data
            merged_chunk = pd.merge(detail_chunk, header_df, on='voucher_id', how='inner')
            
            # Ensure item_no is a string
            if merged_chunk['item_no'].dtype != 'object':
                merged_chunk['item_no'] = merged_chunk['item_no'].astype(str)
            
            # Group by voucher_id and collect item_no
            chunk_transactions = merged_chunk.groupby('voucher_id')['item_no'].apply(list).reset_index()
            
            # Add to transactions list
            transactions_list.append(chunk_transactions)
            
            # Clean up to free memory
            del merged_chunk
            del chunk_transactions
            del detail_chunk
            gc.collect()
            
            # Update progress
            chunks_processed += 1
            print(f"Processed chunk {chunks_processed}, total transactions so far: {sum(len(t) for t in transactions_list)}")
        
        # Combine all chunks
        print("Combining all transaction chunks...")
        transactions = pd.concat(transactions_list, ignore_index=True)
        
        # Clean up memory again
        del transactions_list
        del header_df
        gc.collect()
        
        print(f"Final transaction count: {len(transactions)}")
        return transactions
    except Exception as e:
        print(f"Error processing large transaction data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing large transaction data: {str(e)}")

def train_model(transactions: pd.DataFrame, min_support: float = 0.01, max_length: int = 3):
    """Train market basket analysis model using Apriori algorithm"""
    try:
        # Prepare transaction data
        te = TransactionEncoder()
        te_ary = te.fit(transactions['item_no']).transform(transactions['item_no'])
        df = pd.DataFrame(te_ary, columns=te.columns_)
        del te_ary
        gc.collect()
        
        # Generate frequent itemsets
        frequent_itemsets = apriori(
            df, 
            min_support=min_support, 
            use_colnames=True,
            max_len=max_length
        )
        
        return frequent_itemsets, te.columns_
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error training model: {str(e)}")

def generate_association_rules(frequent_itemsets, min_threshold=0.5):
    """Generate association rules from frequent itemsets"""
    try:
        rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=min_threshold)
        return rules.sort_values(['confidence', 'lift'], ascending=[False, False])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating rules: {str(e)}")

def get_recommendations(items, rules, top_n=5):
    """Get recommendations based on items and rules"""
    try:
        # Filter rules where antecedents contain at least one of the input items
        matching_rules = []
        
        for _, rule in rules.iterrows():
            antecedents = list(rule['antecedents'])
            if any(item in antecedents for item in items):
                consequents = list(rule['consequents'])
                # Only recommend items that are not in the input list
                new_items = [item for item in consequents if item not in items]
                if new_items:
                    matching_rules.append({
                        'recommended_items': new_items,
                        'confidence': rule['confidence'],
                        'lift': rule['lift'],
                        'support': rule['support']
                    })
        
        # Sort by confidence and return top recommendations
        matching_rules = sorted(matching_rules, key=lambda x: (x['confidence'], x['lift']), reverse=True)
        
        # Flatten the recommendations
        recommended_items = []
        for rule in matching_rules[:top_n]:
            for item in rule['recommended_items']:
                if item not in recommended_items and item not in items:
                    recommended_items.append({
                        'item_id': item,
                        'name': product_name_mapper.get_name(item),
                        'confidence': float(rule['confidence']),
                        'lift': float(rule['lift']),
                        'support': float(rule['support'])
                    })
        
        return recommended_items[:top_n]
    except Exception as e:
        print(f"Error getting recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting recommendations: {str(e)}")

# API Endpoints
@app.get("/")
def read_root():
    return {"message": "Market Basket Analysis ML Service", "status": "active"}

@app.get("/status")
def get_status():
    global model_data, transactions_df, rules, frequent_itemsets
    
    # Calculate additional statistics if transaction data is available
    unique_items_count = 0
    avg_basket_size = 0
    avg_basket_value = 0
    
    if transactions_df is not None:
        # Get unique items
        all_items = []
        for _, row in transactions_df.iterrows():
            all_items.extend(row['item_no'])
        unique_items_count = len(set(all_items))
        
        # Calculate average basket size
        basket_sizes = transactions_df['item_no'].apply(len)
        avg_basket_size = float(basket_sizes.mean()) if len(basket_sizes) > 0 else 0
        
        # Average basket value is estimated (not actual price data in this demo)
        avg_basket_value = 15.0 * avg_basket_size  # Assuming average price per item
    
    return {
        "model_trained": model_data is not None,
        "transactions_count": len(transactions_df) if transactions_df is not None else 0,
        "rules_count": len(rules) if rules is not None else 0,
        "frequent_itemsets_count": len(frequent_itemsets) if frequent_itemsets is not None else 0,
        "unique_items_count": unique_items_count,
        "avg_basket_size": avg_basket_size,
        "avg_basket_value": avg_basket_value
    }

@app.post("/train")
def train_model_endpoint(request: TrainingRequest = Body(...)):
    """Train the market basket analysis model"""
    global model_data, transactions_df, rules, frequent_itemsets
    
    try:
        # Dataset files
        header_file = "data/Header_comb.csv"
        detail_file = "data/Detail_comb.csv"
        
        if not os.path.exists(header_file) or not os.path.exists(detail_file):
            raise HTTPException(status_code=404, detail="Data files not found")
        
        # Process transaction data
        sample_size = 500000 if request.use_sample_data else None
        transactions_df = process_transaction_data(header_file, detail_file, sample_size)
        
        # Train model
        frequent_itemsets, columns = train_model(
            transactions_df, 
            min_support=request.min_support,
            max_length=request.max_length or 3
        )
        
        # Store model data
        model_data = {
            "frequent_itemsets": frequent_itemsets,
            "columns": columns,
            "transaction_count": len(transactions_df)
        }
        
        # Generate association rules
        rules = generate_association_rules(frequent_itemsets, min_threshold=request.min_threshold)
        
        print(f"Model trained successfully with {len(frequent_itemsets)} itemsets and {len(rules)} rules")
        
        return {
            "status": "success",
            "message": "Model trained successfully",
            "transactions_count": len(transactions_df),
            "rules_count": len(rules)
        }
    
    except Exception as e:
        print(f"Error in train_model: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/frequent-itemsets")
def get_frequent_itemsets(limit: Optional[int] = None, min_support: Optional[float] = None) -> Dict[str, Any]:
    """Get frequent itemsets with product names."""
    global model_data
    
    if model_data is None:
        raise HTTPException(status_code=400, detail="Model not trained. Please train the model first.")
    
    try:
        # Get frequent itemsets from model_data
        frequent_itemsets = model_data["frequent_itemsets"]
        
        # Filter by support if needed
        if min_support is not None:
            frequent_itemsets = frequent_itemsets[frequent_itemsets['support'] >= min_support]
        
        # Format itemsets with product names
        formatted_itemsets = []
        for _, row in frequent_itemsets.sort_values('support', ascending=False).head(limit or len(frequent_itemsets)).iterrows():
            try:
                itemset_products = list(row['itemsets'])
                formatted_itemset = {
                    'itemset': itemset_products,  # Keep original IDs
                    'product_names': product_name_mapper.get_names_batch(itemset_products),  # Add names
                    'support': float(row['support'])
                }
                
                # For single-item sets, add name for top products display
                if len(itemset_products) == 1:
                    formatted_itemset['name'] = product_name_mapper.get_name(itemset_products[0])
                
                formatted_itemsets.append(formatted_itemset)
            except Exception as item_error:
                logger.error(f"Error formatting itemset: {str(item_error)}")
                continue  # Skip problematic itemset
        
        return {
            "status": "success",
            "frequent_itemsets": formatted_itemsets
        }
    except Exception as e:
        logger.error(f"Error getting frequent itemsets: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Error processing frequent itemsets",
                "message": str(e)
            }
        )

@app.get("/rules")
def get_rules(limit: Optional[int] = None, min_confidence: Optional[float] = None, min_lift: Optional[float] = None) -> Dict[str, Any]:
    """Get association rules with product names."""
    global model_data, rules
    
    if model_data is None or rules is None:
        raise HTTPException(status_code=400, detail="Model not trained. Please train the model first.")
    
    try:
        # Filter rules based on confidence and lift
        filtered_rules = rules[
            (rules['confidence'] >= min_confidence if min_confidence is not None else True) &
            (rules['lift'] >= min_lift if min_lift is not None else True)
        ]
        
        # Format rules with product names
        formatted_rules = []
        for _, rule in filtered_rules.iterrows():
            try:
                antecedents = list(rule['antecedents'])
                consequents = list(rule['consequents'])
                
                formatted_rule = {
                    'antecedents': product_name_mapper.get_names_batch(antecedents),  # Use names directly
                    'consequents': product_name_mapper.get_names_batch(consequents),  # Use names directly
                    'support': float(rule['support']),
                    'confidence': float(rule['confidence']),
                    'lift': float(rule['lift'])
                }
                
                formatted_rules.append(formatted_rule)
            except Exception as rule_error:
                logger.error(f"Error formatting rule: {str(rule_error)}")
                continue  # Skip problematic rule
        
        if limit:
            formatted_rules = formatted_rules[:limit]
        
        return {
            "status": "success",
            "rules": formatted_rules
        }
    except Exception as e:
        logger.error(f"Error getting rules: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Error processing association rules",
                "message": str(e)
            }
        )

@app.post("/recommend")
def get_item_recommendations(request: RecommendationRequest):
    """Get product recommendations with names."""
    global model_data, rules
    
    if model_data is None or rules is None:
        raise HTTPException(status_code=400, detail="Model not trained. Please train the model first.")
    
    try:
        # Get recommendations
        recommendations = []
        try:
            raw_recommendations = get_recommendations(request.items, rules)
            
            # Add product names to recommendations
            for rec in raw_recommendations:
                try:
                    recommendations.append({
                        'id': rec['item_id'],
                        'name': product_name_mapper.get_name(rec['item_id']),
                        'confidence': float(rec['confidence']),
                        'lift': float(rec['lift']),
                        'support': float(rec['support'])
                    })
                except Exception as item_error:
                    logger.error(f"Error formatting recommendation: {str(item_error)}")
                    continue
        except Exception as rec_error:
            logger.error(f"Error getting recommendations: {str(rec_error)}")
            recommendations = []  # Return empty list if recommendation generation fails
        
        return {
            "status": "success",
            "input_items": request.items,
            "input_names": product_name_mapper.get_names_batch(request.items),
            "recommendations": recommendations
        }
    except Exception as e:
        logger.error(f"Error in recommendation endpoint: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Error processing recommendations",
                "message": str(e)
            }
        )

@app.post("/simulate")
def simulate_transaction(transaction: Transaction):
    global model_data, rules
    
    # Check if model is trained
    if model_data is None or rules is None:
        raise HTTPException(status_code=400, detail="Model not trained. Please train the model first.")
    
    # Extract item IDs
    item_ids = [item.item_id for item in transaction.items]
    
    # Get recommendations
    recommendations = get_recommendations(item_ids, rules)
    
    return {
        "status": "success",
        "transaction_id": transaction.transaction_id,
        "input_items": item_ids,
        "recommendations": recommendations
    }

@app.get("/dashboard")
async def get_dashboard_data():
    """Get dashboard data including metrics and top products/combinations."""
    try:
        if transactions_df is None or frequent_itemsets is None or rules is None:
            return {
                "status": "success",
                "data": {
                    "metrics": {
                        "total_transactions": 0,
                        "unique_products": 0,
                        "avg_basket_size": 0,
                        "avg_basket_value": 0
                    },
                    "top_products": [],
                    "top_combinations": []
                }
            }

        # Calculate basic metrics
        metrics = {
            "total_transactions": len(transactions_df),
            "unique_products": len(pd.unique(transactions_df['item_no'].explode())),
            "avg_basket_size": transactions_df['item_no'].apply(len).mean(),
            "avg_basket_value": transactions_df['quantity'].sum() if 'quantity' in transactions_df else 0
        }

        # Get top products
        top_products = []
        single_items = frequent_itemsets[frequent_itemsets['itemsets'].apply(len) == 1]
        if not single_items.empty:
            for _, row in single_items.nlargest(5, 'support').iterrows():
                item_id = list(row['itemsets'])[0]
                product_name = product_name_mapper.get_name(item_id)
                transactions = int(row['support'] * len(transactions_df))
                top_products.append({
                    "id": item_id,
                    "name": product_name,
                    "transactions": transactions
                })

        # Get top combinations
        top_combinations = []
        if not rules.empty:
            for _, rule in rules.nlargest(5, 'lift').iterrows():
                antecedents = [product_name_mapper.get_name(pid) for pid in rule['antecedents']]
                consequents = [product_name_mapper.get_name(pid) for pid in rule['consequents']]
                
                top_combinations.append({
                    "antecedents": antecedents,
                    "consequents": consequents,
                    "support": rule['support'],
                    "confidence": rule['confidence'],
                    "lift": rule['lift']
                })

        return {
            "status": "success",
            "data": {
                "metrics": metrics,
                "top_products": top_products,
                "top_combinations": top_combinations
            }
        }

    except Exception as e:
        logger.error(f"Error getting dashboard data: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"message": "Failed to get dashboard data", "error": str(e)}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 