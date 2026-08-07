const assert = require('assert');
const { calculateTax } = require('../src/taxEngine');

function approxEqual(a,b,tol=1e-2){
  return Math.abs(a-b) <= tol;
}

// TC1: zero incomes
const res1 = calculateTax({ age_category: 'below60', gross_income:0, other_income:0, deductions: {} });
assert(res1.old_regime.final_tax_payable === 0, 'TC1 old regime should be zero');
assert(res1.new_regime.final_tax_payable === 0, 'TC1 new regime should be zero');

// TC2: New Regime rebate edge — taxable income exactly ₹12,00,000 after deductions
// We'll craft gross such that taxable after standard deduction equals 1,200,000
// For new regime standard deduction 75,000, so gross_total should be 1,275,000
const res2 = calculateTax({ age_category: 'below60', gross_income:1275000, other_income:0, deductions: {} });
assert(res2.new_regime.taxable_income === 1200000, 'TC2 taxable should be 1,200,000');
assert(res2.new_regime.final_tax_payable === 0, 'TC2 new regime tax should be zero due to rebate');

// TC4: Old Regime rebate edge — taxable income exactly 500,000
// Old standard deduction 50,000 so gross_total should be 550,000
const res4 = calculateTax({ age_category: 'below60', gross_income:550000, other_income:0, deductions: { section_80C:0 } });
assert(res4.old_regime.taxable_income === 500000, 'TC4 taxable should be 500,000');
assert(res4.old_regime.final_tax_payable === 0, 'TC4 old regime tax should be zero due to rebate');

// TC7: Deductions exclusion in New Regime — user enters large 80C but it shouldn't affect new regime
const res7 = calculateTax({ age_category: 'below60', gross_income:1200000, other_income:0, deductions: { section_80C:150000 } });
// In new regime, only standard deduction applies (75k) so taxable = 1,125,000
assert(res7.new_regime.taxable_income === 1125000, 'TC7 new regime taxable should ignore 80C');

console.log('Tax engine tests passed (TC1, TC2, TC4, TC7).');
