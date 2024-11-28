// Import necessary modules from 'next/server'
import { NextResponse, NextRequest } from 'next/server'

// Define an array of supported locales
let locales = ['en', 'tr', 'gr']

// Function to determine the preferred locale based on Accept-Language header
function getLocale(request: NextRequest) {
  const acceptLanguage = request.headers.get('Accept-Language')
  const locale = acceptLanguage?.split(',').find((l) => locales.includes(l))
  console.log("selected locale: ", locale)
  return locale || 'en'
}


// Middleware function to handle locale redirection
export function middleware(request: NextRequest) {
  // Extract the pathname from the request URL
  const { pathname } = request.nextUrl
  // Check if the pathname contains a supported locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // If the pathname already contains a supported locale, return the request
  if (pathnameHasLocale) {
    return request
  }


  // Get the locale based on request headers
  const locale = getLocale(request)
  // Update the pathname with the selected locale
  request.nextUrl.pathname = `/${locale}${pathname}`
  // Redirect to the new URL with the chosen locale
  return NextResponse.redirect(request.nextUrl)
}

// Configuration object for middleware
export const config = {
  // Define paths to skip processing for the middleware
  matcher: [
    '/_next',
    '/api',
    '/backend',
    '/auth',
    '/_error',
    '/_app',
    '/_document',
    '/terminal',
    '/backend',
  ],
}
