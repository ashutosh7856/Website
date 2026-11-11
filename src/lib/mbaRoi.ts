/**
 * Pure arithmetic behind the MBA fees & ROI calculator (/mba-fees-roi-calculator).
 *
 * Nothing here predicts an outcome. Every input is either the user's own figure
 * or an official one they can overwrite (a programme's stated fee, the median
 * salary of a past batch), and every output is plain arithmetic on those
 * inputs: a standard reducing-balance EMI, the total repaid, and a simple
 * payback period on gross salary. Tax, salary growth, living costs after the
 * MBA, scholarships, moratorium interest and the income given up while
 * studying are deliberately left out — the page says so.
 */

export interface RoiInput {
  /** Total programme fee, ₹. */
  fee: number;
  /** Living and other costs over the programme, ₹ (the user's own estimate). */
  living: number;
  /** Education-loan principal, ₹. */
  loanAmount: number;
  /** Annual interest rate, % (e.g. 10.5). */
  annualRatePct: number;
  /** Repayment tenure, years. */
  tenureYears: number;
  /** Expected annual gross salary after the MBA, ₹. */
  salary: number;
}

export interface RoiResult {
  /** Monthly instalment, ₹ (0 without a loan). */
  emi: number;
  months: number;
  /** EMI × months. */
  totalRepayment: number;
  totalInterest: number;
  /** Fee + living costs + loan interest: the cash the MBA costs you. */
  totalCost: number;
  /** Fee + living costs not covered by the loan. */
  ownFunds: number;
  /** Months of gross salary that add up to totalCost; null without a salary. */
  paybackMonths: number | null;
  /** EMI as a share of monthly gross salary, %; null without a salary or a loan. */
  emiShareOfSalaryPct: number | null;
}

export const ROI_LIMITS = Object.freeze({
  maxAmount: 50_000_000, // ₹5 crore — far above any programme we list
  maxRatePct: 30,
  minTenureYears: 1,
  maxTenureYears: 20,
});

/**
 * Standard reducing-balance EMI: P·r·(1+r)^n / ((1+r)^n − 1), r the monthly
 * rate. With a zero rate the principal is simply split over the months.
 */
export function emi(principal: number, annualRatePct: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRatePct / 12 / 100;
  if (r === 0) return principal / months;
  const growth = Math.pow(1 + r, months);
  return (principal * r * growth) / (growth - 1);
}

export function computeRoi(input: RoiInput): RoiResult {
  const months = Math.round(input.tenureYears * 12);
  const loan = Math.max(0, input.loanAmount);
  const monthly = emi(loan, input.annualRatePct, months);
  const totalRepayment = loan > 0 ? monthly * months : 0;
  const totalInterest = Math.max(0, totalRepayment - loan);
  const outlay = Math.max(0, input.fee) + Math.max(0, input.living);
  const totalCost = outlay + totalInterest;
  const monthlySalary = input.salary > 0 ? input.salary / 12 : 0;
  return {
    emi: monthly,
    months: loan > 0 ? months : 0,
    totalRepayment,
    totalInterest,
    totalCost,
    ownFunds: Math.max(0, outlay - loan),
    paybackMonths: monthlySalary > 0 ? Math.ceil(totalCost / monthlySalary) : null,
    emiShareOfSalaryPct: monthlySalary > 0 && monthly > 0 ? (monthly / monthlySalary) * 100 : null,
  };
}

export type RoiField = keyof RoiInput;
export type RoiDraft = Record<RoiField, string>;
export type RoiErrors = Partial<Record<RoiField, string>>;

/** "12,50,000" / "₹ 12.5" → digits and one dot only. */
export const cleanAmount = (raw: string): string => {
  const kept = raw.replace(/[^0-9.]/g, "");
  const dot = kept.indexOf(".");
  return dot === -1 ? kept : `${kept.slice(0, dot + 1)}${kept.slice(dot + 1).replace(/\./g, "")}`;
};

/** Parses and range-checks the form; blank living costs and loan count as 0. */
export function validateRoi(draft: RoiDraft): { input: RoiInput | null; errors: RoiErrors } {
  const errors: RoiErrors = {};
  const num = (field: RoiField, { required = false, max = ROI_LIMITS.maxAmount as number, min = 0 }: { required?: boolean; max?: number; min?: number } = {}) => {
    const raw = draft[field].trim();
    if (raw === "") {
      if (required) errors[field] = "Enter a figure.";
      return 0;
    }
    const v = Number(raw);
    if (!Number.isFinite(v)) {
      errors[field] = "Enter a number.";
      return 0;
    }
    if (v < min || v > max) errors[field] = `Enter a figure between ${min.toLocaleString("en-IN")} and ${max.toLocaleString("en-IN")}.`;
    return v;
  };
  const fee = num("fee", { required: true });
  const living = num("living");
  const loanAmount = num("loanAmount");
  const loanTaken = loanAmount > 0;
  const annualRatePct = num("annualRatePct", { required: loanTaken, max: ROI_LIMITS.maxRatePct });
  const tenureYears = num("tenureYears", {
    required: loanTaken,
    min: loanTaken ? ROI_LIMITS.minTenureYears : 0,
    max: ROI_LIMITS.maxTenureYears,
  });
  const salary = num("salary", { required: true });
  if (!errors.fee && fee <= 0) errors.fee = "Enter the total programme fee.";
  if (!errors.salary && salary <= 0) errors.salary = "Enter an expected annual salary.";
  if (Object.keys(errors).length) return { input: null, errors };
  return { input: { fee, living, loanAmount, annualRatePct, tenureYears, salary }, errors };
}

/** Share text: the user's own result, no personal details. */
export function roiShareSummary(result: RoiResult, label: string): string {
  const inr = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;
  const parts = [`My MBA cost check (${label}): total cost ${inr(result.totalCost)}`];
  if (result.emi > 0) parts.push(`EMI ${inr(result.emi)}/month for ${result.months} months`);
  if (result.paybackMonths !== null) parts.push(`simple payback about ${result.paybackMonths} months of gross salary`);
  return `${parts.join(", ")}. Work out yours:`;
}
