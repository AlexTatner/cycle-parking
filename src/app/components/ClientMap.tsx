'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useEffect, useState, useCallback, useMemo, memo } from 'react';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import ParkingDetailsModal from './ParkingDetailsModal';

const parkingIcon = L.icon({
  iconUrl: '/images/marker-icon.png',
  iconRetinaUrl: '/images/marker-icon-2x.png',
  shadowUrl: '/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = L.icon({
    iconUrl: '/icons/user-location.png',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
});

interface ParkingLocation {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    featureId: string;
    borough: string;
    capacity: number;
    photoUrl: string;
  };
}

interface ParkingData {
  type: 'FeatureCollection';
  features: ParkingLocation[];
}

// Component to handle map events and data fetching
function MapEvents({ onDataLoad, onZoomChange }: { onDataLoad: (data: ParkingData | null) => void, onZoomChange: (zoom: number) => void }) {
    const map = useMap();

    const fetchData = useCallback(() => {
        const currentZoom = map.getZoom();
        onZoomChange(currentZoom);

        if (currentZoom < 14) {
            onDataLoad(null); // Clear data if zoomed out
            return;
        }

        const bounds = map.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        fetch(`/api/parking?bounds=${sw.lng},${sw.lat},${ne.lng},${ne.lat}`)
            .then((res) => res.json())
            .then((data) => onDataLoad(data))
            .catch(error => console.error("Failed to fetch parking data:", error));
    }, [map, onDataLoad, onZoomChange]);

    useMapEvents({
        moveend: fetchData,
        zoomend: fetchData,
    });

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return null;
}

const ParkingMarker = memo(function ParkingMarker({ parking, onMarkerClick }) {
  return (
    <Marker
      position={[parking.geometry.coordinates[1], parking.geometry.coordinates[0]]}
      icon={parkingIcon}
      eventHandlers={{
        click: () => onMarkerClick(parking),
      }}
    />
  );
});
ParkingMarker.displayName = 'ParkingMarker';

export default function ClientMap() {
  const [features, setFeatures] = useState<Map<string, ParkingLocation>>(new Map());
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const [mapCenter, setMapCenter] = useState<L.LatLng>(new L.LatLng(51.505, -0.09));
  const [selectedParking, setSelectedParking] = useState<ParkingLocation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(13);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = new L.LatLng(latitude, longitude);
        setUserLocation(newLocation);
        setMapCenter(newLocation);
      },
      () => {
        console.log("Location access denied. Using default location.");
      }
    );
  }, []);

  const handleDataLoad = useCallback((data: ParkingData | null) => {
    if (data) {
      setFeatures(prevFeatures => {
        let hasChanged = false;
        const newFeatures = new Map(prevFeatures);
        data.features.forEach(feature => {
          if (!newFeatures.has(feature.properties.featureId)) {
            newFeatures.set(feature.properties.featureId, feature);
            hasChanged = true;
          }
        });
        return hasChanged ? newFeatures : prevFeatures;
      });
    } else {
      setFeatures(new Map());
    }
  }, []);

  const handleZoomChange = useCallback((zoom: number) => {
    setZoomLevel(zoom);
    if (zoom < 14) {
      setFeatures(new Map());
    }
  }, []);

  const handleMarkerClick = useCallback((parking: ParkingLocation) => {
    setSelectedParking(parking);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedParking(null);
  };

  const initialMapCenter: L.LatLngExpression = userLocation || [51.505, -0.09];

  const markers = useMemo(() => Array.from(features.values()), [features]);

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <MapContainer center={initialMapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapEvents onDataLoad={handleDataLoad} onZoomChange={handleZoomChange} />
        {zoomLevel >= 14 && (
          <MarkerClusterGroup>
            {markers.map((parking) => (
              <ParkingMarker
                key={parking.properties.featureId}
                parking={parking}
                onMarkerClick={handleMarkerClick}
              />
            ))}
          </MarkerClusterGroup>
        )}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}
      </MapContainer>
      {zoomLevel < 14 && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          padding: '10px 20px',
          backgroundColor: 'white',
          borderRadius: '5px',
          border: '1px solid #ccc',
        }}>
          Zoom in to see parking locations
        </div>
      )}
      <ParkingDetailsModal
        open={isModalOpen}
        onClose={handleCloseModal}
        parking={selectedParking}
      />
    </div>
  );
}
