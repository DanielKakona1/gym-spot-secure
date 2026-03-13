# gym-spot-secure

Technical case-study implementation for gym live-capacity and slot booking.

## Stack

- Backend: Fastify + TypeScript (`apps/api`)
- Mobile: Expo React Native + TypeScript (`apps/mobile`)
- Infra: AWS CDK (`infra/cdk`)
- Shared contracts: `packages/shared-types`

## Run

- Install dependencies: `npm install`
- Start API: `npm run dev:api`
- Start mobile app: `npm run dev:mobile`
- Run API tests: `npm run test:api`
- Run mobile tests: `npm run test -w apps/mobile`
- Build CDK: `npm run build:infra`

## API Endpoints

- `GET /gyms/:id/capacity?slotTime=<ISO_DATETIME>`
- `POST /gyms/:id/book`

## Default Demo Users

- `Daniel Kakona`
- `Keiden Kakona`
- `Benjamin Kakona`
- `David Kakona`
- `Beni Kakona`

## Architecture Decisions

- In-memory model interfaces (`BookingModel`, `GymModel`) simulate a repository/data layer, so service logic is testable without a running DB.
- Booking rules are centralized in `apps/api/src/services/booking.service.ts` (capacity checks, duplicate prevention, per-day active-booking constraints, no-show handling).
- Users can create bookings on different days, but only one active booking per day (`BOOKED` or `CHECKED_IN`) is allowed.
- Live capacity is day-scoped: only bookings from the requested day are counted, and active `BOOKED` + `CHECKED_IN` users contribute to the count.
- Concurrency safety uses `LockManager` (`apps/api/src/utils/lock-manager.util.ts`) with ordered multi-key locking (`slot:gymId:slotTime` + `user:userId`) to serialize conflicting writes without deadlocks.
- The API controller layer (`apps/api/src/controllers/gym.controller.ts`) is thin and maps domain/service errors into HTTP responses.
- Shared request/response types live in `packages/shared-types/src/index.ts` and are consumed by both backend and mobile.

## Mobile Notes

- `apps/mobile/src/screens/BookingScreen.tsx` provides live capacity display and booking action UI.
- Live capacity includes a visual progress bar (`apps/mobile/src/components/CapacityProgressBar.tsx`)
- React Query hooks (`useCapacity`, `useBookSlot`) wrap API access and cache invalidation; `useCapacity` also polls every 5 seconds to keep live numbers fresh.
- Service layer (`apps/mobile/src/services/gymService.ts`) owns fetch details and error normalization.
- Admin navigation is included as an extended operational capability beyond the single booking screen requirement.

## CDK Snippet

- `infra/cdk/src/api-stack.ts` provisions:
  - Lambda (`NodejsFunction`) using `apps/api/src/lambda.ts`
  - HTTP API (`HttpApi`)
  - Routes for `/gyms/{id}/capacity` and `/gyms/{id}/book`

## Tests

- Backend:
  - `apps/api/src/services/booking.service.test.ts` (critical booking logic incl. concurrency)
  - `apps/api/src/controllers/gym.controller.test.ts`
  - model + lock utility tests
- Mobile:
  - `apps/mobile/src/services/gymService.test.ts` (service success + error handling)
  - `apps/mobile/src/hooks/useCapacity.test.ts` (query-key/enabled state validation)
  - `apps/mobile/src/hooks/useBookSlot.test.ts` (mutation wiring + cache invalidation)
  - `apps/mobile/src/components/CapacityProgressBar.test.tsx` (progress bar rendering/clamping)
  - `apps/mobile/src/screens/BookingScreen.test.tsx` (loading/success/error capacity and booking states with React Native Testing Library)

## Trade-offs / What I’d Improve Next

- Locking is in-memory, which is enough for single-process demos but not distributed production. Next step: move to a distributed lock/atomic reservation in Redis or DB transaction primitives.
- Data is in-memory and seeded at app start; production version should persist bookings in durable storage with proper indexing on `gymId + slotTime`.
- Mobile tests are Jest + React Native Testing Library focused and currently cover service, hook, component, and key screen states.
- Lambda adapter currently uses Fastify injection for a compact case-study setup; for production, I’d use a dedicated adapter package and add observability/metrics.

## Bonus: ElastiCache Strategy for `GET /capacity`

- Use Redis as a read-through cache keyed by `gymId + slotTime` (e.g., `capacity:gym-1:2099-03-12T18:00:00.000Z`).
- On booking/check-in/check-out/cancel, invalidate or recompute the affected slot key immediately.
- Keep short TTLs (for example 5–15 seconds) to reduce stale data while keeping reads fast during peak bursts.
- For global users, pair ElastiCache with regional API deployments and route users to nearest region, while synchronizing booking writes to source of truth.
