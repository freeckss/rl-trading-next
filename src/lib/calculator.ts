import type { VehicleUnit } from '@/types/database';
import type { FinancingBreakdown } from '@/types/financing';

/**
 * Format a numeric amount to Philippine Peso (PHP) currency format without decimals.
 */
export function formatPHP(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Dealership financing calculation engine.
 * 
 * Formulas:
 * - approvedLoan = Math.max(0, (unitPrice - targetAllInDown) / 0.93)
 * - processingFee = approvedLoan * 0.07 (7% bank fee)
 * - actualDown = Math.max(0, unitPrice - approvedLoan)
 * - monthly24 = approvedLoan * 0.05567 (2 years @ 16.8% annual add-on)
 * - monthly36 = approvedLoan * 0.04178 (3 years @ 16.8% annual add-on)
 * - monthly48 = approvedLoan * 0.03483 (4 years @ 16.8% annual add-on)
 * - isHighLtvWarning = true if approvedLoan > unitPrice * 0.80 (>80% LTV)
 */
export function calculateFinancing(
  unitPrice: number,
  targetAllInDown: number
): FinancingBreakdown {
  const safeUnitPrice = Math.max(0, unitPrice);
  const safeTargetDown = Math.max(0, targetAllInDown);

  const rawApprovedLoan = Math.max(0, (safeUnitPrice - safeTargetDown) / 0.93);
  const rawProcessingFee = rawApprovedLoan * 0.07;
  const rawActualDown = Math.max(0, safeUnitPrice - rawApprovedLoan);
  const rawMonthly24 = rawApprovedLoan * 0.05567;
  const rawMonthly36 = rawApprovedLoan * 0.04178;
  const rawMonthly48 = rawApprovedLoan * 0.03483;

  const isHighLtvWarning = rawApprovedLoan > safeUnitPrice * 0.8;

  return {
    unitPrice: Math.round(safeUnitPrice),
    targetAllInDown: Math.round(safeTargetDown),
    approvedLoan: Math.round(rawApprovedLoan),
    processingFee: Math.round(rawProcessingFee),
    actualDownpayment: Math.round(rawActualDown),
    monthly24: Math.round(rawMonthly24),
    monthly36: Math.round(rawMonthly36),
    monthly48: Math.round(rawMonthly48),
    isHighLtvWarning,
  };
}

/**
 * Generates a clean, copy-paste-ready financing computation block for Facebook Messenger
 * or SMS customer inquiries matching RL Trading & SEat n Go branding.
 */
export function generateMessengerQuote(
  unit: Pick<VehicleUnit, 'year' | 'make' | 'model' | 'variant'>,
  calc: FinancingBreakdown
): string {
  const title = `${unit.year} ${unit.make} ${unit.model} ${unit.variant}`.trim();
  const warningNote = calc.isHighLtvWarning
    ? '\n⚠️ Note: Loan exceeds 80% LTV threshold; subject to bank credit evaluation.'
    : '';

  return `🚗 ${title}
📍 RL Trading & SEat n Go Shuttle Services
Pulung Bulu, Angeles City, Pampanga (Beside Shell, in front of Motech)

💰 FINANCING COMPUTATION:
• Unit Cash Price: ${formatPHP(calc.unitPrice)}
• Target All-In Downpayment: ${formatPHP(calc.targetAllInDown)}
  - Actual Unit Down: ${formatPHP(calc.actualDownpayment)}
  - Bank Processing Fee (7%): ${formatPHP(calc.processingFee)}
• Estimated Loan Amount: ${formatPHP(calc.approvedLoan)}

📅 MONTHLY AMORTIZATION:
• 24 Months (2 yrs): ${formatPHP(calc.monthly24)} / month
• 36 Months (3 yrs): ${formatPHP(calc.monthly36)} / month
• 48 Months (4 yrs): ${formatPHP(calc.monthly48)} / month${warningNote}

📞 INQUIRIES & VIEWING:
Contacts: 09237309644 / 09174403909
Google Maps: https://maps.app.goo.gl/JFw6ufXYTxyfvWHk8`;
}
