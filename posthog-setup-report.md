# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into this Next.js App Router project. Here is a summary of all changes made:

- **`instrumentation-client.ts`** (created): Client-side PostHog initialization using the Next.js 15.3+ `instrumentation-client` file. Initializes `posthog-js` with the `/ingest` reverse proxy, exception capture, and debug mode in development.
- **`lib/posthog-server.ts`** (created): Server-side PostHog singleton using `posthog-node`. Used by Server Actions and API routes for server-side event capture with immediate flush (`flushAt: 1`, `flushInterval: 0`).
- **`next.config.ts`** (modified): Added `/ingest` reverse proxy rewrites to `https://us.i.posthog.com` (to avoid ad-blockers) and set `skipTrailingSlashRedirect: true`.
- **`app/(public)/login/page.tsx`** (modified): Calls `posthog.identify(email)` and captures `user_logged_in` on successful authentication.
- **`app/(public)/register/page.tsx`** (modified): Calls `posthog.identify(email)` and captures `user_signed_up` after OTP verification succeeds.
- **`app/(panel)/dashboard/schedule/calendar/_actions/create-appointment.ts`** (modified): Captures `appointment_created` server-side with service, employee, date, and time properties.
- **`app/(panel)/dashboard/schedule/calendar/_actions/cancel-appointment.ts`** (modified): Captures `appointment_cancelled` server-side with appointment ID, reason, and canceller.
- **`app/(public)/agendamento/[token]/_actions/create-public-appointment.ts`** (modified): Captures `public_appointment_created` server-side using the booker's email as `distinctId`.
- **`app/(panel)/dashboard/clients/_actions/create-client.ts`** (modified): Captures `client_created` server-side with the new client ID.
- **`app/(panel)/dashboard/upgrade/page.tsx`** (modified): Captures `upgrade_page_viewed` server-side with usage summary properties. Extracted CTA buttons into a new client component.
- **`app/(panel)/dashboard/upgrade/_components/upgrade-cta-buttons.tsx`** (created): Client component that captures `upgrade_whatsapp_clicked` and `upgrade_email_clicked` on button click.

## Events

| Event | Description | File |
|---|---|---|
| `user_signed_up` | Fired when a new user successfully creates an account (after OTP is verified) | `app/(public)/register/page.tsx` |
| `user_logged_in` | Fired when a user successfully logs in on the client side | `app/(public)/login/page.tsx` |
| `appointment_created` | Fired when a professional creates an appointment from the dashboard calendar | `app/(panel)/dashboard/schedule/calendar/_actions/create-appointment.ts` |
| `appointment_cancelled` | Fired when a professional cancels an appointment from the dashboard | `app/(panel)/dashboard/schedule/calendar/_actions/cancel-appointment.ts` |
| `public_appointment_created` | Fired when a client creates an appointment via the public booking page (key conversion event) | `app/(public)/agendamento/[token]/_actions/create-public-appointment.ts` |
| `booking_link_shared` | Fired when a professional shares their booking URL via social or copy | `app/(panel)/dashboard/dashboard/_components/public-booking-url-card.tsx` |
| `client_created` | Fired when a professional manually creates a new client | `app/(panel)/dashboard/clients/_actions/create-client.ts` |
| `upgrade_page_viewed` | Fired when a user lands on the upgrade page (trial expired - top of conversion funnel) | `app/(panel)/dashboard/upgrade/page.tsx` |
| `upgrade_whatsapp_clicked` | Fired when a user clicks the WhatsApp contact button on the upgrade page | `app/(panel)/dashboard/upgrade/_components/upgrade-cta-buttons.tsx` |
| `upgrade_email_clicked` | Fired when a user clicks the email contact button on the upgrade page | `app/(panel)/dashboard/upgrade/_components/upgrade-cta-buttons.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/340653/dashboard/1356438
- **Signups & Logins over time**: https://us.posthog.com/project/340653/insights/JaLJXp1o
- **Onboarding funnel: Signup → First appointment**: https://us.posthog.com/project/340653/insights/6dytwsTk
- **Public bookings vs Cancellations**: https://us.posthog.com/project/340653/insights/PLHdYS43
- **Trial-to-paid conversion funnel**: https://us.posthog.com/project/340653/insights/H0gKXN07

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
