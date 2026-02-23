import { NextRequest as OriginalNextRequest } from 'next/server'
import SafeUser from './types/SafeUser'

declare global {
    const THREE: typeof import('three');
    declare interface NextRequest extends OriginalNextRequest {
        user: SafeUser
    }

    interface Window {
        maplibregl?: any
        THREE?: any
        OrbitControls?: any
    }
} 