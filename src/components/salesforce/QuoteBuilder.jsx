import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/useToast';
import { markSelfAction } from '../../utils/recentSelfActions';
import { downloadFileFromLink } from '../../utils/secureDownload';
import { calculateLineTotal, calculateQuoteTotals, formatCurrency } from '../../utils/quoteCalculations';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { OpportunityPicker, ProductPicker } from './RecordPickers';
import { TrashIcon, DownloadIcon, MailIcon, PlusIcon } from '../ui/DashboardIcons';
import { canManageSalesforceRecords } from '../../utils/permissions';
import { useAuth } from '../../context/useAuth';
import './QuoteBuilder.css';

let localRowSeq = 0;
const nextLocalKey = () => `new-${Date.now()}-${localRowSeq++}`;

/**
 * Map a Salesforce QuoteLineItem record into the line item engine's local
 * row shape (see toApiLineItems() below for the reverse direction).
 */
const fromSalesforceLineItem = (li) => ({
  key: li.Id,
  pricebookEntryId: li.PricebookEntryId,
  productId: li.Product2Id,
  name: li.Product2?.Name || 'Custom item',
  productCode: li.Product2?.ProductCode || '',
  description: li.Description || '',
  quantity: li.Quantity ?? 1,
  unitPrice: li.UnitPrice ?? 0,
  discount: li.Discount ?? 0,
});

const toApiLineItems = (rows) =>
  rows.map((row) => ({
    pricebookEntryId: row.pricebookEntryId,
    quantity: Number(row.quantity) || 0,
    unitPrice: Number(row.unitPrice) || 0,
    discount: Number(row.discount) || 0,
    description: row.description || null,
  }));

const EMPTY_HEADER = {
  name: '',
  opportunityId: null,
  opportunityName: '',
  accountName: '',
  expirationDate: '',
  description: '',
  discount: 0,
  tax: 0,
  shippingHandling: 0,
  status: '',
};

/**
 * QuoteBuilder - the B2B quotation & proposal generator. Renders as a modal
 * (this app's existing convention for every create/edit flow - see
 * ContractsView/LeadsBoard) rather than its own route.
 *
 * Four things this owns, matching the feature spec:
 *  1. Dynamic line item engine - add/remove/reorder/edit rows entirely in
 *     local state (see `lineItems`).
 *  2. Automatic financial calculations - `totals` below recomputes on every
 *     keystroke via utils/quoteCalculations.js, so the summary panel updates
 *     instantly with no round trip.
 *  3. Salesforce syncing - Save writes the Quote header then replaces its
 *     line items in one PUT (see handleSave), always linked to the chosen
 *     parent Opportunity.
 *  4. PDF generation & export - Download/Email render server-side (see
 *     quotesController.getQuotePdfLink/emailQuotePdf) using the exact same
 *     math, then the browser downloads or the backend emails it.
 */
export const QuoteBuilder = ({ quoteId: initialQuoteId, initialOpportunityId, onClose, onSaved, onDeleted }) => {
  const toast = useToast();
  const { user } = useAuth();

  const [currentQuoteId, setCurrentQuoteId] = useState(initialQuoteId || null);
  const [header, setHeader] = useState(() =>
    initialOpportunityId ? { ...EMPTY_HEADER, opportunityId: initialOpportunityId } : EMPTY_HEADER
  );
  const [lineItems, setLineItems] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [serverTotals, setServerTotals] = useState(null);
  const [quoteNumber, setQuoteNumber] = useState(null);

  const [isLoading, setIsLoading] = useState(Boolean(initialQuoteId));
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [emailPanelOpen, setEmailPanelOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailName, setEmailName] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isEditingExisting = Boolean(currentQuoteId);

  useEffect(() => {
    api.get('/salesforce/quotes/meta/statuses').then((res) => setStatuses(res.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!initialQuoteId) return undefined;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount loading flag, not derivable from props/state
    setIsLoading(true);
    setLoadError(null);

    api.get(`/salesforce/quotes/${initialQuoteId}`)
      .then((res) => {
        if (cancelled) return;
        const { quote, lineItems: fetchedLines } = res.data.data;
        setHeader({
          name: quote.Name || '',
          opportunityId: quote.OpportunityId,
          opportunityName: quote.Opportunity?.Name || '',
          accountName: quote.Opportunity?.Account?.Name || '',
          expirationDate: quote.ExpirationDate || '',
          description: quote.Description || '',
          discount: quote.Discount || 0,
          tax: quote.Tax || 0,
          shippingHandling: quote.ShippingHandling || 0,
          status: quote.Status || '',
        });
        setQuoteNumber(quote.QuoteNumber || null);
        setServerTotals({ subtotal: quote.Subtotal, grandTotal: quote.GrandTotal });
        setLineItems(fetchedLines.map(fromSalesforceLineItem));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err.message || 'Failed to load quote');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [initialQuoteId, initialOpportunityId]);

  const totals = useMemo(
    () => calculateQuoteTotals({ lineItems, discount: header.discount, tax: header.tax, shippingHandling: header.shippingHandling }),
    [lineItems, header.discount, header.tax, header.shippingHandling]
  );

  const updateHeader = (field, value) => setHeader((prev) => ({ ...prev, [field]: value }));

  const handleAddProduct = useCallback((product) => {
    setLineItems((prev) => [
      ...prev,
      {
        key: nextLocalKey(),
        pricebookEntryId: product.pricebookEntryId,
        productId: product.productId,
        name: product.name,
        productCode: product.productCode,
        description: '',
        quantity: 1,
        unitPrice: product.listPrice || 0,
        discount: 0,
      },
    ]);
  }, []);

  const updateLineItem = (key, field, value) => {
    setLineItems((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  };

  const removeLineItem = (key) => {
    setLineItems((prev) => prev.filter((row) => row.key !== key));
  };

  const moveLineItem = (key, direction) => {
    setLineItems((prev) => {
      const index = prev.findIndex((row) => row.key === key);
      const swapWith = index + direction;
      if (index === -1 || swapWith < 0 || swapWith >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[swapWith]] = [next[swapWith], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    if (!header.name.trim()) {
      toast.error('Quote name is required');
      return;
    }
    if (!header.opportunityId) {
      toast.error('Choose an Opportunity for this quote');
      return;
    }

    setIsSaving(true);
    try {
      const headerPayload = {
        Name: header.name.trim(),
        ExpirationDate: header.expirationDate || null,
        Description: header.description || null,
        Discount: header.discount || 0,
        Tax: header.tax || 0,
        ShippingHandling: header.shippingHandling || 0,
        ...(isEditingExisting && header.status ? { Status: header.status } : {}),
      };

      let idToUse = currentQuoteId;

      if (!idToUse) {
        const createRes = await api.post('/salesforce/quotes', { ...headerPayload, OpportunityId: header.opportunityId });
        idToUse = createRes.data.data.id;
        setCurrentQuoteId(idToUse);
        markSelfAction(idToUse);
      } else {
        await api.patch(`/salesforce/quotes/${idToUse}`, headerPayload);
        markSelfAction(idToUse);
      }

      const lineItemsRes = await api.put(`/salesforce/quotes/${idToUse}/line-items`, { lineItems: toApiLineItems(lineItems) });

      if (lineItemsRes.data.data?.orphanedOldIds?.length > 0) {
        toast.error(lineItemsRes.data.message || 'Some old line items could not be removed - please save again');
      } else {
        toast.success('Quote saved successfully');
      }

      // Refetch so the summary panel reflects Salesforce's own computed
      // Subtotal/GrandTotal rollups, not just our client-side preview.
      const refreshed = await api.get(`/salesforce/quotes/${idToUse}`);
      const { quote, lineItems: freshLines } = refreshed.data.data;
      setQuoteNumber(quote.QuoteNumber || null);
      setServerTotals({ subtotal: quote.Subtotal, grandTotal: quote.GrandTotal });
      setLineItems(freshLines.map(fromSalesforceLineItem));
      setHeader((prev) => ({ ...prev, status: quote.Status || prev.status }));

      onSaved?.();
    } catch (err) {
      toast.error(err.message || 'Failed to save quote');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!currentQuoteId) return;
    setIsDownloading(true);
    try {
      // Longer timeout than the axios default (30s): this endpoint fetches
      // the quote + line items from Salesforce and renders a PDF server-side
      // before responding, which is inherently slower than a plain CRUD
      // call - and on a free-tier host that's spun down from inactivity,
      // the cold start alone can eat 20-30s before that work even starts.
      const res = await api.get(`/salesforce/quotes/${currentQuoteId}/pdf`, { timeout: 60000 });
      await downloadFileFromLink(res.data.data);
    } catch (err) {
      toast.error(
        err.code === 'ECONNABORTED'
          ? 'Generating the PDF is taking longer than expected - the server may be waking up from idle. Please try again.'
          : err.message || 'Failed to generate quote PDF'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!currentQuoteId) return;
    setIsSendingEmail(true);
    try {
      // Same reasoning as handleDownloadPdf's timeout - this does the same
      // PDF generation plus an outbound SMTP send on top, both slower than
      // the 30s default is built for.
      await api.post(
        `/salesforce/quotes/${currentQuoteId}/email`,
        { to: emailTo, recipientName: emailName },
        { timeout: 60000 }
      );
      toast.success(`Quote emailed to ${emailTo}`);
      setEmailPanelOpen(false);
      setEmailTo('');
      setEmailName('');
    } catch (err) {
      toast.error(
        err.code === 'ECONNABORTED'
          ? 'Sending is taking longer than expected - the server may be waking up from idle. Please try again in a moment.'
          : err.message || 'Failed to email quote'
      );
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleDelete = async () => {
    if (!currentQuoteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/salesforce/quotes/${currentQuoteId}`);
      markSelfAction(currentQuoteId);
      toast.success('Quote deleted');
      onDeleted?.();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to delete quote');
    } finally {
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  return (
    <Modal isOpen title={isEditingExisting ? `${header.name || 'Quote'}${quoteNumber ? ` · #${quoteNumber}` : ''}` : 'New Quote'} onClose={onClose} maxWidth={880}>
      {isLoading ? (
        <div className="quote-builder-loading">Loading quote...</div>
      ) : loadError ? (
        <div className="quote-builder-error">{loadError}</div>
      ) : (
        <div className="quote-builder">
          <div className="quote-builder-header-fields">
            <div className="filter-group">
              <label>Quote Name *</label>
              <input type="text" value={header.name} onChange={(e) => updateHeader('name', e.target.value)} placeholder="e.g. Acme Corp - Annual License" />
            </div>

            {isEditingExisting ? (
              <div className="filter-group">
                <label>Opportunity</label>
                <div className="quote-builder-locked-field">{header.opportunityName} <span>({header.accountName})</span></div>
              </div>
            ) : (
              <OpportunityPicker
                value={header.opportunityId}
                label={header.opportunityName}
                onChange={(id, name) => setHeader((prev) => ({ ...prev, opportunityId: id, opportunityName: name }))}
              />
            )}

            <div className="quote-builder-header-row">
              <div className="filter-group">
                <label>Expiration Date</label>
                <input type="date" value={header.expirationDate || ''} onChange={(e) => updateHeader('expirationDate', e.target.value)} />
              </div>
              {isEditingExisting && (
                <div className="filter-group">
                  <label>Status</label>
                  <select value={header.status} onChange={(e) => updateHeader('status', e.target.value)}>
                    {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="filter-group">
              <label>Notes</label>
              <textarea rows={2} value={header.description} onChange={(e) => updateHeader('description', e.target.value)} />
            </div>
          </div>

          <div className="quote-builder-lines-section">
            <div className="quote-builder-lines-header">
              <h3>Products &amp; Services</h3>
              <ProductPicker
                opportunityId={header.opportunityId}
                disabled={!header.opportunityId}
                onSelect={handleAddProduct}
              />
            </div>

            {lineItems.length === 0 ? (
              <div className="quote-builder-empty-lines">
                <PlusIcon width={16} height={16} /> No line items yet - search for a product above to add one.
              </div>
            ) : (
              <div className="quote-lines-table-wrap">
                <table className="quote-lines-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Discount %</th>
                      <th>Line Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((row, index) => (
                      <tr key={row.key}>
                        <td className="quote-line-reorder">
                          <button type="button" disabled={index === 0} onClick={() => moveLineItem(row.key, -1)} aria-label="Move up">▲</button>
                          <button type="button" disabled={index === lineItems.length - 1} onClick={() => moveLineItem(row.key, 1)} aria-label="Move down">▼</button>
                        </td>
                        <td>
                          <div className="quote-line-product-name">{row.name}</div>
                          {row.productCode && <div className="quote-line-product-code">{row.productCode}</div>}
                          <input
                            type="text"
                            className="quote-line-description"
                            placeholder="Optional line description"
                            value={row.description}
                            onChange={(e) => updateLineItem(row.key, 'description', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            className="quote-line-number-input"
                            value={row.quantity}
                            onChange={(e) => updateLineItem(row.key, 'quantity', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="quote-line-number-input"
                            value={row.unitPrice}
                            onChange={(e) => updateLineItem(row.key, 'unitPrice', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            className="quote-line-number-input"
                            value={row.discount}
                            onChange={(e) => updateLineItem(row.key, 'discount', e.target.value)}
                          />
                        </td>
                        <td className="quote-line-total">{formatCurrency(calculateLineTotal(row))}</td>
                        <td>
                          <button type="button" className="quote-line-remove" onClick={() => removeLineItem(row.key)} aria-label="Remove line item">
                            <TrashIcon width={14} height={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="quote-builder-summary">
            <div className="quote-builder-summary-inputs">
              <div className="filter-group">
                <label>Discount %</label>
                <input type="number" min="0" max="100" value={header.discount} onChange={(e) => updateHeader('discount', e.target.value)} />
              </div>
              <div className="filter-group">
                <label>Tax ($)</label>
                <input type="number" min="0" step="0.01" value={header.tax} onChange={(e) => updateHeader('tax', e.target.value)} />
              </div>
              <div className="filter-group">
                <label>Shipping &amp; Handling ($)</label>
                <input type="number" min="0" step="0.01" value={header.shippingHandling} onChange={(e) => updateHeader('shippingHandling', e.target.value)} />
              </div>
            </div>

            <div className="quote-builder-totals">
              <div className="quote-total-row"><span>Subtotal</span><strong>{formatCurrency(totals.subtotal)}</strong></div>
              <div className="quote-total-row"><span>Discount</span><strong>-{formatCurrency(totals.discountAmount)}</strong></div>
              <div className="quote-total-row"><span>Tax</span><strong>{formatCurrency(totals.tax)}</strong></div>
              <div className="quote-total-row"><span>Shipping &amp; Handling</span><strong>{formatCurrency(totals.shippingHandling)}</strong></div>
              <div className="quote-total-row quote-total-grand"><span>Grand Total</span><strong>{formatCurrency(totals.grandTotal)}</strong></div>
              {serverTotals?.grandTotal !== undefined && serverTotals?.grandTotal !== null && (
                <div className="quote-total-server-note">Salesforce total as of last save: {formatCurrency(serverTotals.grandTotal)}</div>
              )}
            </div>
          </div>

          {emailPanelOpen && (
            <form className="quote-email-panel" onSubmit={handleSendEmail}>
              <div className="quote-builder-header-row">
                <div className="filter-group">
                  <label>Recipient Email *</label>
                  <input type="email" required value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="client@company.com" />
                </div>
                <div className="filter-group">
                  <label>Recipient Name</label>
                  <input type="text" value={emailName} onChange={(e) => setEmailName(e.target.value)} />
                </div>
              </div>
              <div className="confirm-actions">
                <button type="button" className="btn-modal-secondary" onClick={() => setEmailPanelOpen(false)} disabled={isSendingEmail}>Cancel</button>
                <button type="submit" className="btn-modal-primary" disabled={isSendingEmail}>{isSendingEmail ? 'Sending...' : 'Send Quote'}</button>
              </div>
            </form>
          )}

          <div className="quote-builder-actions">
            <div className="quote-builder-actions-left">
              {canManageSalesforceRecords(user) && isEditingExisting && (
                <button type="button" className="btn-modal-secondary danger-text" onClick={() => setIsDeleteConfirmOpen(true)}>
                  Delete Quote
                </button>
              )}
            </div>
            <div className="quote-builder-actions-right">
              {isEditingExisting && (
                <>
                  <button type="button" className="btn-modal-secondary" onClick={handleDownloadPdf} disabled={isDownloading}>
                    <DownloadIcon width={15} height={15} /> {isDownloading ? 'Preparing...' : 'Download PDF'}
                  </button>
                  <button type="button" className="btn-modal-secondary" onClick={() => setEmailPanelOpen((v) => !v)}>
                    <MailIcon width={15} height={15} /> Email PDF
                  </button>
                </>
              )}
              <button type="button" className="btn-modal-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Quote'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete this quote?"
        message="This permanently deletes the quote and its line items from Salesforce. This can't be undone."
        confirmLabel="Delete Quote"
        danger
        isLoading={isDeleting}
      />
    </Modal>
  );
};

export default QuoteBuilder;
