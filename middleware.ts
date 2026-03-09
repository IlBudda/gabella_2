import { auth } from './auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard') || 
                        req.nextUrl.pathname.startsWith('/parti') ||
                        req.nextUrl.pathname.startsWith('/prodotti') ||
                        req.nextUrl.pathname.startsWith('/fornitori') ||
                        req.nextUrl.pathname.startsWith('/vendite') ||
                        req.nextUrl.pathname.startsWith('/report') ||
                        req.nextUrl.pathname.startsWith('/utenti');
  
  if (isOnDashboard) {
    if (!isLoggedIn) return Response.redirect(new URL('/login', req.nextUrl));
    return;
  } else if (isLoggedIn && req.nextUrl.pathname === '/login') {
    return Response.redirect(new URL('/dashboard', req.nextUrl));
  }
  return;
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
