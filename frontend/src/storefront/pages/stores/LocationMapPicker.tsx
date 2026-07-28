import { useEffect, useRef, useState } from 'react'
import {
  hasMapsKey,
  loadGoogleMaps,
  type GAutocomplete,
  type GMap,
  type GMarker,
  type LatLngLiteral,
} from '../../../shared/maps/googleMaps'
import { InfoNote } from '../../../shared/ui/form'
import { SearchIcon } from '../../layout/icons'

/**
 * Map picker for a footer business location. With a Maps API key configured
 * (`VITE_GOOGLE_MAPS_API_KEY`) it renders a Places search box + a click/drag
 * pinnable map and reports the pinned coordinates; without one it degrades to
 * plain latitude/longitude inputs, so the feature never blocks on the key.
 */

/** Fallback map center when there is no pin yet (country-level view). */
const DEFAULT_CENTER: LatLngLiteral = { lat: 20.5937, lng: 78.9629 }
const DEFAULT_ZOOM = 4
const PINNED_ZOOM = 16

export function LocationMapPicker({
  value,
  onChange,
}: {
  value: LatLngLiteral | null
  onChange: (position: LatLngLiteral | null) => void
}) {
  if (!hasMapsKey()) {
    return <ManualCoordinates value={value} onChange={onChange} />
  }
  return <MapCanvas value={value} onChange={onChange} />
}

function MapCanvas({
  value,
  onChange,
}: {
  value: LatLngLiteral | null
  onChange: (position: LatLngLiteral | null) => void
}) {
  const mapElRef = useRef<HTMLDivElement>(null)
  const searchElRef = useRef<HTMLInputElement>(null)
  const mapRef = useRef<GMap | null>(null)
  const markerRef = useRef<GMarker | null>(null)
  const makeMarkerRef = useRef<((pos: LatLngLiteral) => void) | null>(null)
  // Keep the latest callback/value without re-initialising the map.
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const initialValueRef = useRef(value)

  const [failed, setFailed] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapElRef.current || !searchElRef.current) return

        const start = initialValueRef.current
        const map = new maps.Map(mapElRef.current, {
          center: start ?? DEFAULT_CENTER,
          zoom: start ? PINNED_ZOOM : DEFAULT_ZOOM,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
        })
        mapRef.current = map

        const place = (position: LatLngLiteral) => {
          if (markerRef.current) {
            markerRef.current.setPosition(position)
          } else {
            const marker = new maps.Marker({
              map,
              position,
              draggable: true,
            })
            marker.addListener('dragend', () => {
              const dragged = marker.getPosition()
              if (dragged) {
                onChangeRef.current({ lat: dragged.lat(), lng: dragged.lng() })
              }
            })
            markerRef.current = marker
          }
        }
        makeMarkerRef.current = place
        if (start) place(start)

        map.addListener('click', (e) => {
          if (!e.latLng) return
          const position = { lat: e.latLng.lat(), lng: e.latLng.lng() }
          place(position)
          onChangeRef.current(position)
        })

        const autocomplete: GAutocomplete = new maps.places.Autocomplete(
          searchElRef.current,
          { fields: ['geometry', 'name', 'formatted_address'] },
        )
        autocomplete.addListener('place_changed', () => {
          const location = autocomplete.getPlace().geometry?.location
          if (!location) return
          const position = { lat: location.lat(), lng: location.lng() }
          map.setCenter(position)
          map.setZoom(PINNED_ZOOM)
          place(position)
          onChangeRef.current(position)
        })

        setReady(true)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setFailed(err instanceof Error ? err.message : 'Failed to load Google Maps')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  // External resets (e.g. "Remove pin") — mirror the value onto the marker.
  useEffect(() => {
    if (!ready) return
    if (value) {
      makeMarkerRef.current?.(value)
      mapRef.current?.setCenter(value)
    } else if (markerRef.current) {
      markerRef.current.setMap(null)
      markerRef.current = null
    }
  }, [value, ready])

  if (failed) {
    return (
      <div className="space-y-3">
        <InfoNote>{failed}</InfoNote>
        <ManualCoordinates value={value} onChange={onChange} />
      </div>
    )
  }

  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted">
          <SearchIcon className="h-4 w-4" />
        </span>
        <input
          ref={searchElRef}
          type="text"
          placeholder="Search for your business location…"
          className="h-11 w-full rounded-md border border-line bg-input pl-10 pr-4 text-sm text-fg outline-none transition-colors placeholder:text-muted hover:border-fg/30 focus:border-accent"
          // Prevent the location form from submitting when a place is picked
          // with Enter inside the autocomplete dropdown.
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault()
          }}
        />
      </div>
      <div
        ref={mapElRef}
        className="mt-2 h-64 w-full overflow-hidden rounded-md border border-line bg-surface-alt"
      />
      <div className="mt-1.5 flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {value
            ? `Pinned at ${value.lat.toFixed(6)}, ${value.lng.toFixed(6)} — drag the pin to fine-tune.`
            : 'Search above or tap the map to pin your exact business location.'}
        </p>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="shrink-0 text-xs font-semibold text-danger transition hover:opacity-80"
          >
            Remove pin
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * No API key (or Maps failed to load): the owner can still store coordinates
 * by typing them — copied from any maps app — so nothing is blocked.
 */
function ManualCoordinates({
  value,
  onChange,
}: {
  value: LatLngLiteral | null
  onChange: (position: LatLngLiteral | null) => void
}) {
  const [lat, setLat] = useState(value ? String(value.lat) : '')
  const [lng, setLng] = useState(value ? String(value.lng) : '')

  const apply = (nextLat: string, nextLng: string) => {
    setLat(nextLat)
    setLng(nextLng)
    const latNum = Number(nextLat)
    const lngNum = Number(nextLng)
    const valid =
      nextLat.trim() !== '' &&
      nextLng.trim() !== '' &&
      Number.isFinite(latNum) &&
      Number.isFinite(lngNum) &&
      Math.abs(latNum) <= 90 &&
      Math.abs(lngNum) <= 180
    onChange(valid ? { lat: latNum, lng: lngNum } : null)
  }

  return (
    <div>
      <p className="mb-2 text-xs text-muted">
        Map search is unavailable (no Google Maps API key configured). Paste
        the coordinates from Google Maps instead — right-click a spot on the
        map and copy the numbers.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-muted">
            Latitude
          </span>
          <input
            value={lat}
            onChange={(e) => apply(e.target.value, lng)}
            inputMode="decimal"
            placeholder="9.9312"
            className="h-11 w-full rounded-md border border-line bg-input px-3.5 text-sm text-fg outline-none transition-colors placeholder:text-muted hover:border-fg/30 focus:border-accent"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-muted">
            Longitude
          </span>
          <input
            value={lng}
            onChange={(e) => apply(lat, e.target.value)}
            inputMode="decimal"
            placeholder="76.2673"
            className="h-11 w-full rounded-md border border-line bg-input px-3.5 text-sm text-fg outline-none transition-colors placeholder:text-muted hover:border-fg/30 focus:border-accent"
          />
        </label>
      </div>
    </div>
  )
}
