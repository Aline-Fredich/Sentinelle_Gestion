import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const pathname = request.nextUrl.pathname;
  const isSuperAdminRoute = pathname.startsWith('/superadmin') || pathname.startsWith('/api/superadmin');

  // Si Supabase n'est pas encore configuré (ex: premier démarrage local sans .env)
  if (!supabaseUrl || !supabaseKey) {
    // En production, interdire l'accès superadmin sans fournisseur d'identité configuré
    if (isSuperAdminRoute && process.env.NODE_ENV === 'production') {
      return pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'Service d’authentification indisponible' }, { status: 503 })
        : NextResponse.redirect(new URL('/', request.url));
    }
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  // Rafraîchissement sécurisé du jeton d'accès de session
  const { data: { user } } = await supabase.auth.getUser();

  // Protection stricte des routes d'administration privilégiées (authentification ET rôle super_admin)
  if (isSuperAdminRoute) {
    if (!user) {
      return pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        : NextResponse.redirect(new URL('/', request.url));
    }

    const userRole = user.user_metadata?.role || user.app_metadata?.role;
    const isSuperAdmin = userRole === 'super_admin' || user.user_metadata?.isSuperAdmin === true;

    if (!isSuperAdmin) {
      return pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'Accès interdit : privilèges Super Administrateur requis' }, { status: 403 })
        : NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
