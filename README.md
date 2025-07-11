# MAPIM Strategic Centre - Disaster Monitoring Platform

A real-time disaster monitoring and alert system for Malaysia, developed by MAPIM Strategic Centre (MAGIC) Digital Initiatives.

## Overview

This platform provides comprehensive disaster monitoring capabilities including:
- Real-time weather alerts and warnings
- Water level monitoring
- Rainfall intensity tracking
- Emergency response coordination
- Interactive map visualization of disaster data

## Features

### 🚨 Real-time Monitoring
- Live disaster alerts from official Malaysian government sources
- Weather condition monitoring and warnings
- Water level tracking for flood prevention
- Rainfall intensity analysis

### 🗺️ Interactive Map Interface
- Interactive map of Malaysia with real-time data visualization
- Alert markers with severity indicators
- PPS (Pusat Pemindahan Sementara) location tracking
- Fullscreen mode for emergency operations
- Data refresh capabilities

### 📊 Data Visualization
- Real-time charts for water levels and rainfall
- Alert severity classification
- Historical data tracking
- Responsive design for all devices

### 🔒 Security & Privacy
- Secure data handling
- Privacy policy compliance
- User data protection
- Official disclaimer and terms

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: TailwindCSS 4
- **Maps**: MapLibre GL JS
- **Animations**: Lottie Files
- **Icons**: React Icons
- **Charts**: Recharts

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

#### Option 1: Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd thenewsiagaxbencana
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

#### Option 2: Docker Development

1. Clone the repository:
```bash
git clone <repository-url>
cd thenewsiagaxbencana
```

2. Start development environment with Docker:
```bash
docker-compose --profile dev up --build
```

3. Open [http://localhost:3001](http://localhost:3001) in your browser

For detailed Docker instructions, see [DOCKER.md](./DOCKER.md).

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── bencana/           # Disaster monitoring page
│   ├── privacy/           # Privacy policy
│   ├── disclaimer/        # Legal disclaimer
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── MalaysiaMap.tsx    # Main map component
│   ├── AlertMarkers.tsx   # Alert visualization
│   ├── PPSMarkers.tsx     # PPS location markers
│   └── LottieBackground.tsx # Animation backgrounds
├── contexts/              # React contexts
├── hooks/                 # Custom hooks
└── utils/                 # Utility functions
```

## Key Components

### MalaysiaMap
The main interactive map component that displays:
- Real-time disaster alerts
- PPS locations
- Water level data
- Rainfall information

### AlertMarkers
Visualizes disaster alerts on the map with:
- Color-coded severity indicators
- Interactive popups with detailed information
- Real-time updates

### PPSMarkers
Shows emergency shelter locations with:
- Geographic positioning
- Status information
- Contact details

## Data Sources

The platform aggregates data from:
- Malaysian Meteorological Department
- Department of Irrigation and Drainage
- Emergency response organizations
- Public safety authorities

## Deployment

### Production Build

#### Local Production
```bash
npm run build
npm start
```

#### Docker Production
```bash
# Build and start production environment
docker-compose --profile prod up --build

# Run in detached mode
docker-compose --profile prod up -d --build
```

### Environment Variables
Create a `.env.local` file for any required environment variables.

For production deployment with Docker, see [DOCKER.md](./DOCKER.md) for detailed instructions.

## Contributing

This project is developed by MAPIM Strategic Centre. For contributions or inquiries, please contact:
- Email: s***m@m***m.org
- Phone: +60 13-3158684

## Legal

- [Privacy Policy](/privacy)
- [Disclaimer](/disclaimer)

## License

© 2024 MAPIM Strategic Centre. All rights reserved.

---

**MAPIM Strategic Centre (MAGIC)** - Advancing Malaysia's Digital Humanitarian Future
