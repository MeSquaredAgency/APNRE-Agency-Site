import { useEffect, useId, useRef, useState, type InputHTMLAttributes } from 'react';
import { loadPlaces, MAPS_API_KEY, SA_BOUNDS, tidyAddress, type PlacesLib, type Suggestion } from '../lib/places';

// An address text box with Google's address suggestions under it, as an
// ARIA combobox: type to see suggestions, Up/Down to move, Enter to pick,
// Escape to close. Picking one fills in Google's full formatted address
// (with the postcode), so the address that reaches the sheet is one
// Google can find. Without VITE_GOOGLE_MAPS_API_KEY, or if Google's
// script can't load, it's a plain text box and nothing else changes.

interface AddressInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange' | 'type'> {
  /** Starting text, e.g. the address typed into the home hero. */
  defaultValue?: string;
  /** Every change, typed or picked. */
  onChange?: (value: string) => void;
  /** 'dark' for the home hero's translucent bar. */
  tone?: 'light' | 'dark';
}

const MIN_CHARS = 3;
const DEBOUNCE_MS = 200;

interface Option {
  id: string;
  main: string;
  secondary: string;
  prediction: NonNullable<Suggestion['placePrediction']>;
}

export default function AddressInput({ defaultValue = '', onChange, tone = 'light', className, ...inputProps }: AddressInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [options, setOptions] = useState<Option[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const lib = useRef<PlacesLib>();
  // Flips once Google's library has loaded, so text typed while it was
  // loading gets suggestions straight away.
  const [ready, setReady] = useState(false);
  const session = useRef<object>();
  const request = useRef(0);
  const listId = useId();
  const enabled = Boolean(MAPS_API_KEY);

  const update = (next: string) => {
    setValue(next);
    onChange?.(next);
  };

  // Fetch suggestions shortly after typing stops. Each request is
  // numbered so a slow earlier reply can't overwrite a newer one.
  useEffect(() => {
    if (!enabled || !ready || !lib.current || value.trim().length < MIN_CHARS || !open) {
      if (value.trim().length < MIN_CHARS) setOptions([]);
      return;
    }
    const id = ++request.current;
    const timer = setTimeout(async () => {
      try {
        session.current ??= new lib.current!.AutocompleteSessionToken();
        const { suggestions } = await lib.current!.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: value,
          sessionToken: session.current,
          includedRegionCodes: ['au'],
          locationBias: SA_BOUNDS,
          language: 'en-AU',
        });
        if (id !== request.current) return;
        setOptions(
          suggestions
            .map((s) => s.placePrediction)
            .filter((p): p is Option['prediction'] => Boolean(p))
            .slice(0, 5)
            .map((p) => ({
              id: p.placeId,
              main: p.mainText?.toString() ?? p.text.toString(),
              secondary: tidyAddress(p.secondaryText?.toString() ?? ''),
              prediction: p,
            })),
        );
        setActive(-1);
      } catch (err) {
        console.warn('Address suggestions failed:', err);
        setOptions([]);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, open, enabled, ready]);

  function startLoading() {
    if (!enabled || lib.current) return;
    loadPlaces()
      .then((l) => {
        lib.current = l;
        setReady(true);
      })
      .catch((err) => console.warn(err));
  }

  async function pick(option: Option) {
    setOpen(false);
    setOptions([]);
    update(tidyAddress(option.prediction.text.toString()));
    try {
      // Swap in the full formatted address, which has the postcode the
      // suggestion text leaves out. This also ends the billing session.
      const place = option.prediction.toPlace();
      await place.fetchFields({ fields: ['formattedAddress'] });
      if (place.formattedAddress) update(tidyAddress(place.formattedAddress));
    } catch (err) {
      console.warn('Address lookup failed:', err);
    } finally {
      session.current = undefined;
    }
  }

  const showList = enabled && open && options.length > 0;
  // Announced by screen readers when suggestions arrive, since focus
  // stays in the text box.
  const announcement = showList
    ? `${options.length} address ${options.length === 1 ? 'suggestion' : 'suggestions'}. Use the up and down arrows to choose.`
    : '';

  return (
    <div className={`address-input address-input--${tone}`}>
      <input
        {...inputProps}
        className={className}
        type="text"
        value={value}
        onChange={(e) => {
          update(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          startLoading();
          setOpen(true);
        }}
        // Close after a click on an option has had time to register.
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!showList) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((i) => (i + 1) % options.length);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((i) => (i <= 0 ? options.length - 1 : i - 1));
          } else if (e.key === 'Enter' && active >= 0) {
            e.preventDefault();
            void pick(options[active]);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
        {...(enabled
          ? {
              role: 'combobox',
              'aria-autocomplete': 'list' as const,
              'aria-expanded': showList,
              'aria-controls': listId,
              'aria-activedescendant': showList && active >= 0 ? `${listId}-${active}` : undefined,
              // Browser autofill would cover the suggestions.
              autoComplete: 'off',
            }
          : {})}
      />
      {enabled && (
        <p className="visually-hidden" role="status">
          {announcement}
        </p>
      )}
      {enabled && (
        <div className="address-input__panel" hidden={!showList}>
          <ul id={listId} role="listbox" aria-label="Address suggestions" className="address-input__list">
            {options.map((o, i) => (
              <li
                key={o.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                className="address-input__option"
                // mousedown, not click, so it fires before the input blurs.
                onMouseDown={(e) => {
                  e.preventDefault();
                  void pick(o);
                }}
                onMouseEnter={() => setActive(i)}
              >
                <span className="address-input__main">{o.main}</span>
                {o.secondary && <span className="address-input__secondary">{o.secondary}</span>}
              </li>
            ))}
          </ul>
          {/* Google's terms require this wherever its suggestions show
              without a Google map. */}
          <p className="address-input__credit">Powered by Google</p>
        </div>
      )}
    </div>
  );
}
