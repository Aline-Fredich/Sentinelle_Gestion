'use client';

import React, { useEffect } from 'react';
import { useSentinel } from '@/lib/store';
import { AppShell } from '@/components/shell/AppShell';

export default function BillingPage() {
  const { setActiveView } = useSentinel();

  useEffect(() => {
    setActiveView('billing');
  }, [setActiveView]);

  return <AppShell />;
}
