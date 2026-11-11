import { useState, useEffect } from 'react'

export interface EnvironmentalData {
  altitude: number | null
  humidity: number | null
  temperature: number | null
  city: string | null
  region: string
  provincia: string
  locationText: string
  source: 'gps' | 'ip' | 'cache' | 'default'
  loading: boolean
}

const CACHE_KEY = 'semilla_environmental_telemetry_v2'
const DEFAULT_ALTITUDE = 2870 // Urubamba / Valle Sagrado default (msnm)
const DEFAULT_HUMIDITY = 45   // % de humedad
const DEFAULT_REGION = 'Cusco'
const DEFAULT_PROVINCIA = 'Urubamba'

function cleanName(str: string): string {
  return str
    .replace(/^(departamento\s+de\s+|regi[oó]n\s+de\s+|provincia\s+de\s+|provincia\s+|municipalidad\s+metropolitana\s+de\s+)/i, '')
    .trim()
}

function parseGeoLocation(geoJson: any): { region: string; provincia: string } {
  let reg = cleanName(geoJson.principalSubdivision || '')

  let prov = ''
  if (Array.isArray(geoJson.localityInfo?.administrative)) {
    const provObj = geoJson.localityInfo.administrative.find((a: any) =>
      a.adminLevel === 6 || /provincia/i.test(a.description || a.name || '')
    )
    if (provObj?.name) {
      prov = cleanName(provObj.name)
    }
  }

  if (!prov) {
    prov = cleanName(geoJson.city || geoJson.locality || '')
  }

  if (!reg) reg = DEFAULT_REGION
  if (!prov) prov = DEFAULT_PROVINCIA

  return { region: reg, provincia: prov }
}

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
          region: parsed.region || DEFAULT_REGION,
          provincia: parsed.provincia || DEFAULT_PROVINCIA,
          locationText: parsed.locationText || `${parsed.region || DEFAULT_REGION} - ${parsed.provincia || DEFAULT_PROVINCIA}`,
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
      region: DEFAULT_REGION,
      provincia: DEFAULT_PROVINCIA,
      locationText: `${DEFAULT_REGION} - ${DEFAULT_PROVINCIA}`,
      source: 'default',
      loading: true,
    }
  })

  useEffect(() => {
    let isMounted = true

    const fetchEnvironmentalAndGeo = async (
      lat: number,
      lon: number,
      preRegion?: string,
      preProvincia?: string,
      source: 'gps' | 'ip' = 'gps'
    ) => {
      try {
        let currentRegion = preRegion || DEFAULT_REGION
        let currentProvincia = preProvincia || DEFAULT_PROVINCIA

        // 1. Obtener Región y Provincia exacta mediante Reverse Geocoding
        try {
          const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=es`
          const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(5000) })
          if (geoRes.ok) {
            const geoJson = await geoRes.json()
            const parsed = parseGeoLocation(geoJson)
            if (parsed.region) currentRegion = parsed.region
            if (parsed.provincia) currentProvincia = parsed.provincia
          }
        } catch {}

        // 2. Obtener Altitud (msnm) y Humedad (%) mediante Open-Meteo
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=relative_humidity_2m,temperature_2m`
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
        if (!res.ok) throw new Error('Meteo HTTP error')
        const json = await res.json()

        const alt = typeof json.elevation === 'number' ? Math.round(json.elevation) : DEFAULT_ALTITUDE
        const hum = typeof json.current?.relative_humidity_2m === 'number' ? Math.round(json.current.relative_humidity_2m) : DEFAULT_HUMIDITY
        const temp = typeof json.current?.temperature_2m === 'number' ? Math.round(json.current.temperature_2m) : 19

        const locText = `${currentRegion} - ${currentProvincia}`

        if (isMounted) {
          const newData: EnvironmentalData = {
            altitude: alt,
            humidity: hum,
            temperature: temp,
            city: currentProvincia,
            region: currentRegion,
            provincia: currentProvincia,
            locationText: locText,
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
        let ipRegion = DEFAULT_REGION
        let ipProvincia = DEFAULT_PROVINCIA

        // Intento 1: freeipapi
        try {
          const ipRes = await fetch('https://freeipapi.com/api/json', { signal: AbortSignal.timeout(5000) })
          if (ipRes.ok) {
            const ipData = await ipRes.json()
            if (typeof ipData.latitude === 'number' && typeof ipData.longitude === 'number') {
              lat = ipData.latitude
              lon = ipData.longitude
              if (ipData.regionName) ipRegion = cleanName(ipData.regionName)
              if (ipData.cityName) ipProvincia = cleanName(ipData.cityName)
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
                if (ipData2.region) ipRegion = cleanName(ipData2.region)
                if (ipData2.city) ipProvincia = cleanName(ipData2.city)
              }
            }
          } catch {}
        }

        if (lat !== null && lon !== null) {
          const ok = await fetchEnvironmentalAndGeo(lat, lon, ipRegion, ipProvincia, 'ip')
          if (ok) return
        }
      } catch {}

      if (isMounted) {
        setData((prev) => ({ ...prev, loading: false }))
      }
    }

    // 1. Intentar Geolocation nativo del dispositivo (GPS)
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          await fetchEnvironmentalAndGeo(latitude, longitude, undefined, undefined, 'gps')
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
