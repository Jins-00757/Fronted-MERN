
import api from './api';

/**
 * Thin wrappers around the row-level AI action endpoints (see Backend-MERN's
 * aiActionsController.js). Each returns just the `data` payload - callers
 * handle their own loading/error state (these actions are triggered
 * per-row/per-field, so a shared hook's state would collide across
 * simultaneous calls).
 */

export const draftQuoteEmail = (quoteId) =>
  api.post(`/ai/quotes/${quoteId}/draft-email`).then((res) => res.data.data);

export const getQuoteRisk = (quoteId) =>
  api.post(`/ai/quotes/${quoteId}/risk`).then((res) => res.data.data);

export const draftQuoteDiscountJustification = (payload) =>
  api.post('/ai/quotes/discount-justification', payload).then((res) => res.data.data);

export const getAccountActivitySummary = (accountId) =>
  api.post(`/ai/accounts/${accountId}/activity-summary`).then((res) => res.data.data);

export const generateOpportunityExecSummary = (payload) =>
  api.post('/ai/opportunities/exec-summary', payload).then((res) => res.data.data);

export const parseSearchQuery = (query) =>
  api.post('/ai/search/parse-query', { query }).then((res) => res.data.data);
