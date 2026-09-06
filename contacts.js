/* ============================================================
   contacts.js — Google People API integration
   ============================================================ */

const PEOPLE_API_BASE = "https://people.googleapis.com/v1/people/me/connections";

// Fields we request from the People API
const PERSON_FIELDS = [
  "names",
  "emailAddresses",
  "phoneNumbers",
  "photos"
].join(",");

/**
 * Fetches all of the authenticated user's contacts via the People API.
 * Uses the OAuth access token obtained during Google sign-in.
 *
 * @param {string} accessToken — Google OAuth access token (from signInWithGoogle())
 * @returns {Promise<Array<{name: string, email: string, phone: string, photoUrl: string}>>}
 */
export async function fetchContacts(accessToken) {
  const contacts = [];
  let pageToken = null;

  do {
    const url = buildUrl(pageToken);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const status  = response.status;

      // 403 = scope denied or People API not enabled
      if (status === 403 || status === 401) {
        throw new ContactAccessDeniedError(
          errBody?.error?.message || "Contact access was denied."
        );
      }

      throw new Error(
        `People API error ${status}: ${errBody?.error?.message || "Unknown error"}`
      );
    }

    const data = await response.json();
    const connections = data.connections || [];

    for (const person of connections) {
      contacts.push(parsePerson(person));
    }

    pageToken = data.nextPageToken || null;

  } while (pageToken);

  return contacts;
}

// ---- Helpers ----

function buildUrl(pageToken) {
  const params = new URLSearchParams({
    personFields: PERSON_FIELDS,
    pageSize: "1000"
  });
  if (pageToken) params.set("pageToken", pageToken);
  return `${PEOPLE_API_BASE}?${params.toString()}`;
}

/**
 * Extracts the fields we care about from a raw People API person resource.
 */
function parsePerson(person) {
  const name     = person.names?.[0]?.displayName     || "";
  const email    = person.emailAddresses?.[0]?.value  || "";
  const phone    = person.phoneNumbers?.[0]?.value    || "";
  const photoUrl = person.photos?.[0]?.url            || "";

  return { name, email, phone, photoUrl };
}

/**
 * Custom error type for when the user denies contact access.
 */
export class ContactAccessDeniedError extends Error {
  constructor(message) {
    super(message);
    this.name = "ContactAccessDeniedError";
  }
}
