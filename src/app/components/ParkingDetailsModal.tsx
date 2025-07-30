'use client';

import { Modal, Box, Typography, Card, CardMedia, CardContent } from '@mui/material';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

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

interface ParkingDetailsModalProps {
  open: boolean;
  onClose: () => void;
  parking: ParkingLocation | null;
}

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
} as const;

export default function ParkingDetailsModal({ open, onClose, parking }: ParkingDetailsModalProps) {
  if (!parking) {
    return null;
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="parking-details-modal-title"
      aria-describedby="parking-details-modal-description"
    >
      <Box sx={style}>
        <Card>
          {parking.properties.photoUrl && (
            <Zoom>
              <CardMedia
                component="img"
                height="194"
                image={parking.properties.photoUrl}
                alt="Cycle parking"
              />
            </Zoom>
          )}
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              Parking Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Borough: {parking.properties.borough}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Capacity: {parking.properties.capacity}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Modal>
  );
}
