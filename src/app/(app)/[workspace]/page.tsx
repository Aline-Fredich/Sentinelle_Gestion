'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSentinel } from '@/lib/store';
import { AppShell } from '@/components/shell/AppShell';

export default function WorkspaceOverviewPage() {
  const params = useParams();
  const { setActiveView } = useSentinel();

  useEffect(() => {
    setActiveView('overview');
  }, [setActiveView, params]);

  return <AppShell />;
}
