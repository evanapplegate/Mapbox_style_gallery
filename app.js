const MAPBOX_ACCESS_TOKEN =
  "pk.eyJ1IjoiZXZhbmRhcHBsZWdhdGUiLCJhIjoiY2tmbzA1cWM1MWozeTM4cXV4eHUwMzFhdiJ9.Z5f9p8jJD_N1MQwycF2NEw";

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

const initialCamera = {
  center: [-71.0, 43.5],
  zoom: 5.5,
  pitch: 0,
  bearing: 0,
};

const DEM_SOURCE_ID = "mapbox-dem";
const DEM_TILESET_URL = "mapbox://mapbox.terrain-rgb";
const TERRAIN_EXAGGERATION = 1;
const SKY_LAYER_ID = "synced-sky";
const SKY_PAINT = {
  "sky-type": "atmosphere",
  "sky-atmosphere-sun-intensity": 20,
  "sky-atmosphere-color": "#9fd4ff",
  "sky-atmosphere-halo-color": "#f6fbff",
};

const styleCatalog = [
  { id: "streets", label: "Streets", style: "mapbox://styles/mapbox/streets-v12" },
  { id: "outdoors", label: "Outdoors", style: "mapbox://styles/mapbox/outdoors-v12" },
  { id: "custom-style-3", label: "Burgundy", style: "mapbox://styles/evandapplegate/clrwzxv8b016s01pbgmsa8fcs" },
  { id: "light", label: "Light", style: "mapbox://styles/mapbox/light-v11" },
  { id: "dark", label: "Dark", style: "mapbox://styles/mapbox/dark-v11" },
  { id: "custom-style-6", label: "Minimo", style: "mapbox://styles/evandapplegate/ckgzk8twb0xol19qm5131gzy3" },
  { id: "custom-style-7", label: "Beige", style: "mapbox://styles/evandapplegate/cm0o5j76w024v01o0ds82fzpr" },
  { id: "custom-cali-terrain", label: "Warm", style: "mapbox://styles/evandapplegate/cmie1azfq008f01r97qppgp2t" },
  { id: "custom-desert-tones", label: "Green-y", style: "mapbox://styles/evandapplegate/cmc58lfs6006z01sr1qse2mbu" },
  { id: "frank", label: "Frank", style: "mapbox://styles/evandapplegate/cmie1lfrg000d01stbv41djit" },
  { id: "american-memory", label: "American Memory", style: "mapbox://styles/evandapplegate/cmie1ntqn007n01svgxmxh4g8" },
  { id: "basic-overcast", label: "Basic Overcast", style: "mapbox://styles/evandapplegate/cmie1s1ql007501snhbf3478v" },
];

const gridEl = document.getElementById("map-grid");
const maps = [];

let isSyncing = false;

const syncCamera = (sourceMap) => {
  if (isSyncing) return;

  isSyncing = true;
  const targetCamera = {
    center: sourceMap.getCenter(),
    zoom: sourceMap.getZoom(),
    bearing: sourceMap.getBearing(),
    pitch: sourceMap.getPitch(),
  };

  maps.forEach((mapInstance) => {
    if (mapInstance === sourceMap) return;
    mapInstance.jumpTo(targetCamera);
  });

  isSyncing = false;
};

const applySkyLayer = (map) => {
  try {
    if (!map.isStyleLoaded()) return;
    
    const style = map.getStyle();
    if (!style || !style.layers) return;
    
    const existingSky =
      style.layers.find((layer) => layer.type === "sky")?.id || null;

    if (existingSky) {
      Object.entries(SKY_PAINT).forEach(([prop, value]) => {
        try {
          map.setPaintProperty(existingSky, prop, value);
        } catch (e) {
          console.warn(`Failed to set sky property ${prop}:`, e);
        }
      });
      return;
    }

    map.addLayer({
      id: SKY_LAYER_ID,
      type: "sky",
      paint: SKY_PAINT,
    });
  } catch (e) {
    console.warn("Failed to apply sky layer:", e);
  }
};

const ensureTerrain = (map) => {
  try {
    if (!map.isStyleLoaded()) return;
    
    if (!map.getSource(DEM_SOURCE_ID)) {
      map.addSource(DEM_SOURCE_ID, {
        type: "raster-dem",
        url: DEM_TILESET_URL,
        tileSize: 512,
        maxzoom: 14,
      });
    }
    map.setTerrain({ source: DEM_SOURCE_ID, exaggeration: TERRAIN_EXAGGERATION });
    applySkyLayer(map);
  } catch (e) {
    console.warn("Failed to setup terrain:", e);
  }
};

const makeMapCard = (styleDef, index) => {
  const card = document.createElement("article");
  card.className = `map-card${index >= 7 ? " map-card--sky" : ""}`;

  const mapContainer = document.createElement("div");
  mapContainer.className = "map";
  mapContainer.id = `map-${styleDef.id}`;

  const label = document.createElement("span");
  label.className = "map-label";
  const capitalizedLabel = styleDef.label.charAt(0).toUpperCase() + styleDef.label.slice(1).toLowerCase();
  label.textContent = `${index + 1}. ${capitalizedLabel}`;

  const styleUrl = document.createElement("span");
  styleUrl.className = "map-style-url";
  styleUrl.textContent = styleDef.style;

  card.appendChild(mapContainer);
  card.appendChild(label);
  card.appendChild(styleUrl);
  gridEl.appendChild(card);

  const map = new mapboxgl.Map({
    container: mapContainer,
    style: styleDef.style,
    center: initialCamera.center,
    zoom: initialCamera.zoom,
    pitch: initialCamera.pitch,
    bearing: initialCamera.bearing,
    attributionControl: false,
    dragRotate: true,
    pitchWithRotate: true,
  });

  map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

  const onStyleReady = () => {
    setTimeout(() => {
      try {
        if (map.isStyleLoaded()) {
          ensureTerrain(map);
        }
      } catch (e) {
        console.error(`Failed to setup terrain for ${styleDef.label}:`, e);
      }
    }, 100);
  };

  map.on("load", () => {
    map.resize();
    onStyleReady();
  });

  map.on("style.load", onStyleReady);
  map.on("error", (e) => {
    console.error(`Map ${styleDef.label} (${styleDef.id}) error:`, e.error);
  });
  map.on("styleimagemissing", (e) => {
    console.warn(`Map ${styleDef.label} missing image:`, e.id);
  });
  map.on("move", () => syncCamera(map));

  maps.push(map);
};

styleCatalog.forEach((styleDef, index) => makeMapCard(styleDef, index));

window.addEventListener("resize", () => {
  maps.forEach((mapInstance) => mapInstance.resize());
});

