import { NextRequest, NextResponse } from 'next/server';
import AuthService from '../services/AuthService';
import prisma from '@/libs/prisma';

const protectedRoutes = ['/api/auth/logout', '/api/auth/user'];

export default async function routeProtection(request: NextRequest, response: NextResponse) {

    const path = request.nextUrl.pathname;

    const authHeader = request.headers.get('Authorization');

    if (authHeader) {
      const authHeaderNoBearer = authHeader.replace('Bearer ', '');
          
      await prisma.session.findFirst({
        where: {
          sessionToken: authHeaderNoBearer,
        },
        select: {
          sessionToken: true,
          userId: true,
          expires: true,
          user: {
            select: {
              userId: true,
              name: true,
              email: true,
              phone: true,
              role: true,
            },
          },
        },
      }).then((session) => {
        return;
      });


    }

    return;

}
