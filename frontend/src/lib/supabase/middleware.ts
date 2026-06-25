import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/scan', '/attendance/success', '/attendance/failed'];
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));

  // If user is not signed in and trying to access protected route
  if (!user && !isPublicRoute && path !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }

  // If user is signed in and trying to access auth pages
  if (user && (path === '/login' || path === '/signup' || path === '/')) {
    const url = request.nextUrl.clone();
    // Get user role from metadata
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'student';
    switch (role) {
      case 'super_admin':
        url.pathname = '/super-admin/dashboard';
        break;
      case 'admin':
        url.pathname = '/admin/dashboard';
        break;
      default:
        url.pathname = '/student/dashboard';
    }
    return NextResponse.redirect(url);
  }

  // Role-based route protection
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role || 'student';

    if (path.startsWith('/super-admin') && role !== 'super_admin') {
      const url = request.nextUrl.clone();
      url.pathname = role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
      return NextResponse.redirect(url);
    }

    if (path.startsWith('/admin') && !['admin', 'super_admin'].includes(role)) {
      const url = request.nextUrl.clone();
      url.pathname = '/student/dashboard';
      return NextResponse.redirect(url);
    }

    if (path.startsWith('/student') && role !== 'student') {
      const url = request.nextUrl.clone();
      url.pathname = role === 'super_admin' ? '/super-admin/dashboard' : '/admin/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
