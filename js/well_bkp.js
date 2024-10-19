import '/css/style.css';
import proj4 from "proj4";
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { TileWMS } from "ol/source";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import WebGLPointsLayer from 'ol/layer/WebGLPoints.js';
import Feature from "ol/Feature";
import { Point } from 'ol/geom';
import { Style, Stroke, Fill, Circle as CircleStyle} from "ol/style";
import { transform, fromLonLat, toLonLat } from "ol/proj";
import { defaults as controlDefaults, ScaleLine, MousePosition } from "ol/control";
import { register } from 'ol/proj/proj4';

const predefinedStyles = {
    circles: {
        'circle-radius': 8,
        'circle-fill-color': ['match', ['get', 'hover'], 1, '#ff3f3f', '#006688'],
        'circle-rotate-with-view': false,
        'circle-displacement': [0, 0],
        'circle-opacity': 1,
    },
  };

const mapId = "map";
const mapCoordinates = {
    minLat: 60.039,
    maxLat: 60.146,
    minLon: -123.056,
    maxLon: -123.189,
};

const mapCenter = {
    lat: mapCoordinates.minLat + ((mapCoordinates.maxLat - mapCoordinates.minLat) / 2),
    lon: mapCoordinates.minLon + ((mapCoordinates.maxLon - mapCoordinates.minLon) / 2),
  };
  
  proj4.defs('EPSG:26912', "+proj=utm +zone=12 +ellps=GRS80 +datum=NAD83 +units=m +no_defs +a=6378137.0 +b=6356752.3141403");
  
  register(proj4);
  
  const bounds = [-1000000, 6500000, 1400000, 8000000]; // for EPSG:26,912 - NAD28 / UTM zone 11N, left, bottom, right, top
  
  const map = new Map({
    target: mapId,
    view: new View({
      center: fromLonLat([mapCenter.lon, mapCenter.lat]),
      projection: 'EPSG:26912',
      zoom: 6,
      extent: bounds
    }),
    controls: controlDefaults().extend([
        new ScaleLine(),
        new MousePosition({
          coordinateFormat: (lonlat) => {
            const precision = 4;
            lonlat = transform([lonlat[0], lonlat[1]], 'EPSG:26912', 'EPSG:4326');
            return (Math.round(lonlat[0] * Math.pow(10, precision)) / Math.pow(10, precision)) + '&deg;, ' + (Math.round(lonlat[1] * Math.pow(10, precision)) / Math.pow(10, precision)) + '&deg;';
          }
        }),
    ])
  });

  /*
   * valid layers: hydro,land,administrative,transport,elevation,man_made,resource_management
   * The position of the layer has priority. 
   */

  const geoBaseWmsLayer = new TileLayer({
    title: "Geobase",
    source: new TileWMS({
      url: 'https://maps.geogratis.gc.ca/wms/canvec_en',
      params: {
        LAYERS: 'hydro,land,administrative',
        FORMAT: 'image/png'
      },
    }),
  });
  
  
  map.addLayer(geoBaseWmsLayer);

  const vectorSource = new VectorSource({
    url: 'http://localhost:8031/orogo/api/v1/points/geojson',
    format: new GeoJSON(),
  });

  const markerLayer = new WebGLPointsLayer({
    source: vectorSource,
    style: predefinedStyles['circles'],
  });
  
  map.addLayer(markerLayer);

  const info = document.getElementById('notification');

  map.on('click', (evt) => {
    const feature = map.forEachFeatureAtPixel(evt.pixel, (feature) => feature);
    
    console.log(feature);

    // if (feature) {
    //     info.innerHTML = feature.get('id') || '&nbsp;';
    // } else {
    //     info.innerHTML = '&nbsp;';
    // }
  });

  map.on('loadstart', function () {
    info.innerHTML = "Loading...";
    map.getTargetElement().classList.add('spinner');
  });
  map.on('loadend', function () {
    info.innerHTML = "Loaded.";
    map.getTargetElement().classList.remove('spinner');
  });
  