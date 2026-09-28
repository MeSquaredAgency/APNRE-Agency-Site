// Google Places address suggestions for the address fields (home hero
// search, appraisal and repair forms), via the Maps JavaScript API's
// Places library (the "Places API (New)" autocomplete).
//
// Only used when VITE_GOOGLE_MAPS_API_KEY is set; otherwise the fields
// are plain text boxes. Set up the key in Google Cloud with the Maps
// JavaScript API and Places API (New) enabled, and restrict it to the
// site's domains (see docs/google-maps.md). The key is public by design:
// it's in every visitor's browser, and the domain restriction is what
// protects it.
//
// Loaded on first use (the first time someone focuses an address field),
// so pages don't pay for Google's script unless it's needed.

export const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

/** The bits of the Places library this site uses. */
export interface PlacesLib {
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions(request: Record<string, unknown>): Promise<{ suggestions: Suggestion[] }>;
  };
  AutocompleteSessionToken: new () => object;
}

export interface Suggestion {
  placePrediction: {
    placeId: string;
    text: { toString(): string };
    mainText?: { toString(): string };
    secondaryText?: { toString(): string };
    toPlace(): { fetchFields(o: { fields: string[] }): Promise<unknown>; formattedAddress?: string };
  } | null;
}

declare global {
  interface Window {
    google?: { maps?: { importLibrary?: (name: string) => Promise<unknown> } };
    __apnMapsReady?: () => void;
  }
}

let loading: Promise<PlacesLib> | undefined;

export function loadPlaces(): Promise<PlacesLib> {
  loading ??= new Promise<void>((resolve, reject) => {
    if (window.google?.maps?.importLibrary) return resolve();
    window.__apnMapsReady = () => resolve();
    const script = document.createElement('script');
    const params = new URLSearchParams({
      key: MAPS_API_KEY,
      v: 'weekly',
      loading: 'async',
      language: 'en-AU',
      region: 'AU',
      callback: '__apnMapsReady',
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    script.async = true;
    script.onerror = () => reject(new Error('Google Maps failed to load'));
    document.head.appendChild(script);
  }).then(() => window.google!.maps!.importLibrary!('places') as Promise<PlacesLib>);
  // A failed load can be retried on the next focus.
  loading.catch(() => (loading = undefined));
  return loading;
}

/** Roughly South Australia's populated south-east, from Port Augusta to
 *  the Victorian border: suggestions here come first, but addresses
 *  elsewhere in Australia still appear. */
export const SA_BOUNDS = { south: -38.1, west: 135.5, north: -32.4, east: 141.0 };

/** "12 Main St, Blair Athol SA 5084, Australia" → without the country. */
export function tidyAddress(address: string): string {
  return address.replace(/,\s*Australia$/, '');
}
