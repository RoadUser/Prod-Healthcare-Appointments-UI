# CareSchedule (HotPocket)

Frontend for the Evernode HotPocket smart contract **`healthcare-appointments`**.

## Features
- Patient Portal: register, browse doctors, view contract availability, book/cancel/reschedule, ICS export, notifications.
- Doctor Portal: schedule, blocks, appointment actions, availability management.
- Admin Console: clinics, doctors, policy, analytics (client-computed), audit viewer (mock-only unless backend adds endpoints).

## Environment variables
Create a `.env` file:

```bash
VITE_MOCK_MODE=true
VITE_CONTRACT_URLS=wss://localhost:8081
VITE_DEFAULT_PORTAL=patient
```

- `VITE_MOCK_MODE=true` runs without HotPocket servers.
- `VITE_MOCK_MODE=false` connects using `VITE_CONTRACT_URLS` (comma-separated).

## Dev
```bash
npm i
npm run dev
```

## Tests
```bash
npm run test
```

## Notes
- The contract expects UTC ISO timestamps ending in `Z`. This UI displays local time and converts to UTC for calls.
- Contact data is never sent raw; it is SHA-256 hashed before calling `RegisterPatient`.
- Real-time updates are driven by contract outputs and emitted event messages.
