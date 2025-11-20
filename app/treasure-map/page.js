"use client";

import dynamic from 'next/dynamic';

const TreasureMap = dynamic(() => import('../../components/TreasureMap'), { ssr: false });

export default function TreasureMapPage() {
  return <TreasureMap />;
}

