const localizedIgnoreRoutes = ['/_next', '/assets', '/api', '/auth', '/backend', '/_error', '/_app', '/_document', '/_error' ];
const allowedLanguages = ['en', 'tr', 'th', 'de'];

export default function routeLocalization(pathname: string) {
  if (localizedIgnoreRoutes.some(route => pathname.startsWith(route))) {
    return pathname;
  }

  const isLocalized = allowedLanguages.some(lang => pathname.startsWith(`/${lang}`));

  if (isLocalized) {
    return pathname;
  }

  if (pathname === '/') {
    return '/en';
  }

  return `/en${pathname}`;
}