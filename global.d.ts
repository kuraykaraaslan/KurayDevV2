import { NextRequest as OriginalNextRequest } from 'next/server'
import SafeUser from './types/SafeUser'

declare global {
  
  declare interface NextRequest extends OriginalNextRequest {
    user: SafeUser
  }
}
