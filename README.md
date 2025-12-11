# Xandeum pNodes Analytics Dashboard

A stunning real-time analytics dashboard for monitoring Xandeum storage provider nodes (pNodes). Built for the Xandeum Bounty Program.

## Live Demo

**[https://xandeum-dashboard.vercel.app](https://xandeum-dashboard.vercel.app)**

![Xandeum Analytics](https://img.shields.io/badge/Xandeum-Analytics-F3771F)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Three.js](https://img.shields.io/badge/Three.js-3D-green)

## Key Features

### Real-Time Network Monitoring
- **Live pRPC Data** - All data fetched in real-time from Xandeum pNodes via pRPC (no mock data)
- **Auto-Refresh** - Data updates automatically every 30 seconds
- **Network Statistics** - Total nodes, online count, storage capacity, average health score

### Interactive 3D Globe Visualization
- **Global Node Distribution** - Interactive 3D Earth with continent outlines showing pNode locations
- **Node Connections** - Visual network connections between nearby online nodes
- **Hover Details** - Detailed node info on hover (health, storage, version, region)
- **Smooth Animations** - Auto-rotation with pause on interaction

### Comprehensive Node Analytics
- **Health Score System** - Calculated from uptime (30%), recency (35%), storage efficiency (20%), and version (15%)
- **Status Distribution** - Visual breakdown of online/degraded/offline nodes
- **Storage Distribution** - Interactive bubble chart with filters (All/Online/High Storage/Healthy)
- **Version Distribution** - Pie chart showing version adoption across the network
- **Top Performing Nodes** - Ranked by health score

### Advanced Node Comparison
- **Side-by-Side Comparison** - Compare up to 4 nodes simultaneously
- **Radar Charts** - Visual comparison of Health, Storage, Uptime, Utilization, and Version
- **Quick Insights** - Automatic highlights showing which node leads in each metric
- **Detailed Table** - Complete metrics comparison with highlighting

### Operator Tools
- **Watchlist System** - Star your favorite nodes to monitor them
- **Browser Notifications** - Get alerts when watched nodes go offline or change status
- **Quick Compare** - Select 2-4 nodes and compare them inline without leaving the page
- **Real GeoIP** - Accurate city-level node locations using ip-api.com

### Enhanced User Experience
- **Xandeum Branding** - Official color scheme (Orange #F3771F, Purple #5D2554, Blue #1C3850)
- **Dark/Light Theme** - System-aware with manual toggle
- **Mobile-Responsive** - Fully responsive design for all screen sizes
- **Metric Tooltips** - Helpful explanations for all metrics and visualizations
- **Smooth Animations** - Framer Motion transitions throughout
- **Fullscreen Globe** - Expand the 3D globe to fullscreen with one click

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3.4 |
| UI Components | shadcn/ui + Radix UI |
| Charts | Recharts |
| Animations | Framer Motion |
| 3D Visualization | React Three Fiber + Drei |
| Data Fetching | SWR |
| Icons | Lucide React |

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/0xJesus/xandeum-pnodes-analytics.git
cd xandeum-pnodes-analytics
```

2. **Install dependencies**

```bash
npm install
```

3. **Run the development server**

```bash
npm run dev
```

4. **Open the app**

Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
xandeum-pnodes-analytics/
├── app/                      # Next.js App Router pages
│   ├── nodes/               # Nodes list and detail pages
│   │   └── [pubkey]/        # Dynamic node detail page
│   ├── compare/             # Node comparison page
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Dashboard home
│   └── globals.css          # Global styles with Xandeum branding
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── layout/              # Header, Footer with credits
│   ├── dashboard/           # Dashboard components (HeroStats, BubbleChart, etc.)
│   ├── nodes/               # Node-related components
│   ├── three/               # 3D Globe visualization
│   └── common/              # Shared components
├── lib/
│   ├── clientPrpc.ts        # Client-side pRPC fetcher
│   ├── utils.ts             # Utility functions
│   └── constants.ts         # Configuration & Xandeum colors
├── types/
│   └── index.ts             # TypeScript types
└── hooks/
    └── useNodes.ts          # SWR hooks for data fetching
```

## pRPC Integration

This dashboard fetches all data in real-time from the Xandeum network using pRPC:

| Method | Description |
|--------|-------------|
| `get-pods-with-stats` | List all pNodes with detailed statistics |
| `get-version` | Network version information |
| `get-stats` | Network statistics |

### Data Sources

**Real Data (from pRPC API):**
- Node pubkeys and IP addresses
- Storage committed/used values
- Uptime metrics
- Software versions
- Last seen timestamps
- Health scores (calculated from real metrics)

**Estimated Data:**
- **Geographic locations**: Derived from IP address ranges for visualization purposes. For production-accurate geolocation, a GeoIP database (like MaxMind) would be required.
- **Regional distribution**: Based on estimated IP locations

## Health Score Calculation

The health score (0-100) is calculated from four weighted factors:

| Factor | Weight | Description |
|--------|--------|-------------|
| Uptime | 30% | Longer uptime = higher score (max at 1 week) |
| Recency | 35% | Based on last seen timestamp (online within 5 min) |
| Storage | 20% | Optimal utilization below 80% scores highest |
| Version | 15% | Latest version (0.7.x) gets full points |

## Deployment

### Deploy on Vercel

1. Push your code to GitHub
2. Import project on [Vercel](https://vercel.com)
3. Deploy automatically

```bash
vercel
```

## Screenshots

### Dashboard
- Hero stats with network overview
- Interactive 3D globe showing global node distribution
- Storage distribution bubble chart with filters
- Performance gauges for uptime, storage, and health

### Node List
- Searchable and filterable node table
- Sort by health, storage, uptime, or status
- Quick access to node details

### Node Comparison
- Radar chart for visual metric comparison
- Insights panel highlighting winners
- Detailed side-by-side table

## Bounty Compliance

- **Web App** - Fully accessible web application
- **Real-Time pRPC** - All data from live Xandeum network (no mocks)
- **Clarity** - Tooltips explain all metrics, clean organized UI
- **UX** - Mobile responsive, dark/light theme, smooth animations
- **Innovation** - 3D globe, radar comparisons, interactive bubble charts

## Author

Built with love by [@_0xjesus](https://x.com/_0xjesus) for the Xandeum Bounty Program

## License

MIT License

## Acknowledgments

- [Xandeum](https://xandeum.network) - Scalable storage layer for Solana
- [Solana](https://solana.com) - The underlying blockchain
- [Vercel](https://vercel.com) - Hosting platform
- [shadcn/ui](https://ui.shadcn.com) - UI components
