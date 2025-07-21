'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
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

// A custom blue icon for the user's location
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

// A component to automatically update the map's view
function ChangeView({ center, zoom }: { center: L.LatLngExpression; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function Map() {
  const [data, setData] = useState<ParkingData | null>(null);
  const [userLocation, setUserLocation] = useState<L.LatLng | null>(null);

  useEffect(() => {
    // Get user's location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = new L.LatLng(latitude, longitude);
        setUserLocation(newLocation);

        // Fetch nearby parking spots
        fetch(`/api/parking?lat=${latitude}&lon=${longitude}`)
          .then((res) => res.json())
          .then((data) => setData(data));
      },
      () => {
        // Fallback if user denies location access
        console.log("Location access denied. Fetching default parking data.");
        fetch('/api/parking')
          .then((res) => res.json())
          .then((data) => setData(data));
      }
    );
  }, []);

  const mapCenter: L.LatLngExpression = userLocation || [51.505, -0.09];

  return (
    <MapContainer center={mapCenter} zoom={13} style={{ height: '100vh', width: '100%' }}>
      {userLocation && <ChangeView center={userLocation} zoom={15} />}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
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
  );
}

