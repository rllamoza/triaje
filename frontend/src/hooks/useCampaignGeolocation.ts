import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '../api/client'

export interface CampaignGeoData {
  id: number
  code: string
  name: string
  location_name: string
  province: string | null
  department: string | null
  altitude_masl: number | null
  status: 'active' | 'planned' | 'closed'
  node_id: string | null
  starlink_active: boolean
  today_count: number
  stations_count: number
  latitude: number
  longitude: number
  start_date?: string | null
  end_date?: string | null
  distanceKm?: number
  distanceFormatted?: string
  isNearest?: boolean
}

export interface UserCoordinates {
  latitude: number
  longitude: number
  accuracy?: number
  source: 'gps' | 'simulated' | 'fallback'
  label?: string
}

export const PRESET_GEO_LOCATIONS = [
  {
    name: 'Urubamba, Valle Sagrado (Cusco)',
    latitude: -13.3039,
    longitude: -72.1158,
    desc: 'Cercano a Salón Comunal Rumichaca',
  },
  {
    name: 'Ilave, El Collao (Puno)',
    latitude: -16.0833,
    longitude: -69.6333,
    desc: 'Cercano a Centro Cívico Ilave',
  },
  {
    name: 'Pampas, Tayacaja (Huancavelica)',
    latitude: -12.3986,
    longitude: -74.8686,
    desc: 'Cercano a Hospital de Apoyo Tayacaja',
  },
  {
    name: 'Lima Este / Chosica',
    latitude: -11.9388,
    longitude: -76.7025,
    desc: 'Cercano a Centro de Salud Chosica',
  },
  {
    name: 'Lima Metropolitana (Centro)',
    latitude: -12.0464,
    longitude: -77.0428,
    desc: 'Sede Central de Operaciones',
  },
  {
    name: 'Arequipa (Ciudad)',
    latitude: -16.409,
    longitude: -71.5375,
    desc: 'Zona Sur Macro-Región',
  },
]

export const FALLBACK_CAMPAIGNS: CampaignGeoData[] = [
  {
    id: 1,
    code: 'CMP-2025-CUS-02',
    name: 'Cusco - Valle Sagrado 2025',
    location_name: 'Salón Comunal Rumichaca • Urubamba, Cusco (2,870 msnm)',
    province: 'Urubamba',
    department: 'Cusco',
    altitude_masl: 2870,
    status: 'active',
    node_id: 'CUS-VALLE-04',
    starlink_active: true,
    today_count: 142,
    stations_count: 4,
    latitude: -13.3039,
    longitude: -72.1158,
  },
  {
    id: 2,
    code: 'CMP-2025-PUN-01',
    name: 'Puno - Altiplano 2025',
    location_name: 'Centro Cívico Ilave • El Collao, Puno (3,850 msnm)',
    province: 'El Collao',
    department: 'Puno',
    altitude_masl: 3850,
    status: 'planned',
    node_id: 'PUN-ILAVE-02',
    starlink_active: false,
    today_count: 0,
    stations_count: 4,
    latitude: -16.0833,
    longitude: -69.6333,
  },
  {
    id: 3,
    code: 'CMP-2024-HVC-09',
    name: 'Huancavelica - Pampas',
    location_name: 'Hospital de Apoyo Tayacaja • Campaña Finalizada',
    province: 'Tayacaja',
    department: 'Huancavelica',
    altitude_masl: 3276,
    status: 'closed',
    node_id: 'HVC-PAMP-01',
    starlink_active: false,
    today_count: 0,
    stations_count: 4,
    latitude: -12.3986,
    longitude: -74.8686,
  },
  {
    id: 4,
    code: 'CMP-2025-LIM-05',
    name: 'Lima Este - Chosica 2025',
    location_name: 'Centro de Salud Chosica • Lurigancho, Lima (860 msnm)',
    province: 'Lima',
    department: 'Lima',
    altitude_masl: 860,
    status: 'active',
    node_id: 'LIM-CHOS-01',
    starlink_active: true,
    today_count: 88,
    stations_count: 4,
    latitude: -11.9388,
    longitude: -76.7025,
  },
]

/**
 * Fórmula de Haversine para cálculo de distancia geodésica exacta en kilómetros
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Radio medio de la Tierra en kilómetros
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function formatDistanceString(km: number): string {
  if (km < 1) {
    const meters = Math.round(km * 1000)
    return `${meters} m`
  }
  if (km < 10) {
    return `${km.toFixed(1)} km`
  }
  return `${Math.round(km)} km`
}

export function useCampaignGeolocation(initialSelectedId?: number) {
  const [campaigns, setCampaigns] = useState<CampaignGeoData[]>(FALLBACK_CAMPAIGNS)
  const [coords, setCoords] = useState<UserCoordinates | null>(null)
  const [geoStatus, setGeoStatus] = useState<
    'idle' | 'locating' | 'ready' | 'denied' | 'unavailable' | 'simulated'
  >('idle')
  const [geoMessage, setGeoMessage] = useState<string>('')
  const [selectedCampaignId, setSelectedCampaignId] = useState<number>(initialSelectedId ?? 1)
  const [hasUserManuallySelected, setHasUserManuallySelected] = useState<boolean>(false)

  // 1. Cargar catálogo de campañas públicas desde el backend (o fallback offline)
  useEffect(() => {
    let isMounted = true
    api
      .get('/auth/campaigns-public')
      .then((res) => {
        if (isMounted && Array.isArray(res.data) && res.data.length > 0) {
          setCampaigns(res.data)
        }
      })
      .catch(() => {
        // En caso de modo 100% offline o error de red, usamos el catálogo precargado
        if (isMounted) {
          setCampaigns(FALLBACK_CAMPAIGNS)
        }
      })
    return () => {
      isMounted = false
    }
  }, [])

  // 2. Función para solicitar geolocalización real del smartphone / navegador
  const requestSmartphoneLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoStatus('unavailable')
      setGeoMessage('Geolocalización no soportada por el navegador de este dispositivo.')
      return
    }

    setGeoStatus('locating')
    setGeoMessage('Sintonizando satélites GPS del smartphone...')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude
        const userLng = pos.coords.longitude
        const acc = Math.round(pos.coords.accuracy || 0)

        setCoords({
          latitude: userLat,
          longitude: userLng,
          accuracy: acc,
          source: 'gps',
          label: 'GPS Real del Dispositivo',
        })
        setGeoStatus('ready')
        setGeoMessage(`GPS Activo: ${userLat.toFixed(4)}, ${userLng.toFixed(4)} (±${acc}m)`)
      },
      (err) => {
        let msg = 'No se pudo obtener la posición del dispositivo.'
        if (err.code === 1) {
          msg = 'Permiso de ubicación denegado en el smartphone.'
          setGeoStatus('denied')
        } else if (err.code === 2) {
          msg = 'Señal de GPS del dispositivo no disponible.'
          setGeoStatus('unavailable')
        } else {
          msg = 'Tiempo de espera de GPS agotado.'
          setGeoStatus('unavailable')
        }
        setGeoMessage(msg)
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      }
    )
  }, [])

  // 3. Ejecutar detección GPS al cargar la pantalla
  useEffect(() => {
    requestSmartphoneLocation()
  }, [requestSmartphoneLocation])

  // 4. Función para simular ubicación GPS (útil para pruebas y brigadas en transición)
  const setSimulatedLocation = useCallback((preset: (typeof PRESET_GEO_LOCATIONS)[0]) => {
    setCoords({
      latitude: preset.latitude,
      longitude: preset.longitude,
      accuracy: 5,
      source: 'simulated',
      label: preset.name,
    })
    setGeoStatus('simulated')
    setGeoMessage(`Simulación: ${preset.name} (${preset.latitude}, ${preset.longitude})`)
    setHasUserManuallySelected(false)
  }, [])

  // 5. Calcular distancias de cada campaña respecto al smartphone y ordenar por cercanía
  const campaignsWithDistance = useMemo<CampaignGeoData[]>(() => {
    if (!coords) {
      return campaigns.map((c) => ({
        ...c,
        distanceKm: undefined,
        distanceFormatted: undefined,
        isNearest: false,
      }))
    }

    const calculated = campaigns.map((camp) => {
      const dist = calculateHaversineDistanceKm(
        coords.latitude,
        coords.longitude,
        camp.latitude,
        camp.longitude
      )
      return {
        ...camp,
        distanceKm: dist,
        distanceFormatted: formatDistanceString(dist),
      }
    })

    // Ordenar de menor a mayor distancia (la más cercana primero)
    calculated.sort((a, b) => (a.distanceKm ?? 999999) - (b.distanceKm ?? 999999))

    // Marcar la más cercana
    if (calculated.length > 0) {
      calculated[0].isNearest = true
    }

    return calculated
  }, [campaigns, coords])

  // Identificar la campaña más cercana calculada
  const nearestCampaign = useMemo(() => {
    return campaignsWithDistance.length > 0 ? campaignsWithDistance[0] : null
  }, [campaignsWithDistance])

  // 6. Auto-seleccionar automáticamente la campaña más cercana calculada si el usuario no ha forzado otra
  useEffect(() => {
    if (nearestCampaign && !hasUserManuallySelected) {
      setSelectedCampaignId(nearestCampaign.id)
    }
  }, [nearestCampaign, hasUserManuallySelected])

  // Campaña actualmente seleccionada
  const selectedCampaign = useMemo(() => {
    return (
      campaignsWithDistance.find((c) => c.id === selectedCampaignId) ||
      nearestCampaign ||
      campaignsWithDistance[0]
    )
  }, [campaignsWithDistance, selectedCampaignId, nearestCampaign])

  // Manejar selección manual por parte del usuario
  const handleSelectCampaign = useCallback((id: number) => {
    setSelectedCampaignId(id)
    setHasUserManuallySelected(true)
  }, [])

  // Volver a auto-seleccionar la más cercana
  const resetToNearest = useCallback(() => {
    if (nearestCampaign) {
      setSelectedCampaignId(nearestCampaign.id)
      setHasUserManuallySelected(false)
    }
  }, [nearestCampaign])

  return {
    campaigns: campaignsWithDistance,
    nearestCampaign,
    selectedCampaign,
    selectedCampaignId,
    selectCampaign: handleSelectCampaign,
    resetToNearest,
    coords,
    geoStatus,
    geoMessage,
    requestSmartphoneLocation,
    setSimulatedLocation,
    presetLocations: PRESET_GEO_LOCATIONS,
  }
}
