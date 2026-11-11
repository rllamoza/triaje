import { useState, useEffect } from 'react'

export interface EnvironmentalData {
  altitude: number | null
  humidity: number | null
  temperature: number | null
  city: string | null
  source: 'gps' | 'ip' | 'cache' | 'default'
  loading: boolean
}

const CACHE_KEY = 'semilla_environmental_telemetry_v1'
const DEFAULT_ALTITUDE = 2870 // Urubamba / Valle Sagrado default (msnm)
const DEFAULT_HUMIDITY = 45   // % de humedad

export function useEnvironmentalData(): EnvironmentalData {
  // Inicializar con valores cacheados o por defecto
  const [data, setData] = useState<EnvironmentalData>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        return {
          altitude: parsed.altitude ?? DEFAULT_ALTITUDE,
          humidity: parsed.humidity ?? DEFAULT_HUMIDITY,
          temperature: parsed.temperature ?? 19,
          city: parsed.city ?? 'Cusco',
          source: 'cache',
          loading: true,
        }
      }
    } catch {}
    return {
      altitude: DEFAULT_ALTITUDE,
      humidity: DEFAULT_HUMIDITY,
      temperature: 19,
      city: 'Cusco (Valle Sagrado)',
      source: 'default',
      loading: true,
    }
  })

  useEffect(() => {
    let isMounted = true

    const fetchEnvironmental = async (lat: number, lon: number, cityName?: string, source: 'gps' | 'ip' = 'gps') => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=relative_humidity_2m,temperature_2m`
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
        if (!res.ok) throw new Error('Meteo HTTP error')
        const json = await res.json()

        const alt = typeof json.elevation === 'number' ? Math.round(json.elevation) : DEFAULT_ALTITUDE
        const hum = typeof json.current?.relative_humidity_2m === 'number' ? Math.round(json.current.relative_humidity_2m) : DEFAULT_HUMIDITY
        const temp = typeof json.current?.temperature_2m === 'number' ? Math.round(json.current.temperature_2m) : 19

        if (isMounted) {
          const newData: EnvironmentalData = {
            altitude: alt,
            humidity: hum,
            temperature: temp,
            city: cityName || (source === 'gps' ? 'Ubicación GPS' : 'Red Local'),
            source,
            loading: false,
          }
          setData(newData)
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(newData))
          } catch {}
        }
        return true
      } catch (err) {
        return false
      }
    }

    const tryIpGeolocation = async () => {
      try {
        let lat: number | null = null
        let lon: number | null = null
        let city = ''

        // Intento 1: freeipapi
        try {
          const ipRes = await fetch('https://freeipapi.com/api/json', { signal: AbortSignal.timeout(5000) })
          if (ipRes.ok) {
            const ipData = await ipRes.json()
            if (typeof ipData.latitude === 'number' && typeof ipData.longitude === 'number') {
              lat = ipData.latitude
              lon = ipData.longitude
              city = ipData.cityName || ipData.regionName || ''
            }
          }
        } catch {}

        // Intento 2: ipapi.co
        if (lat === null) {
          try {
            const ipRes2 = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(5000) })
            if (ipRes2.ok) {
              const ipData2 = await ipRes2.json()
              if (typeof ipData2.latitude === 'number' && typeof ipData2.longitude === 'number') {
                lat = ipData2.latitude
                lon = ipData2.longitude
                city = ipData2.city || ipData2.region || ''
              }
            }
          } catch {}
        }

        if (lat !== null && lon !== null) {
          const ok = await fetchEnvironmental(lat, lon, city, 'ip')
          if (ok) return
        }
      } catch {}

      // Si todo falla o está offline, mantener valores actuales
      if (isMounted) {
        setData((prev) => ({ ...prev, loading: false }))
      }
    }

    // 1. Intentar Geolocation del navegador
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, altitude } = position.coords
          if (typeof altitude === 'number' && altitude > 0) {
            await fetchEnvironmental(latitude, longitude, 'GPS de Alta Precisión', 'gps')
          } else {
            await fetchEnvironmental(latitude, longitude, 'GPS del Dispositivo', 'gps')
          }
        },
        async () => {
          await tryIpGeolocation()
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 300000 }
      )
    } else {
      tryIpGeolocation()
    }

    return () => {
      isMounted = false
    }
  }, [])

  return data
}
