'use client';

import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/app/components/Map'), {
  ssr: false,
  loading: () => <p>Loading map...</p>,
});

export default function ClientMap() {
  return <Map />;
}
