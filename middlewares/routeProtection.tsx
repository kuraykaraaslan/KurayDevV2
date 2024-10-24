import { NextRequest, NextResponse } from 'next/server';
import ServerAuthService from '../services/server/ServerAuthService';

const protectedRoutes = ['/api/auth/logout', '/api/auth/user'];

export default async function routeProtection(request: NextRequest) {

    if (!protectedRoutes.includes(request.nextUrl.pathname)) {
      return;
    }

    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return NextResponse.json({ message: 'MISSING_FIELDS' }, { status: 400 });
    }


    if (authHeader) {
      const authHeaderNoBearer = authHeader.replace('Bearer ', '');
      const user = await ServerAuthService.getUserFromSession(authHeaderNoBearer);
  
      if (!user) {
        return NextResponse.json({ message: 'UNAUTHORIZED' }, { status: 401 });
      }
  
      request.user = user;
    }

    return;

}
