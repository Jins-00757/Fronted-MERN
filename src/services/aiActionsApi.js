
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

/**
 * CRM Actions Assistant (Groq function calling - see Backend-MERN's
 * aiToolsService.js). sendAssistantMessage may return a `pendingAction` the
 * caller must show the user and get explicit confirmation on before ever
 * calling confirmAssistantAction - that second call is what actually
 * executes a real Salesforce write (via jsforce), never the message call.
 */
export const sendAssistantMessage = (payload) =>
  api.post('/ai/assistant/message', payload).then((res) => res.data.data);

export const confirmAssistantAction = (payload) =>
  api.post('/ai/assistant/confirm', payload).then((res) => res.data.data);
