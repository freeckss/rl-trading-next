# RL Trading & SEat n Go Shuttle Services - Project Guidelines

## Tech Stack
- **Framework**: Next.js (App Router)
- **Language**: TypeScript (strict mode enabled, zero `any` types allowed)
- **Styling**: Tailwind CSS, Lucide React icons
- **Backend & Auth**: Supabase (PostgreSQL, Row Level Security [RLS], Supabase Storage)
- **Architecture**: Dual-Mode Web App (Public Buyer Showroom + Password-Protected Admin Command Center)

## Business Constants
- **Business Name**: RL Trading & SEat n Go Shuttle Services
- **Dealership Type**: Pre-owned vehicle dealership & shuttle services
- **Location / Address**: MacArthur Highway, Pulung Bulu, Angeles City, Pampanga (Beside Shell, in front of Motech)
- **Google Maps**: https://maps.app.goo.gl/JFw6ufXYTxyfvWHk8
- **Contact Numbers**: 09237309644 / 09174403909

## Dealership Financing Formula Rules
All financing calculations must strictly follow these dealer rules:
```typescript
// 1. Approved loan backed out from target all-in downpayment (7% processing fee built-in)
approvedLoan = Math.max(0, (unitPrice - targetAllInDown) / 0.93);

// 2. Dealer bank processing fee (7% of approved loan)
processingFee = approvedLoan * 0.07;

// 3. Actual vehicle downpayment
actualDown = Math.max(0, unitPrice - approvedLoan);

// 4. Monthly amortization factors (16.8% annual add-on rate)
monthly24 = approvedLoan * 0.05567; // 24 months (2 years)
monthly36 = approvedLoan * 0.04178; // 36 months (3 years)
monthly48 = approvedLoan * 0.03483; // 48 months (4 years)
```
- Display amounts are rounded to the nearest whole Philippine Peso (`Math.round`).
- High LTV warning flag (`isHighLtvWarning`) triggers if `approvedLoan > unitPrice * 0.80` (> 80% Loan-to-Value).

## Code Standards
- **Strict Typing**: No `any`, `unknown` must be narrowed, strict null checks.
- **Directory Structure**:
  - `src/app/`: Next.js App Router pages and route handlers
  - `src/components/`: Reusable React components
  - `src/lib/`: Business logic, calculators, client utilities, mock data
  - `src/types/`: Centralized TypeScript interfaces and database types
- **Client-Side Media**: All images must be compressed client-side to WebP (~100KB–160KB) before uploading to Supabase Storage.

## Verification Commands
Before completing any stage or committing, always verify:
- Type check: `npm run typecheck`
- Linter: `npm run lint`
- Build verification: `npm run build`

