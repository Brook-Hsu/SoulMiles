"use client";

import dynamic from 'next/dynamic';

const TreasureRoutesPage = dynamic(() => import('../../components/TreasureRoutesPage'), {
  ssr: false,
});

export default function RoutesPage() {
  return <TreasureRoutesPage />;
}

