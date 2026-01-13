# 🗺️ Map Drawing App

A modern web application for drawing and managing geometrical features (Polygon, Rectangle, Circle, Line String) on OpenStreetMap tiles with intelligent non-overlapping polygon constraints and GeoJSON export functionality.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?logo=leaflet&logoColor=white)

## 🚀 Live Demo

[View Live Demo](https://your-username.github.io/osm-map-drawing-app) *(Update this link after deployment)*

## 📸 Screenshots

![Main Interface](./screenshots/main-interface.png)
*Main drawing interface with toolbar and map*

![Drawing Tools](./screenshots/drawing-tools.png)
*Various drawing tools in action*

## ✨ Features

- 🗺️ **OpenStreetMap Integration**: Renders free OSM tiles with smooth zooming and panning
- ✏️ **Drawing Tools**: Draw polygons, rectangles, circles, and line strings
- 🔒 **Non-Overlapping Polygons**: Automatic trimming of overlapping polygons (Circle, Rectangle, Polygon)
- 🚫 **Enclosure Prevention**: Blocks polygons that are fully enclosed by existing polygons
- ➖ **Line String Freedom**: Line strings can freely overlap without restrictions
- 📥 **GeoJSON Export**: Export all drawn features as GeoJSON file
- ⚙️ **Dynamic Configuration**: Easily adjustable maximum shapes per type
- 🎨 **Modern UI**: Clean, intuitive toolbar interface

## 🛠️ Tech Stack

- **React 18** with **TypeScript**
- **Leaflet** for map rendering
- **Leaflet Draw** for drawing tools
- **Turf.js** for spatial operations (overlap detection, polygon trimming)
- **Zustand** for state management
- **Vite** for build tooling

## 🚀 Setup & Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation Steps

1. Clone the repository:
```bash
git clone https://github.com/your-username/osm-map-drawing-app.git
cd osm-map-drawing-app
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173` (or the port shown in terminal)

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## 📖 Usage

### Drawing Features

1. **Select a drawing tool** from the toolbar (Polygon, Rectangle, Circle, or Line String)
2. **Click on the map** to start drawing:
   - **Polygon**: Click multiple points, double-click to finish
   - **Rectangle**: Click and drag to create a rectangle
   - **Circle**: Click center point, drag to set radius
   - **Line String**: Click multiple points, double-click to finish
3. The feature will be automatically added to the map

### Polygon Overlap Handling

The application enforces non-overlapping rules for polygonal features (Polygon, Rectangle, Circle):

- **Auto-trimming**: When a new polygon overlaps with existing ones, the overlapping area is automatically trimmed
- **Enclosure blocking**: If a new polygon is fully enclosed by an existing polygon, it is blocked with an error message
- **Line Strings**: Line strings are excluded from overlap restrictions and can freely cross or overlap any features

### Export to GeoJSON

1. Click the **"📥 Export GeoJSON"** button in the toolbar
2. A GeoJSON file will be downloaded containing all drawn features
3. The file includes geometry and properties (type, id, color) for each feature

### Clear All Features

Click the **"🗑️ Clear All"** button to remove all drawn features from the map.

## ⚙️ Configuration

### Maximum Shapes Per Type

Edit `src/config/shapeLimits.ts` to adjust the maximum number of shapes allowed per type:

```typescript
export const DEFAULT_SHAPE_LIMITS: ShapeLimits = {
  polygon: 10,      // Maximum polygons
  rectangle: 5,     // Maximum rectangles
  circle: 5,        // Maximum circles
  lineString: 20,   // Maximum line strings
}
```

### Map Center and Zoom

Edit `src/config/mapConfig.ts` to change the default map center and zoom level:

```typescript
export const DEFAULT_CENTER: [number, number] = [51.505, -0.09] // [lat, lng]
export const DEFAULT_ZOOM = 13
```

## 🔧 Polygon Overlap Logic Explanation

The overlap detection and trimming logic is implemented in `src/utils/geometry.ts`:

### 1. Overlap Detection (`doPolygonsOverlap`)
- Uses Turf.js `intersect` function to check if two polygons overlap
- Returns `true` if the intersection area is greater than 0

### 2. Enclosure Detection (`isPolygonEnclosed`)
- Checks if all points of the inner polygon are inside the outer polygon
- Uses Turf.js `booleanPointInPolygon` for point-in-polygon checks

### 3. Auto-trimming (`trimPolygonOverlaps`)
- Iterates through existing polygons
- For each overlapping polygon:
  - If the new polygon is fully enclosed → returns `null` (blocked)
  - If the existing polygon is fully enclosed → skips it
  - Otherwise → uses Turf.js `difference` to subtract the overlapping area
- Handles MultiPolygon results by selecting the largest remaining polygon
- Returns the trimmed polygon or `null` if trimming removes the entire polygon

### Example Flow

1. User draws a new rectangle
2. System checks for overlaps with existing polygons
3. If overlap detected:
   - Check if new rectangle is fully enclosed → **Block with error**
   - Otherwise → **Trim overlapping areas**
4. Add the (possibly trimmed) rectangle to the map

## Sample GeoJSON Export

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-0.1, 51.5], [-0.08, 51.5], [-0.08, 51.52], [-0.1, 51.52], [-0.1, 51.5]]]
      },
      "properties": {
        "id": "polygon-1234567890-abc123",
        "type": "polygon",
        "name": "Untitled polygon",
        "color": "#3388ff"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [[-0.09, 51.505], [-0.08, 51.506], [-0.07, 51.507]]
      },
      "properties": {
        "id": "lineString-1234567891-def456",
        "type": "lineString",
        "name": "Untitled lineString",
        "color": "#00ff00"
      }
    }
  ]
}
```

## 📁 Project Structure

```
osm-map-drawing-app/
├── src/
│   ├── components/          # React components
│   │   ├── MapComponent.tsx # Main map component
│   │   ├── FeatureLayer.tsx # Renders drawn features
│   │   └── Toolbar.tsx      # Drawing tools toolbar
│   ├── config/              # Configuration files
│   │   ├── mapConfig.ts     # Map center/zoom settings
│   │   └── shapeLimits.ts   # Maximum shapes per type
│   ├── hooks/               # Custom React hooks
│   │   └── useDrawingHandlers.ts # Drawing logic
│   ├── store/               # State management
│   │   └── useDrawingStore.ts   # Zustand store
│   ├── types/               # TypeScript types
│   │   └── feature.ts       # Feature type definitions
│   ├── utils/               # Utility functions
│   │   ├── geometry.ts      # Spatial operations
│   │   ├── export.ts        # GeoJSON export
│   │   └── leafletIconFix.ts # Leaflet icon fix
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Code Quality

- **TypeScript**: Strict typing throughout
- **Modular Structure**: Organized into components, hooks, utils, and services
- **State Management**: Zustand for clean, reactive state
- **Comments**: Inline comments for complex logic (especially polygon overlap handling)
- **Error Handling**: User-friendly error messages for invalid operations

## 🚀 Deployment

### Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Vercel will automatically detect Vite and deploy

### Netlify

1. Push your code to GitHub
2. In Netlify, create a new site from Git
3. Build command: `npm run build`
4. Publish directory: `dist`

### GitHub Pages

1. Build the project: `npm run build`
2. Follow [Vite deployment guide](https://vitejs.dev/guide/static-deploy.html#github-pages) for GitHub Pages setup

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

MIT License

## 🐛 Issues & Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/osm-map-drawing-app/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide detailed information about the issue, including:
   - Browser version
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

## 🙏 Acknowledgments

- [OpenStreetMap](https://www.openstreetmap.org/) for free map tiles
- [Leaflet](https://leafletjs.com/) for map rendering
- [Turf.js](https://turfjs.org/) for spatial operations
- [React Leaflet](https://react-leaflet.js.org/) for React integration
