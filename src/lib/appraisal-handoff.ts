// Carries the address typed into the home hero over to /appraisal/.
// Session storage rather than a query string, so a home address never
// ends up in URLs, analytics page views or server logs.

const KEY = 'apn:appraisal-address';

export type AppraisalType = 'sales' | 'rental';

export function saveAppraisalAddress(address: string) {
  try {
    sessionStorage.setItem(KEY, address);
  } catch {
    // Storage blocked (private mode etc.): the form just starts empty.
  }
}

/** Side-effect free, so it's safe as a useState initialiser (which
 *  StrictMode calls twice). Call clearAppraisalAddress() once it's used. */
export function readAppraisalAddress(): string {
  try {
    return sessionStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

export function clearAppraisalAddress() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
