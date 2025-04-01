import pandas as pd
import logging
from typing import Dict, List, Optional
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProductNameMapper:
    def __init__(self, csv_path: str = '/mnt/data/productname.csv'):
        """
        Initialize the ProductNameMapper with a CSV file containing product ID to name mapping.
        
        Args:
            csv_path (str): Path to the CSV file containing product ID and name mapping
        """
        self.csv_path = csv_path
        self.product_map: Dict[str, str] = {}
        self.missing_ids: set = set()  # Track missing IDs to avoid excessive logging
        self._load_mapping()

    def _load_mapping(self) -> None:
        """
        Load the product mapping from CSV file.
        Handles missing files and invalid data gracefully.
        """
        try:
            if not os.path.exists(self.csv_path):
                logger.error(f"Product mapping file {self.csv_path} not found.")
                return

            # Read CSV file
            df = pd.read_csv(self.csv_path)
            
            # Ensure required columns exist
            required_columns = ['ProductID', 'ProductName']
            if not all(col in df.columns for col in required_columns):
                logger.error(f"CSV file must contain columns: {required_columns}")
                return

            # Clean and validate data
            df = df.dropna(subset=['ProductID', 'ProductName'])  # Remove rows with missing values
            df['ProductID'] = df['ProductID'].astype(str).str.upper()  # Convert IDs to uppercase strings
            
            # Create mapping dictionary
            self.product_map = dict(zip(df['ProductID'], df['ProductName']))
            logger.info(f"Successfully loaded {len(self.product_map)} product mappings from CSV")
            
            # Log a few sample mappings for verification
            sample_items = list(self.product_map.items())[:3]
            logger.info(f"Sample mappings: {sample_items}")
            
        except FileNotFoundError:
            logger.error(f"Product name mapping CSV not found at: {self.csv_path}")
        except pd.errors.EmptyDataError:
            logger.error("CSV file is empty")
        except Exception as e:
            logger.error(f"Error loading product mapping: {str(e)}")
            self.product_map = {}

    def get_name(self, product_id: str) -> str:
        """
        Get the product name for a given product ID.
        Returns the original ID if not found in mapping.
        
        Args:
            product_id (str): The product ID to look up
            
        Returns:
            str: The product name if found, otherwise the original ID
        """
        try:
            product_id = str(product_id).upper()  # Convert to uppercase string for consistent lookup
            if product_id not in self.product_map and product_id not in self.missing_ids:
                self.missing_ids.add(product_id)  # Track this missing ID
                logger.warning(f"Product ID not found in mapping: {product_id}")
            return self.product_map.get(product_id, product_id)  # Return original ID if not found
        except Exception as e:
            logger.error(f"Error getting product name for ID {product_id}: {str(e)}")
            return product_id  # Return original ID on error

    def get_names_batch(self, product_ids: List[str]) -> List[str]:
        """
        Get product names for multiple product IDs efficiently.
        
        Args:
            product_ids (List[str]): List of product IDs to look up
            
        Returns:
            List[str]: List of product names (or original IDs if not found)
        """
        try:
            if not isinstance(product_ids, list):
                logger.error(f"Invalid input type for get_names_batch: {type(product_ids)}")
                return product_ids
            return [self.get_name(pid) for pid in product_ids]
        except Exception as e:
            logger.error(f"Error in batch name lookup: {str(e)}")
            return product_ids  # Return original IDs on error

    def get_mapping(self) -> Dict[str, str]:
        """
        Get the complete product ID to name mapping.
        
        Returns:
            Dict[str, str]: Dictionary mapping product IDs to names
        """
        return self.product_map.copy()

# Create a singleton instance
product_mapper = ProductNameMapper() 