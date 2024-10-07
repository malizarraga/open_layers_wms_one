import '/css/style.css';
import proj4 from "proj4";
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { TileWMS } from "ol/source";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import { Polygon, Point } from "ol/geom";
import { Style, Stroke, Fill, Icon, Circle as CircleStyle} from "ol/style";
import { transform, fromLonLat } from "ol/proj";
import { defaults as controlDefaults, ScaleLine, MousePosition } from "ol/control";
import { register } from 'ol/proj/proj4';

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
    //   minZoom: 1,
    //   maxZoom: 12,
      extent: bounds
    })
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

  const vectorSource = new VectorSource();

  const markerLayer = new VectorLayer({
    source: vectorSource,
    style: new Style({
      image: new CircleStyle({
        radius: 2,
        fill: new Fill({color: 'rgba(255, 0, 0, 0.1)'}),
        stroke: new Stroke({color: 'red', width: 1}),
      })
    })
  });
  
  map.addLayer(markerLayer);

  const jsonFetch = await fetch('http://localhost:8031/orogo/api/v1/points/all');

  const jsonResult = await jsonFetch.json();

//   jsonResult.forEach((x) => vectorSource.addFeature(new Feature({
//     geometry: new Point(transform([x.lon, x.lat], 'EPSG:4326', 'EPSG:26912')),
//     title: 'Hi my name is Mario'
//   })));