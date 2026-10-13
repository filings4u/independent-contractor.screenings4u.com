# screenings4u DOT C/TPA Portal — Employer Access / Billing Update

Domain: `https://ctpa-dot.screenings4u.com`
Portal code: `ctpa_dot`

This package keeps the completed C/TPA DOT portal and adds the access/billing changes required to support the Employer DOT model.

## Employer customer provisioning

The C/TPA can create individual DOT Employer customer accounts and can bulk-import Employers by CSV. Bulk imports are submitted in batches of 100, so large customer rosters can be processed without a single oversized request.

Each newly created C/TPA Employer customer now receives its own Employer tenant beneath the C/TPA relationship. This fixes the previous tenant uniqueness limitation and supports one C/TPA managing many Employer companies.

The C/TPA-created customer gets:

- internal `dot_employer_ctpa_sponsored` subscription;
- `employer_dot` access;
- DOT Employer portal surface;
- optional Employer Administrator invitation;
- management relationship back to the creating C/TPA.

## Customer support ownership

Employer customer support tickets are routed to the managing C/TPA rather than Platform Admin Support. The C/TPA Support page now exposes an Employer Customer Support queue and allows the C/TPA to update those ticket statuses/priorities.

## Billing split

The C/TPA portal now separates two different billing responsibilities:

- **Account Billing** (`billing.html`) — invoices sent by screenings4u Admin to the C/TPA. C/TPA users can view, download, and pay them through the global screenings4u checkout flow.
- **Employer Billing** (`employer-billing.html`) — the existing C/TPA client-invoicing workspace for creating, managing, downloading, and sending invoices to Employer customers.

The global platform invoice payment path is `https://screenings4u.com/checkout.html`.

## Enterprise branding

Enterprise C/TPA white-label configuration continues to control C/TPA branding. Sponsored Employer customer portals and their Employee/Driver portal backend now inherit the C/TPA logo/colors when the managing C/TPA has White Label enabled.

## Platform separation

Platform Admin Employer workflows now exclude/reject Employers that belong to a C/TPA for direct support, direct messaging, platform invoicing, Employer access management, testing/results/compliance/document/reporting/selection operations, and Employer profile/context management.

## Step 9 — Legacy Workforce access retired

The legacy shared Workforce portal access layer has been retired from the live backend. C/TPA DOT now authorizes through the canonical `organization_portal_access` record for `ctpa_dot` only. The old `ctpa_portal_access` and `employer_portal_access` tables were archived into an audit-only snapshot and removed.

Legacy `ctpa_workforce` / `employer_workforce` organization access rows were retired. Shared compliance, customer, employee, testing, result, document, billing, subscription, and audit records were preserved; only the obsolete portal-access surface was removed.

C/TPA handoff is now DOT-only and routes to `https://ctpa-dot.screenings4u.com`. New C/TPA Employer provisioning writes only canonical `employer_dot` organization access.

## Billing correction — September 19, 2026

The C/TPA portal has two separate billing experiences:

- **Account Billing** (`billing.html`) — read-only screenings4u invoices issued to the C/TPA. The C/TPA can view, download, and pay open invoices.
- **Employer Billing** (`employer-billing.html`) — the C/TPA's invoicing application for its own Employer customers. It supports creating, editing, duplicating, sending/resending, PDF download, manual payment recording, payment history, voiding, deleting unsent drafts, remittance settings, branded invoice emails when White Label is enabled, and secure checkout links when the Payment Processor add-on and processor profile are active.

Important implementation fix: portal page IDs are normalized with underscores by `app.js`. Employer Billing now correctly uses `employer_billing`, so its full `CtpaBilling` application is loaded instead of the generic fallback table.

Live backend versions after this correction:
- `workforce-ctpa-admin` v13
- `workforce-email` v15
- `workforce-invoice-public` v11
- `workforce-stripe-invoice-sync` v10

Payment processing is intentionally an **add-on**, not automatically included in Enterprise. Enterprise White Label controls the C/TPA logo/color branding used for customer-facing invoice emails. Admin must activate the C/TPA payment processor profile before customer checkout links are generated.

## Sponsored customer access

The DOT C/TPA portal manages and sponsors Employer and Owner-Operator customer accounts. Direct DOT agency management portals remain screenings4u customer portals and are not C/TPA-sponsored surfaces.
