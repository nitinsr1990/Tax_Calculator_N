// taxEngine.js — initial skeleton for calculateTax

function clamp(n, min=0, max=Number.POSITIVE_INFINITY){
  if (isNaN(n)) return 0;
  return Math.max(min, Math.min(max, n));
}

function taxFromSlabs(taxableIncome, slabs){
  // slabs: [{from: number, to: number|null, rate: 0.05}, ...]
  let tax = 0;
  for (const s of slabs){
    const lower = s.from;
    const upper = s.to === null ? Infinity : s.to;
    if (taxableIncome <= lower) continue;
    const amount = Math.min(taxableIncome, upper) - lower;
    if (amount > 0) tax += amount * s.rate;
  }
  return tax;
}

function computeSurcharge(taxBeforeSurcharge, grossIncome, regime){
  // regime: 'new' or 'old'
  const income = grossIncome;
  let rate = 0;
  if (income > 50000000) { // >5Cr
    rate = (regime === 'old') ? 0.37 : 0.25;
  } else if (income > 20000000) { // >2Cr
    rate = 0.25;
  } else if (income > 10000000) { // >1Cr
    rate = 0.15;
  } else if (income > 5000000) { // >50L
    rate = 0.10;
  }
  return taxBeforeSurcharge * rate;
}

function applyRebateAndMarginal(taxBeforeRebate, taxableIncome, regime){
  // Returns { taxAfterRebate, rebateApplied }
  if (regime === 'new'){
    const threshold = 1200000; // 12L
    const rebateCap = 60000; // ₹60,000
    if (taxableIncome <= threshold) return { taxAfterRebate: 0, rebateApplied: taxBeforeRebate };
    // marginal relief: rebate = max(0, taxBeforeRebate - (taxableIncome - threshold))
    const rebate = Math.max(0, taxBeforeRebate - (taxableIncome - threshold));
    const applied = Math.min(rebate, taxBeforeRebate, rebateCap);
    return { taxAfterRebate: Math.max(0, taxBeforeRebate - applied), rebateApplied: applied };
  } else {
    // Old regime: rebate only up to ₹12,500 for taxable <= ₹5,00,000
    const threshold = 500000;
    const rebateCap = 12500;
    if (taxableIncome <= threshold){
      const applied = Math.min(rebateCap, taxBeforeRebate);
      return { taxAfterRebate: Math.max(0, taxBeforeRebate - applied), rebateApplied: applied };
    }
    return { taxAfterRebate: taxBeforeRebate, rebateApplied: 0 };
  }
}

function calculateRegimeResult({ gross_income, other_income, deductions, age_category, regime }){
  const grossTotal = clamp(Number(gross_income) || 0) + clamp(Number(other_income) || 0);

  // Standard deduction
  const standardDeduction = (regime === 'new') ? 75000 : 50000;

  // Gather applicable deductions
  let totalDeductions = 0;
  if (regime === 'old'){
    const sec80C = clamp(Number(deductions.section_80C) || 0, 0, 150000);
    const sec80Dcap = (age_category === 'below60') ? 25000 : 50000;
    const sec80D = clamp(Number(deductions.section_80D) || 0, 0, sec80Dcap);
    const hra = clamp(Number(deductions.hra_exemption) || 0, 0);
    const homeLoan = clamp(Number(deductions.home_loan_interest_24b) || 0, 0, 200000);
    const nps1b = clamp(Number(deductions.nps_80ccd_1b) || 0, 0, 50000);
    const nps2 = clamp(Number(deductions.nps_80ccd_2) || 0, 0);
    const other = clamp(Number(deductions.other_deductions) || 0, 0);
    totalDeductions = standardDeduction + sec80C + sec80D + hra + homeLoan + nps1b + nps2 + other;
  } else {
    // New regime: only standard deduction + employer NPS (80CCD(2)) per PRD
    const nps2 = clamp(Number(deductions.nps_80ccd_2) || 0, 0);
    totalDeductions = standardDeduction + nps2;
  }

  const taxableIncome = Math.max(0, grossTotal - totalDeductions);

  // Define slabs
  let slabs = [];
  if (regime === 'new'){
    slabs = [
      { from: 0, to: 400000, rate: 0 },
      { from: 400000, to: 800000, rate: 0.05 },
      { from: 800000, to: 1200000, rate: 0.10 },
      { from: 1200000, to: 1600000, rate: 0.15 },
      { from: 1600000, to: 2000000, rate: 0.20 },
      { from: 2000000, to: 2400000, rate: 0.25 },
      { from: 2400000, to: null, rate: 0.30 }
    ];
  } else {
    // old regime slabs depend on age
    let nilLimit = 250000;
    if (age_category === '60to79') nilLimit = 300000;
    if (age_category === '80plus') nilLimit = 500000;
    slabs = [
      { from: 0, to: nilLimit, rate: 0 },
      { from: nilLimit, to: 500000, rate: 0.05 },
      { from: 500000, to: 1000000, rate: 0.20 },
      { from: 1000000, to: null, rate: 0.30 }
    ];
  }

  const taxBeforeRebate = taxFromSlabs(taxableIncome, slabs);

  const { taxAfterRebate, rebateApplied } = applyRebateAndMarginal(taxBeforeRebate, taxableIncome, regime === 'new' ? 'new' : 'old');

  // surcharge on taxAfterRebate
  const surcharge = computeSurcharge(taxAfterRebate, grossTotal, regime === 'new' ? 'new' : 'old');

  const cess = 0.04 * (taxAfterRebate + surcharge);

  const finalTax = Math.max(0, taxAfterRebate + surcharge + cess);

  const effectiveRate = grossTotal > 0 ? (finalTax / grossTotal) : 0;

  return {
    gross_total_income: grossTotal,
    total_deductions: totalDeductions,
    taxable_income: taxableIncome,
    tax_before_rebate: taxBeforeRebate,
    rebate_applied: rebateApplied,
    tax_after_rebate: taxAfterRebate,
    surcharge: surcharge,
    cess: cess,
    final_tax_payable: finalTax,
    effective_rate: effectiveRate
  };
}

function calculateTax(input){
  const safe = {
    age_category: input.age_category || 'below60',
    gross_income: Number(input.gross_income) || 0,
    other_income: Number(input.other_income) || 0,
    deductions: input.deductions || {}
  };

  const old_regime = calculateRegimeResult({ ...safe, regime: 'old' });
  const new_regime = calculateRegimeResult({ ...safe, regime: 'new' });

  let recommended = 'old';
  let savings_amount = Math.abs(old_regime.final_tax_payable - new_regime.final_tax_payable);
  if (new_regime.final_tax_payable < old_regime.final_tax_payable) recommended = 'new';
  if (new_regime.final_tax_payable === old_regime.final_tax_payable) recommended = 'either';

  return { old_regime, new_regime, recommended, savings_amount };
}

const exported = { calculateTax, taxFromSlabs, clamp };

// Headroom helper
function computeHeadroom(deductions, age_category){
  const caps = {
    section_80C: 150000,
    section_80D: (age_category === 'below60' ? 25000 : 50000),
    home_loan_interest_24b: 200000,
    nps_80ccd_1b: 50000
  };
  const res = {};
  for (const k of Object.keys(caps)){
    const used = clamp(Number(deductions[k]) || 0, 0);
    res[k] = { used, cap: caps[k], remaining: Math.max(0, caps[k] - used) };
  }
  return res;
}

exported.computeHeadroom = computeHeadroom;

if (typeof module !== 'undefined' && module.exports){
  module.exports = exported;
}

if (typeof window !== 'undefined'){
  window.taxEngine = exported;
}

