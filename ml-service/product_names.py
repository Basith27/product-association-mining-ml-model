import pandas as pd
import logging
import os
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProductNameMapper:
    def __init__(self, csv_path='data/productname.csv'):
        self.csv_path = csv_path
        self._mapping = {}
        self._load_mapping()

    def _load_mapping(self):
        """Load product ID to name mapping from CSV file."""
        try:
            # Try different possible paths
            paths_to_try = [
                self.csv_path,
                f"/app/{self.csv_path}",
                "/mnt/data/productname.csv"
            ]

            csv_path = None
            for path in paths_to_try:
                if os.path.exists(path):
                    csv_path = path
                    break

            if csv_path is None:
                logger.error(f"Product name CSV not found in any of these locations: {paths_to_try}")
                return

            df = pd.read_csv(csv_path, dtype={'product_id': str, 'product_name': str})
            
            # Ensure required columns exist
            if 'product_id' not in df.columns or 'product_name' not in df.columns:
                # Try to adapt to different column names
                if 'ProductID' in df.columns and 'ProductName' in df.columns:
                    df = df.rename(columns={'ProductID': 'product_id', 'ProductName': 'product_name'})
                else:
                    logger.error("CSV file must contain 'product_id' and 'product_name' columns")
                    return

            # Clean data
            df['product_id'] = df['product_id'].astype(str).str.strip()
            df['product_name'] = df['product_name'].astype(str).str.strip()

            # Create mapping
            self._mapping = dict(zip(df['product_id'], df['product_name']))
            logger.info(f"Loaded {len(self._mapping)} product names from {csv_path}")
            
            # Log sample for verification
            sample = dict(list(self._mapping.items())[:3])
            logger.info(f"Sample mappings: {sample}")

        except Exception as e:
            logger.error(f"Error loading product names: {str(e)}")
            self._mapping = {}

    def get_name(self, product_id):
        """Get product name for a given product ID."""
        if not product_id:
            return None
        
        product_id = str(product_id).strip()
        name = self._mapping.get(product_id)
        if not name:
            logger.warning(f"No name found for product ID: {product_id}")
            return product_id  # Return ID as fallback
        return name

    def get_names_batch(self, product_ids):
        """Get product names for a list of product IDs."""
        if not product_ids:
            return []
        return [self.get_name(pid) for pid in product_ids]

    def get_mapping(self):
        """Return a copy of the complete product ID to name mapping."""
        return self._mapping.copy()

# Create a singleton instance
product_name_mapper = ProductNameMapper() 