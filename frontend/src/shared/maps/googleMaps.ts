/**
 * Google Maps JS API loader — script-tag based, no npm dependency. The key
 * comes from `VITE_GOOGLE_MAPS_API_KEY`; when it is absent the map picker
 * falls back to manual latitude/longitude fields, so Maps is an optional
 * enhancement rather than a hard requirement.
 *
 * Only the tiny surface we actually use is typed below (Map, Marker, Places
 * Autocomplete) — pulling in the full `@types/google.maps` for one picker
 * would be overkill.
 */

export interface LatLngLiteral {
  lat: number
  lng: number
}

/** Google's LatLng object (methods, not properties). */
export interface GLatLng {
  lat(): number
  lng(): number
}

export interface GMapMouseEvent {
  latLng: GLatLng | null
}

export interface GMap {
  setCenter(center: LatLngLiteral): void
  setZoom(zoom: number): void
  addListener(event: 'click', handler: (e: GMapMouseEvent) => void): void
}

export interface GMarker {
  setPosition(position: LatLngLiteral): void
  getPosition(): GLatLng | null
  setMap(map: GMap | null): void
  addListener(event: 'dragend', handler: () => void): void
}

export interface GAutocompletePlace {
  geometry?: { location?: GLatLng }
  formatted_address?: string
  name?: string
}

export interface GAutocomplete {
  addListener(event: 'place_changed', handler: () => void): void
  getPlace(): GAutocompletePlace
}

export interface GoogleMapsApi {
  Map: new (
    el: HTMLElement,
    opts: {
      center: LatLngLiteral
      zoom: number
      mapTypeControl?: boolean
      streetViewControl?: boolean
      fullscreenControl?: boolean
      clickableIcons?: boolean
    },
  ) => GMap
  Marker: new (opts: {
    map: GMap
    position: LatLngLiteral
    draggable?: boolean
  }) => GMarker
  places: {
    Autocomplete: new (
      input: HTMLInputElement,
      opts?: { fields?: string[] },
    ) => GAutocomplete
  }
}

interface MapsWindow extends Window {
  google?: { maps?: GoogleMapsApi }
  __uniemaxMapsReady?: () => void
}

export function mapsApiKey(): string | undefined {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
  return key && key.trim() ? key.trim() : undefined
}

/** Whether the map picker can be offered at all. */
export const hasMapsKey = (): boolean => Boolean(mapsApiKey())

let loader: Promise<GoogleMapsApi> | null = null

/**
 * Load the Maps JS API (with the Places library) once and share the promise.
 * Rejects when no key is configured or the script fails; a failed load resets
 * the singleton so a later attempt can retry.
 */
export function loadGoogleMaps(): Promise<GoogleMapsApi> {
  const key = mapsApiKey()
  if (!key) {
    return Promise.reject(new Error('Google Maps API key is not configured'))
  }
  if (!loader) {
    loader = new Promise<GoogleMapsApi>((resolve, reject) => {
      const w = window as MapsWindow
      if (w.google?.maps?.places) return resolve(w.google.maps)

      w.__uniemaxMapsReady = () => {
        if (w.google?.maps?.places) resolve(w.google.maps)
        else reject(new Error('Google Maps failed to initialise'))
      }
      const script = document.createElement('script')
      script.src =
        'https://maps.googleapis.com/maps/api/js' +
        `?key=${encodeURIComponent(key)}` +
        '&libraries=places&loading=async&callback=__uniemaxMapsReady'
      script.async = true
      script.onerror = () => {
        loader = null
        reject(new Error('Failed to load Google Maps — check the API key.'))
      }
      document.head.appendChild(script)
    })
  }
  return loader
}

/**
 * The public "View on Google Maps" link for a location. Uses the pinned
 * coordinates when the owner dropped a pin, otherwise falls back to an
 * address search — neither needs an API key.
 */
export function googleMapsLink(
  lat: number | null,
  lng: number | null,
  address?: string,
): string | null {
  if (lat !== null && lng !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  }
  if (address && address.trim()) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`
  }
  return null
}
