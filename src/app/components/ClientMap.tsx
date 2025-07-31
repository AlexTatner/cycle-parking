'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useEffect, useState, useCallback, useMemo, memo, useRef } from 'react';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import ParkingDetailsModal from './ParkingDetailsModal';
import Image from 'next/image';

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

function MapEvents({ onDataLoad }: { onDataLoad: (data: ParkingData | null) => void }) {
    const map = useMap();

    const fetchData = useCallback(() => {
        const bounds = map.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        fetch(`/api/parking?bounds=${sw.lng},${sw.lat},${ne.lng},${ne.lat}`)
            .then((res) => res.json())
            .then((data) => onDataLoad(data))
            .catch(error => console.error("Failed to fetch parking data:", error));
    }, [map, onDataLoad]);

    useMapEvents({
        moveend: fetchData,
        zoomend: fetchData,
    });

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return null;
}

const ParkingMarker = memo(function ParkingMarker({ parking, onMarkerClick }: { parking: ParkingLocation, onMarkerClick: (parking: ParkingLocation) => void }) {
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

function SetViewToUserLocation({ userLocation }: { userLocation: L.LatLng | null }) {
    const map = useMap();

    useEffect(() => {
        if (userLocation) {
            map.flyTo(userLocation, 16);
        }
    }, [userLocation, map]);

    return null;
}

function MapControls({ userLocation }: { userLocation: L.LatLng | null }) {
    const map = useMap();

    const handleGoToUserLocation = () => {
        if (userLocation) {
            map.flyTo(userLocation, 16);
        }
    };

    const handleZoomIn = () => {
        map.zoomIn();
    };

    const handleZoomOut = () => {
        map.zoomOut();
    };

    const buttonStyle: React.CSSProperties = {
        border: 'none',
        backgroundColor: '#f0f0f0',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 5px',
    };

    const zoomButtonStyle: React.CSSProperties = {
        ...buttonStyle,
        fontSize: '1.8em',
        lineHeight: '1',
    };

    return (
        <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            backgroundColor: 'white',
            borderRadius: '30px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            padding: '5px',
        }}>
            <button onClick={handleZoomIn} style={zoomButtonStyle}>+</button>
            <button onClick={handleZoomOut} style={zoomButtonStyle}>-</button>
            <button onClick={handleGoToUserLocation} style={buttonStyle}>
                <img src="/icons/user-location.png" alt="My Location" style={{ width: '24px', height: '24px' }} />
            </button>
        </div>
    );
}

export default function ClientMap() {
  const [features, setFeatures] = useState<Map<string, ParkingLocation>>(new Map());
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const [selectedParking, setSelectedParking] = useState<ParkingLocation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = new L.LatLng(latitude, longitude);
        setUserLocation(newLocation);
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

  const handleMarkerClick = useCallback((parking: ParkingLocation) => {
    setSelectedParking(parking);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedParking(null);
  };

  const markers = useMemo(() => Array.from(features.values()), [features]);

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <MapContainer center={[51.505, -0.09]} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <MapEvents onDataLoad={handleDataLoad} />
        <SetViewToUserLocation userLocation={userLocation} />
        <MapControls userLocation={userLocation} />
        <MarkerClusterGroup>
          {markers.map((parking) => (
            <ParkingMarker
              key={parking.properties.featureId}
              parking={parking}
              onMarkerClick={handleMarkerClick}
            />
          ))}
        </MarkerClusterGroup>
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}
      </MapContainer>
      <ParkingDetailsModal
        open={isModalOpen}
        onClose={handleCloseModal}
        parking={selectedParking}
      />
    </div>
  );
}
