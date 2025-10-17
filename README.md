# Getir Commerce Intelligence Platform

A comprehensive competitive pricing intelligence and product matching platform built for Getir's online grocery operations. This application enables pricing teams to track competitor prices, manage segments, set pricing indices, and ensure pricing stays within defined boundaries.

## 🏗️ Project Overview

This platform serves as the central hub for:
- **Competitive Price Intelligence**: Track and analyze competitor pricing across different sales channels
- **Dynamic Pricing Management**: Set pricing indices based on KVI (Key Value Items) and segments
- **Segment Management**: Create and manage location-based segments for targeted pricing
- **Boundary Rules**: Define pricing constraints and margin rules to ensure pricing compliance
- **Data Export**: Export pricing data and analysis results for further processing

## 🚀 Features

### 📊 Index Matrix Management
- Interactive matrix for setting price indices across different segments
- Support for multiple KVI types (SKVI, KVI, Background, Foreground)
- Multi-channel support (Getir, GetirBüyük)
- Competitor-specific indexing (Migros, Carrefour, ŞOK)

### 🎯 Segmentation System
- Create and manage location-based segments
- Domain classification (Getir10, Getir30)
- Province, district, and region-based grouping
- Real-time warehouse count tracking

### 📋 Product Matching & Analysis
- Comprehensive product list with competitor price tracking
- Match type classification (Matched, Indirect, None)
- KVI labeling and pricing recommendations
- Advanced filtering and search capabilities

### ⚖️ Boundary Rules Engine
- Price floor and ceiling enforcement
- Margin-based constraints
- Category and competitor-specific rules
- Real-time rule status management

### 📤 Export Capabilities
- CSV and Excel export formats
- Customizable column selection
- Automated filename generation
- Batch export functionality

## 🛠️ Technical Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Framework**: Ant Design (antd)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Processing**: Mock API with simulated delays
- **Export**: XLSX library for Excel, custom CSV generation
- **Icons**: Ant Design Icons

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Home page (Product Matching)
│   ├── pricing/
│   │   ├── index/         # Index matrix page
│   │   └── segmentation/  # Segmentation management
│   └── boundary-rules/    # Boundary rules management
├── components/
│   ├── layout/           # Layout components
│   ├── pages/            # Page components
│   └── common/           # Shared components
├── store/                # Zustand store
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd commerce-intelligence
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run init:db      # Initialize database with default configurations
```

### Database Setup

This application requires MongoDB. Make sure you have a MongoDB instance running and set the `MONGODB_URI` environment variable.

**Environment Variable**:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name
```

**Initialize Database**:
After deploying to a new environment (like Heroku), initialize the database with default configurations:

```bash
# Set the APP_URL to your deployed application URL
export APP_URL=https://your-app.herokuapp.com
npm run init:db
```

Or you can manually trigger initialization by making a POST request:
```bash
curl -X POST https://your-app.herokuapp.com/api/init
```

This will create:
- Default waste price configuration with aggression tiers
- Required database indexes and constraints

**Check Initialization Status**:
```bash
curl https://your-app.herokuapp.com/api/init
```

## 🎮 Usage Guide

### Navigation
The application features a sidebar navigation with the following sections:
- **Product Matching**: Main dashboard with product list and competitor analysis
- **Smart Pricing**: 
  - **Segmentation**: Manage location-based segments
  - **Index**: Set pricing indices in matrix format
- **Boundary Rules**: Define pricing constraints and rules

### Setting Price Indices
1. Navigate to **Smart Pricing > Index**
2. Select the desired sales channel (Getir/GetirBüyük)
3. Choose competitor tab (Migros/Carrefour/ŞOK)
4. Edit index values in the matrix for each KVI type and segment
5. Changes are automatically saved

### Managing Segments
1. Go to **Smart Pricing > Segmentation**
2. Use filters to search existing segments
3. Click **Add Segment** to create new segments
4. Fill in segment details (name, domain, location info)
5. View and manage warehouse counts per segment

### Creating Boundary Rules
1. Navigate to **Boundary Rules**
2. Click **Add Rule** to create new constraints
3. Set price floors/ceilings and margin limits
4. Apply rules to specific categories or competitors
5. Toggle rule status as needed

### Exporting Data
- Click **Export** button on any data table
- Choose between CSV or Excel format
- File downloads automatically with timestamp

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file for environment-specific settings:

```env
# Required
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name

# Optional
NEXT_PUBLIC_API_URL=your_api_endpoint
NEXT_PUBLIC_APP_NAME=Getir Commerce Intelligence
APP_URL=https://your-app.herokuapp.com  # For database initialization script
```

**Heroku Configuration**:
```bash
heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/database-name"
heroku config:set APP_URL="https://your-app.herokuapp.com"
```

### Mock Data
The application uses mock data for demonstration. Real API integration points are defined in:
- `src/utils/mockApi.ts` - Mock API responses
- `src/store/useAppStore.ts` - State management
- `src/types/index.ts` - Type definitions

## 🎨 Design System

The application follows Getir's visual identity:
- **Primary Color**: Purple (#7C3AED)
- **Secondary Color**: Yellow (#FBBF24) 
- **Typography**: Geist Sans font family
- **Components**: Ant Design with custom theming
- **Responsive**: Mobile-first design approach

## 🔄 Data Flow

1. **Data Collection**: External data from competitor websites (handled by Data Engineering team)
2. **API Integration**: Mock API simulates real data endpoints
3. **State Management**: Zustand store manages application state
4. **UI Rendering**: React components display data with Ant Design
5. **Export Processing**: Utility functions handle data export

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Testing

Run tests with:
```bash
npm run test        # Run unit tests
npm run test:e2e    # Run end-to-end tests
npm run test:watch  # Run tests in watch mode
```

## 📈 Performance

- **Bundle Size**: Optimized with Next.js automatic code splitting
- **Lazy Loading**: Pages and components load on demand
- **Caching**: API responses cached for improved performance
- **Export Performance**: Streaming for large dataset exports

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software owned by Getir. Unauthorized copying, modification, or distribution is strictly prohibited.

## 🆘 Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Refer to the internal documentation wiki

---

**Built with ❤️ for Getir's Pricing Intelligence Team**
