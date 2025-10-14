import { NextRequest, NextResponse } from 'next/server'
import redis from '@/libs/redis'
import UserAgentService from '@/services/UserAgentService'

const fakeData = [
    {
        "country": "Canada",
        "city": "Vancouver",
        "lat": 49.324653,
        "lon": -123.074377
    },
    {
        "country": "Netherlands",
        "city": "Amsterdam",
        "lat": 52.329496,
        "lon": 4.883021
    },
    {
        "country": "Netherlands",
        "city": "Amsterdam",
        "lat": 52.333052,
        "lon": 4.908964
    },
    {
        "country": "Italy",
        "city": "Rome",
        "lat": 41.857335,
        "lon": 12.521142
    },
    {
        "country": "Switzerland",
        "city": "Zurich",
        "lat": 47.368972,
        "lon": 8.559377
    },
    {
        "country": "Germany",
        "city": "Berlin",
        "lat": 52.551579,
        "lon": 13.372291
    }
]

export async function POST(request: NextRequest) {
    // 1️⃣ IP'yi al
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
    const { country, city, latitude, longitude } = await UserAgentService.getGeoLocationFromMaxMind(ip)

    // 2️⃣ Redis key: geo:{country}:{city}
    const key = `geo:${country || 'Unknown'}:${city || 'Unknown'}`
    await redis.hincrby(key, 'count', 1)
    await redis.hset(key, { lat: latitude, lon: longitude })

    return NextResponse.json({ ok: true })
}

export async function GET() {
    // 3️⃣ Tüm geo:* kayıtlarını tara
    const keys = await redis.keys('geo:*')
    const results = []
    for (const key of keys) {
        const [_, country, city] = key.split(':')
        const data = await redis.hgetall(key)

        //load fake data ./fakegeo.json if lat or lon is null
        if (!data.lat || !data.lon) {

            console.log('fakeData', fakeData);

            for (const fd of fakeData) {
                let _fd = { country: fd.country, city: fd.city, lat: "0", lon: "0" }
                _fd.lat = fd.lat.toString()
                _fd.lon = fd.lon.toString()
                results.push(_fd)
            }
        }

        results.push({
            country,
            city,
            lat: parseFloat(data.lat),
            lon: parseFloat(data.lon),
            count: parseInt(data.count),
        })
    }

    console.log('results', results);
    return NextResponse.json(fakeData   )
}
