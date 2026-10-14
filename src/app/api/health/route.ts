import { NextResponse } from 'next/server';

export async function GET() {
  const uptimeSeconds = Math.floor(process.uptime ? process.uptime() : 0);
  const memoryUsage = process.memoryUsage ? process.memoryUsage() : null;

  return NextResponse.json(
    {
      status: 'ok',
      service: 'SENTINEL GESTION',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      uptime: `${uptimeSeconds}s`,
      health: {
        api: 'operational',
        storage: 'operational',
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
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
