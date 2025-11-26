# Mapbox Style Browser

A grid-based browser for comparing multiple Mapbox map styles side-by-side. All maps are synchronized—interacting with one map updates all others simultaneously.

## How It Works

1. **Grid Layout**: Displays multiple Mapbox styles in a responsive 4-column grid
2. **Synchronized Navigation**: Pan, zoom, rotate, or pitch any map and all maps update together
3. **Terrain & Sky**: Automatically adds terrain elevation and atmospheric sky layers to compatible styles
4. **3D Controls**:
   - **Mobile**: Two-finger drag up/down for pitch
   - **Desktop**: Two-finger/middle mouse button click and drag for 3D rotation

## Setup

1. Open `index.html` in a web browser
2. The app uses a Mapbox access token configured in `app.js`
3. No build step required—runs directly in the browser

## Customization

Edit `styleCatalog` in `app.js` to add, remove, or reorder map styles:

```javascript
const styleCatalog = [
  { id: "streets", label: "Streets", style: "mapbox://styles/mapbox/streets-v12" },
  // Add your styles here
];
```

