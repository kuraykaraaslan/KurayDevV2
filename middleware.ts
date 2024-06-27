import { NextResponse, NextRequest } from 'next/server';

import routeLocalization from '@/middlewares/routeLocalization';
import routeProtection from '@/middlewares/routeProtection';

export async function middleware(request: NextRequest, response: NextResponse) {

  /*
  * Route protection middleware
  */
  const incomingPath = request.nextUrl.pathname;
  const localizedPath = routeLocalization(incomingPath);
  
  if (localizedPath !== incomingPath) {
    request.nextUrl.pathname = localizedPath;
    return NextResponse.redirect(request.nextUrl);
  }


  return;
}
