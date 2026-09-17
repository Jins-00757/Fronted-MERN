import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/useToast';
import { markSelfAction } from '../../utils/recentSelfActions';
import { downloadFileFromLink } from '../../utils/secureDownload';
import { calculateLineTotal, calculateQuoteTotals, formatCurrency } from '../../utils/quoteCalculations';
import { draftQuoteDiscountJustification } from '../../services/aiActionsApi';
import { useRecordPresence } from '../../hooks/usePresence';
import { PresenceAvatars } from '../ui/PresenceAvatars';
import { ConflictResolutionModal } from '../ui/ConflictResolutionModal';
import { Modal } from '../ui/Modal';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { OpportunityPicker, ProductPicker } from './RecordPickers';
import { TrashIcon, DownloadIcon, MailIcon, PlusIcon, AlertTriangleIcon } from '../ui/DashboardIcons';
import { canManageSalesforceRecords } from '../../utils/permissions';
import { useAuth } from '../../context/useAuth';
import './QuoteBuilder.css';

// Above this discount depth (header or any single line item), the UI offers
// an AI-drafted justification note the rep can send their manager for
// approval - see quotesController.submitDiscountJustification on the backend.
const DISCOUNT_JUSTIFICATION_THRESHOLD = 15;

// Local header state key -> the Salesforce Quote field it maps to. Drives
// both the diff handleSave() sends on an edit (only actually-changed fields,
// each paired with its loaded "base" value for the conflict model's 3-way
// merge - see Backend-MERN's conflictResolutionService.js) and
// ConflictResolutionModal's field labels.
const HEADER_FIELD_MAP = [
  ['name', 'Name'],
  ['expirationDate', 'ExpirationDate'],
  ['description', 'Description'],
  ['discount', 'Discount'],
  ['tax', 'Tax'],
  ['shippingHandling', 'ShippingHandling'],
  ['status', 'Status'],
];

const QUOTE_FIELD_LABELS = {
  Name: 'Quote Name',
  ExpirationDate: 'Expiration Date',
  Description: 'Notes',
  Discount: 'Discount %',
  Tax: 'Tax',
  ShippingHandling: 'Shipping & Handling',
  Status: 'Status',
};

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
  accountId: null,
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
  // Recipients are never free-typed - only Contacts Salesforce already
  // associates with this quote's Account (see quotesController.
  // getQuoteRecipients/emailQuotePdf, which enforces the same restriction
  // server-side regardless of what this UI sends).
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState(null);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [justificationText, setJustificationText] = useState('');
  const [isDraftingJustification, setIsDraftingJustification] = useState(false);
  const [isSubmittingJustification, setIsSubmittingJustification] = useState(false);
  const [justificationSubmittedAt, setJustificationSubmittedAt] = useState(null);

  // The header exactly as loaded (or as last successfully saved) - handleSave
  // diffs the live `header` state against this to find which fields the rep
  // actually touched, and `baseLastModifiedDate` is the conflict model's
  // optimistic-concurrency version stamp (see conflictResolutionService.js
  // on the backend). A ref, not state: it's only ever read at save time, not
  // rendered, so it shouldn't trigger re-renders when updated.
  const baseHeaderRef = useRef(EMPTY_HEADER);
  const [baseLastModifiedDate, setBaseLastModifiedDate] = useState(null);
  // null | { id, conflictLogId, conflicts, liveRecord, liveLastModifiedDate }
  const [conflictState, setConflictState] = useState(null);

  const isEditingExisting = Boolean(currentQuoteId);

  // Soft, informational presence signal only (see hooks/usePresence.js) -
  // the conflict model above is what actually catches a real collision.
  const viewers = useRecordPresence('Quote', currentQuoteId);
  const otherViewers = viewers.filter((v) => v.userId !== user?._id);

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
        const loadedHeader = {
          name: quote.Name || '',
          opportunityId: quote.OpportunityId,
          opportunityName: quote.Opportunity?.Name || '',
          accountId: quote.Opportunity?.AccountId || null,
          accountName: quote.Opportunity?.Account?.Name || '',
          expirationDate: quote.ExpirationDate || '',
          description: quote.Description || '',
          discount: quote.Discount || 0,
          tax: quote.Tax || 0,
          shippingHandling: quote.ShippingHandling || 0,
          status: quote.Status || '',
        };
        setHeader(loadedHeader);
        baseHeaderRef.current = loadedHeader;
        setBaseLastModifiedDate(quote.LastModifiedDate || null);
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

  // Worst-case discount depth across the header and every line item - a deep
  // line-level discount matters just as much as a deep header discount, so
  // the justification prompt looks at whichever is higher.
  const headerDiscount = Number(header.discount) || 0;
  const maxLineDiscount = useMemo(
    () => lineItems.reduce((max, row) => Math.max(max, Number(row.discount) || 0), 0),
    [lineItems]
  );
  const maxDiscountPercent = Math.max(headerDiscount, maxLineDiscount);
  const needsDiscountJustification = maxDiscountPercent > DISCOUNT_JUSTIFICATION_THRESHOLD;

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

  /**
   * Shared tail of every successful header write (create, plain edit, or a
   * resolved-conflict retry): save line items, then refetch so the summary
   * panel reflects Salesforce's own computed rollups and this quote's
   * conflict-model baseline (header snapshot + LastModifiedDate) is current
   * for the next save.
   */
  const saveLineItemsAndRefresh = async (idToUse) => {
    const lineItemsRes = await api.put(`/salesforce/quotes/${idToUse}/line-items`, { lineItems: toApiLineItems(lineItems) });

    if (lineItemsRes.data.data?.orphanedOldIds?.length > 0) {
      toast.error(lineItemsRes.data.message || 'Some old line items could not be removed - please save again');
    } else {
      toast.success('Quote saved successfully');
    }

    const refreshed = await api.get(`/salesforce/quotes/${idToUse}`);
    const { quote, lineItems: freshLines } = refreshed.data.data;
    const refreshedHeader = {
      name: quote.Name || '',
      opportunityId: quote.OpportunityId,
      opportunityName: quote.Opportunity?.Name || '',
      accountId: quote.Opportunity?.AccountId || null,
      accountName: quote.Opportunity?.Account?.Name || '',
      expirationDate: quote.ExpirationDate || '',
      description: quote.Description || '',
      discount: quote.Discount || 0,
      tax: quote.Tax || 0,
      shippingHandling: quote.ShippingHandling || 0,
      status: quote.Status || '',
    };
    setQuoteNumber(quote.QuoteNumber || null);
    setServerTotals({ subtotal: quote.Subtotal, grandTotal: quote.GrandTotal });
    setLineItems(freshLines.map(fromSalesforceLineItem));
    setHeader(refreshedHeader);
    baseHeaderRef.current = refreshedHeader;
    setBaseLastModifiedDate(quote.LastModifiedDate || null);

    onSaved?.();
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
      let idToUse = currentQuoteId;

      if (!idToUse) {
        const headerPayload = {
          Name: header.name.trim(),
          ExpirationDate: header.expirationDate || null,
          Description: header.description || null,
          Discount: header.discount || 0,
          Tax: header.tax || 0,
          ShippingHandling: header.shippingHandling || 0,
        };
        const createRes = await api.post('/salesforce/quotes', { ...headerPayload, OpportunityId: header.opportunityId });
        idToUse = createRes.data.data.id;
        setCurrentQuoteId(idToUse);
        markSelfAction(idToUse);
      } else {
        // Only send fields the rep actually changed, each paired with the
        // value it had when this quote loaded - the conflict model's 3-way
        // merge needs that "base" to tell "nobody else touched this field"
        // apart from a real conflict. Resending every field unconditionally
        // (as this used to do) would falsely flag a conflict on any field
        // the rep never touched but someone else did.
        const changedFields = {};
        const baseValues = {};
        HEADER_FIELD_MAP.forEach(([localKey, sfField]) => {
          const current = localKey === 'name' ? header.name.trim() : header[localKey];
          const base = baseHeaderRef.current[localKey];
          if (localKey === 'status' && !current) return; // never overwrite Status with empty
          if (String(current ?? '') !== String(base ?? '')) {
            changedFields[sfField] = current;
            baseValues[sfField] = base;
          }
        });

        if (Object.keys(changedFields).length > 0) {
          try {
            const res = await api.patch(`/salesforce/quotes/${idToUse}`, { ...changedFields, baseLastModifiedDate, baseValues });
            if (res.data.data?.mergedWithConcurrentChanges) {
              toast.info('This quote was also updated elsewhere - your header changes were merged in safely');
            }
          } catch (err) {
            if (err.status === 409 && err.response?.data?.code === 'CONFLICT') {
              setConflictState({ id: idToUse, ...err.response.data.data });
              return;
            }
            if (err.status === 409 && err.response?.data?.code === 'CONFLICT_DELETED') {
              toast.error(err.response.data.message);
              onClose();
              return;
            }
            throw err;
          }
          markSelfAction(idToUse);
        }
      }

      await saveLineItemsAndRefresh(idToUse);
    } catch (err) {
      toast.error(err.message || 'Failed to save quote');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResolveConflict = async (resolvedFields) => {
    if (!conflictState) return;
    setIsSaving(true);
    try {
      // Re-checks against the record's CURRENT state (the live timestamp
      // captured at detection time becomes the new baseline) - if yet
      // another edit landed while the rep was resolving this one, that
      // surfaces as a fresh conflict rather than being silently trusted.
      const baseValues = {};
      conflictState.conflicts.forEach((c) => { baseValues[c.field] = c.liveValue; });

      const res = await api.patch(`/salesforce/quotes/${conflictState.id}`, {
        ...resolvedFields,
        baseLastModifiedDate: conflictState.liveLastModifiedDate,
        baseValues,
        conflictLogId: conflictState.conflictLogId,
      });

      if (res.data.data?.mergedWithConcurrentChanges) {
        toast.info('Conflict resolved - this quote was also updated elsewhere');
      }
      markSelfAction(conflictState.id);
      setConflictState(null);
      await saveLineItemsAndRefresh(conflictState.id);
    } catch (err) {
      if (err.status === 409 && err.response?.data?.code === 'CONFLICT') {
        toast.error('This quote changed again while you were resolving the last conflict - please review the new differences.');
        setConflictState({ id: conflictState.id, ...err.response.data.data });
      } else {
        toast.error(err.message || 'Failed to save resolved changes');
      }
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

  // Fetch the quote's related Account's contacts the moment the Email panel
  // opens (not eagerly on load - most quote edits never open it) - this is
  // the *only* source of recipients the panel ever offers, since
  // quotesController.emailQuotePdf resolves and validates the address
  // server-side from this exact same relationship, never from client input.
  useEffect(() => {
    if (!emailPanelOpen || !currentQuoteId) return undefined;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-panel-open loading flag, not derivable from props/state
    setContactsLoading(true);
    setContactsError(null);

    api.get(`/salesforce/quotes/${currentQuoteId}/recipients`)
      .then((res) => {
        if (cancelled) return;
        const recipients = res.data.data || [];
        setContacts(recipients);
        setSelectedContactId(recipients.length > 0 ? recipients[0].contactId : '');
      })
      .catch((err) => {
        if (!cancelled) setContactsError(err.message || 'Failed to load contacts for this account');
      })
      .finally(() => {
        if (!cancelled) setContactsLoading(false);
      });

    return () => { cancelled = true; };
  }, [emailPanelOpen, currentQuoteId]);

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!currentQuoteId || !selectedContactId) return;
    setIsSendingEmail(true);
    try {
      const recipient = contacts.find((c) => c.contactId === selectedContactId);
      // Same reasoning as handleDownloadPdf's timeout - this does the same
      // PDF generation plus an outbound SMTP send on top, both slower than
      // the 30s default is built for.
      await api.post(
        `/salesforce/quotes/${currentQuoteId}/email`,
        { contactId: selectedContactId },
        { timeout: 60000 }
      );
      toast.success(`Quote emailed to ${recipient?.name || 'contact'} (${recipient?.email || ''})`);
      setEmailPanelOpen(false);
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

  const handleDraftJustification = async () => {
    setIsDraftingJustification(true);
    try {
      const { text } = await draftQuoteDiscountJustification({
        quoteId: currentQuoteId,
        quoteName: header.name || 'this quote',
        accountName: header.accountName,
        grandTotal: totals.grandTotal,
        discountPercent: maxDiscountPercent,
        isLineLevel: maxLineDiscount > headerDiscount,
      });
      setJustificationText(text);
    } catch (err) {
      toast.error(err.message || 'Failed to draft a justification note');
    } finally {
      setIsDraftingJustification(false);
    }
  };

  const handleSubmitJustification = async () => {
    if (!currentQuoteId) {
      toast.error('Save the quote before submitting a discount justification');
      return;
    }
    if (!justificationText.trim()) {
      toast.error('Write or generate a justification note first');
      return;
    }

    setIsSubmittingJustification(true);
    try {
      const res = await api.post(`/salesforce/quotes/${currentQuoteId}/discount-justification`, {
        opportunityId: header.opportunityId,
        quoteName: header.name,
        accountName: header.accountName,
        discountPercent: maxDiscountPercent,
        justificationText: justificationText.trim(),
      });
      toast.success(res.data.message || 'Discount justification submitted');
      setJustificationSubmittedAt(new Date());
    } catch (err) {
      toast.error(err.message || 'Failed to submit discount justification');
    } finally {
      setIsSubmittingJustification(false);
    }
  };

  return (
    <>
    <Modal isOpen title={isEditingExisting ? `${header.name || 'Quote'}${quoteNumber ? ` · #${quoteNumber}` : ''}` : 'New Quote'} onClose={onClose} maxWidth={880}>
      {otherViewers.length > 0 && (
        <div className="quote-presence-banner">
          <PresenceAvatars users={otherViewers} size={22} />
          <span>{otherViewers.map((v) => v.name).join(', ')} {otherViewers.length === 1 ? 'is' : 'are'} also viewing this quote</span>
        </div>
      )}
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
                onChange={(id, name, accountId) =>
                  setHeader((prev) => ({ ...prev, opportunityId: id, opportunityName: name, accountId: accountId || null }))
                }
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

          {needsDiscountJustification && (
            <div className="quote-discount-justification">
              <div className="quote-discount-justification-header">
                <AlertTriangleIcon width={15} height={15} />
                <strong>Discount Justification Required</strong>
                <span>{maxDiscountPercent}% discount exceeds the {DISCOUNT_JUSTIFICATION_THRESHOLD}% approval threshold</span>
              </div>

              {justificationSubmittedAt ? (
                <p className="quote-discount-justification-done">
                  Submitted to your manager at {justificationSubmittedAt.toLocaleTimeString()}.
                </p>
              ) : (
                <>
                  <textarea
                    rows={3}
                    placeholder="Explain why this discount is warranted, or generate a draft with AI..."
                    value={justificationText}
                    onChange={(e) => setJustificationText(e.target.value)}
                  />
                  <div className="quote-discount-justification-actions">
                    <button type="button" className="btn-modal-secondary" onClick={handleDraftJustification} disabled={isDraftingJustification}>
                      {isDraftingJustification ? 'Drafting...' : '✨ Draft with AI'}
                    </button>
                    <button
                      type="button"
                      className="btn-modal-primary"
                      onClick={handleSubmitJustification}
                      disabled={isSubmittingJustification || !justificationText.trim()}
                    >
                      {isSubmittingJustification ? 'Submitting...' : 'Submit to Manager'}
                    </button>
                  </div>
                  {!isEditingExisting && (
                    <p className="quote-discount-justification-hint">Save the quote first so it has an id to attach this to.</p>
                  )}
                </>
              )}
            </div>
          )}

          {emailPanelOpen && (
            <form className="quote-email-panel" onSubmit={handleSendEmail}>
              {contactsLoading ? (
                <div className="quote-email-panel-status">Loading contacts for {header.accountName || 'this account'}...</div>
              ) : contactsError ? (
                <div className="quote-email-panel-status quote-email-panel-error">{contactsError}</div>
              ) : contacts.length === 0 ? (
                <div className="quote-email-panel-status">
                  No contacts with an email address on file for {header.accountName || 'this account'}. Add a
                  contact with an email in Salesforce, then try again.
                </div>
              ) : (
                <div className="filter-group">
                  <label>Send To *</label>
                  <select value={selectedContactId} onChange={(e) => setSelectedContactId(e.target.value)} required>
                    {contacts.map((c) => (
                      <option key={c.contactId} value={c.contactId}>
                        {c.name}{c.title ? ` · ${c.title}` : ''} — {c.email}
                      </option>
                    ))}
                  </select>
                  <span className="quote-email-panel-hint">
                    Quotes can only be sent to a contact on {header.accountName || 'this'} account's Salesforce record.
                  </span>
                </div>
              )}
              <div className="confirm-actions">
                <button type="button" className="btn-modal-secondary" onClick={() => setEmailPanelOpen(false)} disabled={isSendingEmail}>Cancel</button>
                <button
                  type="submit"
                  className="btn-modal-primary"
                  disabled={isSendingEmail || contactsLoading || contacts.length === 0 || !selectedContactId}
                >
                  {isSendingEmail ? 'Sending...' : 'Send Quote'}
                </button>
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

    <ConflictResolutionModal
      conflict={conflictState}
      onResolve={handleResolveConflict}
      onCancel={() => setConflictState(null)}
      isSubmitting={isSaving}
      fieldLabels={QUOTE_FIELD_LABELS}
    />
    </>
  );
};

export default QuoteBuilder;
