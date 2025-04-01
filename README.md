# Market Basket Analysis System

A full-stack application for analyzing frequently bought-together items in supermarket transaction data.

## Project Structure

- **Frontend**: React.js with Material UI
- **Backend**: Node.js (Express.js)
- **ML Microservice**: Python-based service using FP-Growth algorithm
- **Containerization**: Docker & Docker Compose

## Architecture

This project follows Hexagonal Domain-Driven Design (DDD) principles with a microservices approach:

1. Frontend communicates with Backend API
2. Backend forwards ML-related requests to the ML Microservice
3. ML Microservice performs Market Basket Analysis using FP-Growth algorithm

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js (for local development)
- Python 3.8+ (for local development)

### Running with Docker

```bash
# Clone the repository
git clone <repository-url>
cd market-basket-analysis

# Start all services
docker-compose up
```

### Accessing the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- ML Microservice API: http://localhost:8000

## Development

### Frontend (React.js)

```bash
cd frontend
npm install
npm start
```

### Backend (Node.js)

```bash
cd backend
npm install
npm start
```

### ML Microservice (Python)

```bash
cd ml-service
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## Testing

Each component has its own testing framework:

- Frontend: Jest and React Testing Library
- Backend: Jest
- ML Microservice: Pytest

To run tests:

```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test

# ML Microservice tests
cd ml-service
pytest
```

## Data

The system uses two datasets:
- Header_comb.csv: Transaction header information
- Detail_comb.csv: Transaction item details

## Features

- Dashboard displaying frequently bought-together items
- Product recommendations based on historical data
- User input to simulate purchases
- Visual representation of product associations 