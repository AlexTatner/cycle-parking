'use client';

import dynamic from 'next/dynamic';

const ClientMap = dynamic(() => import('@/app/components/ClientMap'), {
  ssr: false,
  loading: () => <p>Loading map...</p>,
});

export default function DynamicMap() {
  return <ClientMap />;
}
