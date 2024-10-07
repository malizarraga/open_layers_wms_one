import '/css/style.css';
import proj4 from "proj4";
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { TileWMS } from "ol/source";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import { Polygon, Point } from "ol/geom";
import { Style, Stroke, Fill, Icon } from "ol/style";
import { transform } from "ol/proj";
import { defaults as controlDefaults, ScaleLine, MousePosition } from "ol/control";
import { register } from 'ol/proj/proj4';

const mapId = "map";
const mapCoordinates = {
  minLat: 58.516,
  maxLat: 58.716,
  minLon: -117.133,
  maxLon: -117.333,
};

const mapCenter = {
  lat: mapCoordinates.minLat + ((mapCoordinates.maxLat - mapCoordinates.minLat) / 2),
  lon: mapCoordinates.minLon + ((mapCoordinates.maxLon - mapCoordinates.minLon) / 2),
};

const isRectangle = (mapCoordinates.minLat !== mapCoordinates.maxLat && mapCoordinates.minLon !== mapCoordinates.maxLon);

proj4.defs('EPSG:26912', "+proj=utm +zone=12 +ellps=GRS80 +datum=NAD83 +units=m +no_defs +a=6378137.0 +b=6356752.3141403");

register(proj4);

const bounds = [-1000000, 6500000, 1400000, 8000000]; // for EPSG:26,912 - NAD28 / UTM zone 11N, left, bottom, right, top

const map = new Map({
  target: mapId,
  view: new View({
    center: transform([mapCenter.lat, mapCenter.lon], 'EPSG:4326', 'EPSG:26912'),
    projection: 'EPSG:26912',
    zoom: 6,
    minZoom: 4,
    maxZoom: 12,
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

const geoBaseWmsLayer = new TileLayer({
  title: "Geobase",
  source: new TileWMS({
    url: 'https://maps.geogratis.gc.ca/wms/canvec_en',
    params: {
      LAYERS: 'hydro,land,administrative',
      FORMAT: 'image/png'
    },
    attributions: [
      'All maps from ' +
      '<a href="https://www.nrcan.gc.ca/earth-sciences/geography/topographic-information/maps/10995" target="_blank">Natural Resources Canada</a>'
    ]
  }),
});

map.addLayer(geoBaseWmsLayer);

if (isRectangle) {

  const polyCoordinates = [
    transform([
      // Top left
      mapCoordinates.minLon,
      mapCoordinates.minLat
    ], 'EPSG:4326', 'EPSG:26912'),
    transform([
      // Top right
      mapCoordinates.maxLon,
      mapCoordinates.minLat
    ], 'EPSG:4326', 'EPSG:26912'),
    transform([
      // Bottom right
      mapCoordinates.maxLon,
      mapCoordinates.maxLat
    ], 'EPSG:4326', 'EPSG:26912'),
    transform([
      // Bottom left
      mapCoordinates.minLon,
      mapCoordinates.maxLat
    ], 'EPSG:4326', 'EPSG:26912'),
    transform([
      // Top left again (back to start)
      mapCoordinates.minLon,
      mapCoordinates.minLat
    ], 'EPSG:4326', 'EPSG:26912'),
  ];

  const rectangleLayer = new VectorLayer({
    source: new VectorSource({
      features: [
          new Feature({
            geometry: new Polygon([polyCoordinates]),
          })
      ],
    }),
    style: [
        new Style({
          stroke: new Stroke({
            color: '#00aeff',
            width: 2
          }),
          fill: new Fill({
            color: 'rgba(0, 174, 255, 0.5)',
          })
        })
    ]
  });

  map.addLayer(rectangleLayer);

}

const markerLayer = new VectorLayer({
  source: new VectorSource({
    features: [
        new Feature({
          geometry: new Point(transform([mapCenter.lon, mapCenter.lat], 'EPSG:4326', 'EPSG:26912'))
        })
    ]
  }),
  style: new Style({
    image: new Icon({
      anchor: [0.5, 0],
      anchorOrigin: "bottom-left",
      anchorYUnits: "pixels",
      src: "/images/marker-single-development.png",
    })
  })
});

map.addLayer(markerLayer);