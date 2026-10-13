'use client';

import React, { useEffect } from 'react';
import { useSentinel } from '@/lib/store';
import { AppShell } from '@/components/shell/AppShell';

export default function SettingsPage() {
  const { setActiveView } = useSentinel();

  useEffect(() => {
    setActiveView('settings');
  }, [setActiveView]);

  return <AppShell />;
}
