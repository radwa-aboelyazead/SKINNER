# SKINNER API Integration Notes

Base URL is configured through `VITE_API_BASE_URL` and defaults to `http://187.127.227.63` in `src/services/skinnerApi.js`.

## Main files added

- `src/services/skinnerApi.js`: centralized API client, token storage, and endpoint wrappers.
- `src/services/apiAdapters.js`: safe adapters to normalize API responses for the current UI.

## Connected areas

- Login, registration, forgot password, reset password.
- Patient image upload and AI analysis.
- Patient analysis history and analysis result view.
- Doctor listing, appointment booking, and payment confirmation.
- Patient profile loading/updating and appointment listing.
- Patient AI chatbot.
- Patient-doctor chat send/load when a chat id is available.
- Doctor pending/reviewed cases, profile update, and report submission.
- Admin pending doctors, approve, and reject actions.

## Run

```bash
npm install
npm run dev
```

For production API:

```bash
cp .env.example .env
npm run dev
```
