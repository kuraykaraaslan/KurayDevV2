// Original path: app/api/auth/callback/route.ts

import NextRequest from "@/types/NextRequest";
import { NextResponse } from "next/server";
import AuthService from "@/services/AuthService";
import SSOService from "@/services/SSOService";
import MailService from "@/services/MailService";

export async function GET(request: NextRequest, 
  { params }: { params: { provider: string } }) {

    try {
        const { provider } = params;
       
        const searchParams = request.nextUrl.searchParams;

        const code = searchParams.get('code');
        const state = searchParams.get('state');
  
      if (!code) {
          //redirect to frontend
          NextResponse.redirect(process.env.APPLICATION_HOST + '/auth/login?error=Missing code');
      }
  
      const user = await SSOService.authCallback(provider, code as string, state as string);
  
      if (!user) {
          //redirect to frontend
         
      }
  
      const {session} = await AuthService.createSession(user);
  
      MailService.sendWelcomeEmail(user);
  
      if (!session) {
          //redirect to frontend
          return NextResponse.redirect(`${process.env.APPLICATION_HOST}/auth/login?error=Failed to create session`);
      }
  
      //redirect to frontend
      return NextResponse.redirect(`${process.env.APPLICATION_HOST}/auth/callback?token=${session.sessionToken}`);
     
      } catch (error: any) {
        
        return NextResponse.redirect(process.env.APP_URL + '/auth/login?error=' + error.message);

      
    }
}



// POST VERSION OF THE SAME FUNCTION ABOVE
export async function POST(request: NextRequest, 
    { params }: { params: { provider: string } }) {
  
      try {
          const { provider } = params;

          const { code, state } = await request.json();
         
        if (!code) {
            //redirect to frontend
            NextResponse.redirect(process.env.APPLICATION_HOST + '/auth/login?error=Missing code');
        }
    
        const user = await SSOService.authCallback(provider, code as string, state as string);
    
        if (!user) {
            //redirect to frontend
           
        }
    
        const {session} = await AuthService.createSession(user);
    
        MailService.sendWelcomeEmail(user);
    
        if (!session) {
            //redirect to frontend
            return NextResponse.redirect(`${process.env.APPLICATION_HOST}/auth/login?error=Failed to create session`);
        }
    
        //redirect to frontend
        return NextResponse.redirect(`${process.env.APPLICATION_HOST}/auth/callback?token=${session.sessionToken}`);
       
        } catch (error: any) {
          
          return NextResponse.redirect(process.env.APPLICATION_HOST + '/auth/login?error=' + error.message);
  
        
      }
  }
  
  
  