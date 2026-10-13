'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSentinel } from '@/lib/store';
import { AppShell } from '@/components/shell/AppShell';

export default function CalendarPage() {
  const params = useParams();
  const { setActiveView, setActiveProjectId } = useSentinel();
  const projectId = params?.projectId as string | undefined;

  useEffect(() => {
    setActiveView('calendar');
    if (projectId) {
      setActiveProjectId(projectId);
    }
  }, [projectId, setActiveView, setActiveProjectId]);

  return <AppShell />;
}
