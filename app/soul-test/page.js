"use client";

import dynamic from 'next/dynamic';

const SoulTest = dynamic(() => import('../../components/SoulTest'), { ssr: false });

export default function SoulTestPage() {
  return <SoulTest />;
}

