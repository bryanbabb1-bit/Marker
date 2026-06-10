# Foretera — Release / Beta Checklist (TestFlight + Google Play)

App: **Foretera** · bundle/package **com.bryanbabb.quell** (kept; users never see it)
EAS project: `@true-forecast/quell` (projectId 89031ab0-…) · slug `quell` (internal)
Backend: Cloudflare Worker `match-play-api.bryan-babb1.workers.dev` (D1 live)

> Code/config is ready to build. The remaining items are account-level steps that
> need Bryan's Apple / Google / Clerk logins, plus the logo assets.

---

## 0. Assets & accounts (do first)

- [x] **App icon / splash / adaptive icon** — DONE. Built from the Foretera logo
      (`app/assets/icon.png`, `splash.png`, `adaptive-icon.png`) and wired in
      app.json (icon + expo-splash-screen image + android.adaptiveIcon, brand navy
      `#050E1B`). Takes effect on the next build.
- [ ] **Privacy policy URL** — both stores require one. Host a simple page (even a
      Notion/GitHub Pages doc) covering: account email, profile photo, handicap,
      match data; no selling data; how to delete an account.
- [ ] **Apple Developer Program** — already active (used for the dev build, team R8R2L8WM46).
- [ ] **Google Play Console** — one-time $25 signup at play.google.com/console (needed for Android).
- [ ] **(Recommended) Production Clerk instance** — eas.json currently ships the
      `pk_test_…` (development) Clerk key. Fine for a small internal beta, but for a
      real beta create a Clerk **production** instance, then Claude swaps the
      `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (pk_live_…) in eas.json preview/production
      and sets the matching `CLERK_SECRET_KEY` on the Worker.

## 1. iOS — TestFlight

1. **App Store Connect → create app**: appstoreconnect.apple.com → My Apps → + →
   New App. Platform iOS, Name **Foretera** (if taken, "Foretera Golf"), primary
   language, bundle ID **com.bryanbabb.quell**, SKU `foretera`.
2. **Build** (Claude can run): in `app/`
   `eas build --profile production --platform ios`
   (reuses the existing distribution cert + provisioning; autoIncrements build #).
3. **Submit** (Claude can run): `eas submit --profile production --platform ios`
   → pick the build → it uploads to App Store Connect. (First time it asks for the
   Apple ID / app-specific password or an ASC API key.)
4. **TestFlight tab** → once processed (~5–15 min), add **Internal Testers** (up to
   100, no review) by email. They install the TestFlight app + accept the invite.
   External testers (up to 10k) need a quick Beta App Review.
5. Fill TestFlight **Test Information** (what to test, contact email) — required to
   invite testers.

## 2. Android — Internal Testing

1. **Play Console → create app**: name **Foretera**, default language, app/free,
   declarations.
2. **Build** (Claude can run): `eas build --profile production --platform android`
   → produces an **.aab** (EAS generates + stores the upload keystore).
3. **Submit**: `eas submit --profile production --platform android`. First time this
   needs a **Google service-account JSON** with Play access:
   Play Console → Setup → API access → create/link a service account → grant
   "Release to testing tracks" → download the JSON → Claude references it in
   eas.json `submit.production.android.serviceAccountKeyPath` (store the JSON
   OUTSIDE git). Alternatively, upload the first .aab to **Internal testing**
   manually in the Play Console.
4. **Internal testing track** → create a release → add testers (email list) → share
   the opt-in link.
5. Complete the Play **Data safety** form + content rating questionnaire (uses the
   privacy policy from step 0).

## 3. What Claude has already configured

- `app.json`: display name **Foretera**, bundle/package `com.bryanbabb.quell`,
  `ITSAppUsesNonExemptEncryption: false` (skips the export-compliance prompt),
  new-arch on, dark UI, plugins (router/secure-store/notifications/image-picker/
  splash/screen-orientation).
- `eas.json`: `production` profile (store distribution, `autoIncrement`, env baked),
  `preview` (internal, installable AAB/IPA for ad-hoc testing), `development`.
- Version `0.1.0` (marketing). Build numbers auto-increment remotely.

## 4. Nice-to-have before public launch (not blocking internal beta)

- Real icon + splash + adaptive icon (waits on logo).
- Production Clerk instance (pk_live).
- A dedicated production Worker/D1 (currently shared dev Worker — fine for beta).
- Screenshots (6.7" + 5.5" iPhone, Android phone) for the store listings.
- App Store description, keywords, support URL.
