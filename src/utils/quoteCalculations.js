// Pure quote math for the Quote Builder's live, client-side total preview -
// every keystroke in the line item table recomputes through these, so the
// user sees subtotals/discount/tax/grand total update instantly without a
// round trip. Mirrored (not shared - separate app, no monorepo) on the
// backend at Backend-MERN/src/utils/quoteCalculations.js, which uses the
// exact same formula to render the PDF and to be the source of truth once
// Salesforce recomputes its own rollups after a save. Keep both in sync.

export const calculateLineTotal = ({ quantity = 0, unitPrice = 0, discount = 0 }) => {
  const qty = Number(quantity) || 0;
  const price = Number(unitPrice) || 0;
  const disc = Math.min(100, Math.max(0, Number(discount) || 0));
  return qty * price * (1 - disc / 100);
};

export const calculateQuoteTotals = ({ lineItems = [], discount = 0, tax = 0, shippingHandling = 0 }) => {
  const subtotal = lineItems.reduce((sum, item) => sum + calculateLineTotal(item), 0);
  const discountPct = Math.min(100, Math.max(0, Number(discount) || 0));
  const discountAmount = subtotal * (discountPct / 100);
  const taxAmount = Number(tax) || 0;
  const shippingAmount = Number(shippingHandling) || 0;
  const grandTotal = subtotal - discountAmount + taxAmount + shippingAmount;

  return {
    subtotal,
    discountAmount,
    tax: taxAmount,
    shippingHandling: shippingAmount,
    grandTotal,
  };
};

export const formatCurrency = (value) =>
  `$${(Number(value) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
