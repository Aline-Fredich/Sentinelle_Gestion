'use client';

import React, { useEffect } from 'react';
import { useSentinel } from '@/lib/store';
import { AppShell } from '@/components/shell/AppShell';

export default function TeamPage() {
  const { setActiveView } = useSentinel();

  useEffect(() => {
    setActiveView('team');
  }, [setActiveView]);

  return <AppShell />;
}
