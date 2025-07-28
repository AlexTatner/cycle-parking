'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useCallback } from 'react';
import L from 'leaflet';

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

// Component to programmatically update map view
function SetView({ center }: { center: L.LatLng }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom(), {
            animate: true,
            pan: {
                duration: 1,
            }
        });
    }, [center, map]);
    return null;
}

// Component to handle map events
function MapEvents({ onDragStart, onMoveEnd }: { onDragStart: () => void, onMoveEnd: (center: L.LatLng) => void }) {
    const map = useMapEvents({
        dragstart: () => {
            onDragStart();
        },
        moveend: () => {
            onMoveEnd(map.getCenter());
        },
    });
    return null;
}

export default function ClientMap() {
  const [data, setData] = useState<ParkingData | null>(null);
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);
  const [mapCenter, setMapCenter] = useState<L.LatLng>(new L.LatLng(51.505, -0.09));
  const [viewCenter, setViewCenter] = useState<L.LatLng>(new L.LatLng(51.505, -0.09));
  const [loading, setLoading] = useState(true);
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [recenterTimer, setRecenterTimer] = useState<NodeJS.Timeout | null>(null);

  const fetchParkingData = useCallback((lat: number, lon: number) => {
    setLoading(true);
    setShowSearchButton(false);
    fetch(`/api/parking?lat=${lat}&lon=${lon}`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Failed to fetch parking data:", error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = new L.LatLng(latitude, longitude);
        setUserLocation(newLocation);
        setMapCenter(newLocation);
        setViewCenter(newLocation);
        fetchParkingData(latitude, longitude);
      },
      () => {
        console.log("Location access denied. Fetching default parking data.");
        fetchParkingData(51.505, -0.09);
      }
    );
  }, [fetchParkingData]);

  const handleDragStart = () => {
    if (recenterTimer) {
      clearTimeout(recenterTimer);
      setRecenterTimer(null);
    }
  };

  const handleMoveEnd = (center: L.LatLng) => {
    setViewCenter(center);
    setShowSearchButton(true);
    const timer = setTimeout(() => {
        if (userLocation) {
            setMapCenter(userLocation);
        }
    }, 8000); // 8 seconds
    setRecenterTimer(timer);
  };

  const handleSearchArea = () => {
    fetchParkingData(viewCenter.lat, viewCenter.lng);
  };
  
  const initialMapCenter: L.LatLngExpression = userLocation || [51.505, -0.09];

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100%' }}>
      <MapContainer center={initialMapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <SetView center={mapCenter} />
        <MapEvents onDragStart={handleDragStart} onMoveEnd={handleMoveEnd} />
        {data?.features.map((parking) => (
          <Marker
            key={parking.properties.featureId}
            position={[parking.geometry.coordinates[1], parking.geometry.coordinates[0]]}
            icon={parkingIcon}
          >
            <Popup>
              <div>
                <p>Borough: {parking.properties.borough}</p>
                <p>Capacity: {parking.properties.capacity}</p>
                {parking.properties.photoUrl && (
                  <img src={parking.properties.photoUrl} alt="Cycle parking" style={{ width: '100%', height: 'auto' }} />
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}
      </MapContainer>
      {showSearchButton && (
        <button
            onClick={handleSearchArea}
            style={{
                position: 'absolute',
                top: '10px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                padding: '10px 20px',
                cursor: 'pointer',
                borderRadius: '5px',
                border: '1px solid #ccc',
                backgroundColor: 'white',
            }}
            disabled={loading}
        >
            {loading ? 'Loading...' : 'Search this area'}
        </button>
      )}
    </div>
  );
}
