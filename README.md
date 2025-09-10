# Product Listing Application

A full-stack product catalog application built with React frontend and Node.js backend, featuring real-time search, filtering, sorting, and pagination.

## 🚀 Features

- **Real-time Search**: Search products by name with debounced input (300ms delay)
- **Advanced Filtering**: Filter products by price range with validation
- **Multiple Sorting Options**: Sort by name, price, or likes in ascending/descending order
- **Pagination**: Navigate through products with 25 items per page
- **Responsive Design**: Clean, modern UI that works on all devices
- **Loading States**: Smooth loading indicators and empty states
- **Error Handling**: Comprehensive error handling with retry functionality

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **SQLite** database with better-sqlite3
- **RESTful API** with comprehensive query parameters
- **CORS** enabled for cross-origin requests

### Frontend
- **React 18+** with hooks and functional components
- **CSS Modules** for component-scoped styling
- **Debounced search** and form inputs
- **Modern ES6+** JavaScript

## 📦 Project Structure

```
product_listing/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── database/       # Database schema and setup
│   │   ├── models/         # Data models and business logic
│   │   ├── routes/         # API route handlers
│   │   └── app.js          # Express application entry point
│   ├── products.db         # SQLite database (180 sample products)
│   └── package.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── services/       # API service layer
│   │   ├── App.js          # Main application component
│   │   └── index.js        # React entry point
│   ├── public/
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nicovece/product-listing.git
   cd product-listing
   ```

2. **Set up the backend**
   ```bash
   cd backend
   npm install
   npm start
   ```
   Backend will be running at `http://localhost:3001`

3. **Set up the frontend** (in a new terminal)
   ```bash
   cd frontend  
   npm install
   npm start
   ```
   Frontend will be running at `http://localhost:3000`

4. **Open your browser** and navigate to `http://localhost:3000`

## 🔧 API Endpoints

### Products API
- **GET** `/api/products` - Get products with filtering, sorting, and pagination

#### Query Parameters:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 25) 
- `search` - Search by product name
- `priceMin` - Minimum price filter
- `priceMax` - Maximum price filter
- `sortBy` - Sort field: `name`, `price`, `likes` (default: name)
- `sortOrder` - Sort order: `asc`, `desc` (default: asc)

#### Example:
```bash
curl "http://localhost:3001/api/products?search=webcam&priceMin=100&priceMax=500&sortBy=price&sortOrder=desc&page=1&limit=10"
```

### Health Check
- **GET** `/health` - Server health status

## 🎯 Features in Detail

### Search & Filtering
- **Debounced Search**: 300ms delay prevents excessive API calls
- **Price Range**: Min/max price validation with real-time filtering
- **Sort Options**: Name (A-Z, Z-A), Price (Low-High, High-Low), Likes (Most-Least)

### UI/UX
- **Loading States**: Skeleton screens and spinners
- **Empty States**: Helpful messages when no products match filters
- **Error Handling**: User-friendly error messages with retry buttons
- **Responsive Design**: Mobile-first approach with flexible grid layout

### Performance
- **Efficient Queries**: Optimized SQLite queries with proper indexing
- **Debounced Input**: Reduces API calls during user typing
- **Pagination**: Limits data transfer and improves load times

## 🗃 Database

The application uses SQLite with a pre-seeded database containing 180 sample products:
- Product names (electronics, art supplies, fitness equipment, etc.)
- Prices ranging from $10 to $999
- Like counts from 1 to 999
- Placeholder images via Picsum Photos

## 🧪 Testing

You can test the API directly:

```bash
# Get all products
curl http://localhost:3001/api/products

# Search for products
curl "http://localhost:3001/api/products?search=webcam"

# Filter by price range
curl "http://localhost:3001/api/products?priceMin=100&priceMax=300"

# Sort by price (high to low)
curl "http://localhost:3001/api/products?sortBy=price&sortOrder=desc"
```

## 🎨 Design Decisions

- **Component Architecture**: Modular React components with clear separation of concerns
- **State Management**: React hooks with centralized state in App.js
- **Styling**: CSS Modules for scoped styles, avoiding global CSS conflicts
- **API Design**: RESTful endpoints with comprehensive query parameter support
- **Database**: SQLite for simplicity and portability
- **Error Handling**: Graceful degradation with user-friendly error messages

## 📝 Development Notes

This project was built following **Spec-Driven Development** principles:
1. Created detailed specifications and requirements
2. Designed technical architecture and data models
3. Implemented backend API with comprehensive testing
4. Built React frontend with modern patterns
5. Integrated and tested the complete application

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Built with ❤️ using React and Node.js**