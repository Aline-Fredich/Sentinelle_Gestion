import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const probeType = searchParams.get('type') || 'readiness';

  const uptimeSeconds = Math.floor(process.uptime ? process.uptime() : 0);
  const memoryUsage = process.memoryUsage ? process.memoryUsage() : null;

  // Sonde de vivacité simple (Liveness Probe - Kubernetes / Vercel)
  if (probeType === 'liveness') {
    return NextResponse.json(
      {
        status: 'alive',
        service: 'SENTINEL GESTION',
        uptime: `${uptimeSeconds}s`,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      }
    );
  }

  // Sonde d'aptitude (Readiness Probe) avec test réel des dépendances
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let dbStatus: 'connected' | 'unreachable' | 'unconfigured' = 'unconfigured';
  let storageStatus: 'operational' | 'degraded' | 'local_only' = 'local_only';
  let latencyMs: number | null = null;

  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
    const startTime = Date.now();
    try {
      // Test de connectivité HTTP avec timeout strict de 2,5 secondes
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const probeRes = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      latencyMs = Date.now() - startTime;
      if (probeRes.ok || probeRes.status === 200 || probeRes.status === 404) {
        dbStatus = 'connected';
        storageStatus = 'operational';
      } else {
        dbStatus = 'unreachable';
        storageStatus = 'degraded';
      }
    } catch {
      dbStatus = 'unreachable';
      storageStatus = 'degraded';
    }
  }

  const isDegradedInDev = process.env.NODE_ENV !== 'production' && dbStatus === 'unreachable';
  const isHealthy = dbStatus !== 'unreachable' || isDegradedInDev;
  const httpStatus = dbStatus === 'unreachable' && process.env.NODE_ENV === 'production' ? 503 : 200;

  return NextResponse.json(
    {
      status: isHealthy ? 'ok' : 'degraded',
      service: 'SENTINEL GESTION',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: `${uptimeSeconds}s`,
      dependencies: {
        database: dbStatus,
        storage: storageStatus,
        latencyMs,
      },
      memory: memoryUsage
        ? {
            rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
            heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          }
        : undefined,
    },
    {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
