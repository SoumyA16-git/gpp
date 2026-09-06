# PRD — Google Contact Import Web App

## 1. Objective

Build a minimal, clean, production-quality website with one primary purpose:

**Allow a user to sign in with Google, explicitly authorize contact access, import their Google Contacts, store the permitted contact data as JSON, and redirect the user to a configured YouTube channel.**

An authenticated admin must be able to sign in with their designated Google account and view/download the stored JSON data.

Do not add any other product features.

---

## 2. User Experience

### Landing Page

Create a completely clean white page with a minimal centered layout.

The page should contain:

- Simple heading
- Short explanation that Google sign-in is required
- Official-looking **Sign in with Google** button using Google's official Google Identity Services implementation
- No unnecessary navigation
- No dashboard
- No distracting animations

The visual design should feel polished, trustworthy, minimal, and intentionally designed—not like a generic AI-generated template.

---

## 3. Google Authentication

Use:

- Firebase Authentication
- Google provider
- Google Identity Services where appropriate for the official Google sign-in experience

After successful authentication, determine whether the authenticated Google account is the designated admin account.

There must be exactly two user paths:

### Normal User

```text
Sign in with Google
        ↓
Google contact-access consent
        ↓
Import permitted contacts
        ↓
Store data as JSON
        ↓
Redirect to configured YouTube URL
```

### Admin

```text
Sign in with Google
        ↓
Authenticate admin
        ↓
Open Admin view
        ↓
View stored JSON contact records
        ↓
Download JSON
```

---

## 4. Google Contacts Access

Use Google's official OAuth/People API mechanism for accessing contacts.

Required behavior:

- Request only the minimum contact-related permission required.
- Never attempt to bypass Google's consent mechanism.
- Do not attempt to access the user's device/local phone contacts.
- Do not access Gmail emails, Drive files, Calendar, or unrelated Google data.
- Contact access must occur only after the user has authorized it.

If the user denies contact access:

- Do not collect contacts.
- Show a simple error/instruction message.
- Do not redirect as if the import succeeded.

---

## 5. Contact Data

Retrieve only the contact information required for the application.

Store the resulting data in structured JSON.

Example structure:

```json
{
  "user": {
    "googleId": "USER_GOOGLE_ID",
    "email": "USER_EMAIL",
    "name": "USER_NAME"
  },
  "contacts": [
    {
      "name": "Contact Name",
      "email": "contact@example.com",
      "phone": "+91XXXXXXXXXX"
    }
  ],
  "importedAt": "ISO_TIMESTAMP"
}
```

The implementation may adjust the exact schema according to the fields actually returned by Google's People API.

Do not store unnecessary Google account information or unrelated profile data.

---

## 6. Firebase Database

Use **Cloud Firestore**.

Each authenticated user should have a separate record.

Recommended structure:

```text
users/
    USER_GOOGLE_ID/
        profile
        contacts
        importedAt
```

Or an equivalent secure structure.

The important requirement is:

**Contacts belonging to User A must remain logically separated from User B.**

Do not expose one user's contacts to another user.

---

## 7. Admin Access

There is only **one designated admin Google account**.

The admin account identifier should be configured securely rather than exposed as a casually editable frontend setting.

When the admin signs in:

- Show an admin-only interface.
- Display imported users/contact datasets.
- Allow viewing the JSON.
- Allow downloading JSON.
- Allow downloading individual user datasets.
- Do not expose this interface to normal users.

Normal users must never be able to query or download other users' contact data.

Enforce authorization through Firebase Security Rules/server-side security—not only frontend JavaScript checks.

---

## 8. Normal User Redirect

After successful contact import:

```text
Google Sign-In
      ↓
Contact authorization
      ↓
Contact import
      ↓
JSON successfully saved
      ↓
Redirect to YouTube
```

The YouTube destination must be configurable through one clearly defined configuration value.

Example:

```javascript
const YOUTUBE_URL = "YOUR_YOUTUBE_CHANNEL_URL";
```

Do not hard-code unrelated URLs throughout the application.

If contact import fails, do not falsely show a successful completion state.

---

## 9. Security Requirements

Implement:

- Firebase Authentication
- Firestore Security Rules
- Admin-only authorization
- HTTPS
- No Google OAuth client secrets in frontend code
- No service-account credentials in frontend code
- No unrestricted Firestore reads/writes
- Users cannot access other users' records
- Users cannot access admin data
- Admin authorization cannot depend solely on a hidden frontend button
- Request only necessary Google OAuth scopes

Do not log complete contact lists into browser console or server logs.

---

## 10. Technology

Keep the stack minimal.

Preferred:

```text
Frontend
HTML / CSS / JavaScript
        +
Firebase Authentication
        +
Cloud Firestore
        +
Google People API
```

Avoid unnecessary frameworks, databases, APIs, analytics systems, or third-party services.

Do not add:

- User profiles
- Messaging
- Search
- Notifications
- Payments
- CRM
- Analytics dashboard
- Chat
- Email marketing
- Social login other than Google
- Unrelated admin functionality

---

## 11. Required Screens

Only create these screens:

### Screen 1 — Sign In

Clean white page with:

- App title
- Short privacy/permission explanation
- Google Sign-In button

### Screen 2 — Contact Authorization / Import

Minimal loading/progress state while authorized contacts are being retrieved and saved.

### Screen 3 — Import Result

Success:

> Contacts imported successfully.

Then redirect to the configured YouTube channel.

Failure:

> We couldn't import your contacts. Please authorize contact access and try again.

### Screen 4 — Admin

Only visible/accessible to the designated admin.

Include:

- Imported users
- Number of contacts per user
- Import timestamp
- JSON viewer
- Download JSON button

Nothing else.

---

## 12. Privacy & Consent

Before requesting contact access, clearly explain:

- Why contacts are being accessed
- What contact information will be imported
- That Google will ask for permission
- How the imported data is stored

Never make contact collection invisible or misleading.

The application must respect Google's OAuth consent and applicable Google API policies.

---

## 13. Definition of Done

The project is complete only when:

- [ ] Clean white landing page exists.
- [ ] Official Google sign-in flow works.
- [ ] Firebase Authentication works.
- [ ] Google contact authorization is requested correctly.
- [ ] Authorized Google Contacts can be retrieved.
- [ ] Contacts are stored as structured JSON data in Firestore.
- [ ] Each user's data is isolated.
- [ ] Only the designated admin can access the admin interface.
- [ ] Admin can view JSON data.
- [ ] Admin can download JSON data.
- [ ] Normal users cannot access admin data.
- [ ] Successful users are redirected to the configured YouTube URL.
- [ ] Denied/failed contact authorization is handled correctly.
- [ ] No unnecessary features or pages are added.

---

## Core Principle

**Keep the application extremely small.**

The entire product exists only for:

**Google Sign-In → User-authorized Google Contacts import → Secure JSON storage → Admin-only access → YouTube redirect.**

Do not expand the scope beyond this functionality.
