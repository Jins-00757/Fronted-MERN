import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import { useToast } from '../../context/useToast';
import { markSelfAction } from '../../utils/recentSelfActions';
import { EditIcon, TrashIcon, CheckCircleIcon, XIcon } from '../ui/DashboardIcons';
import './OpportunitiesBoard.css';

const STAGES = [
  'Prospecting',
  'Qualification',
  'Needs Analysis',
  'Value Proposition',
  'Id. Decision Makers',
  'Perception Analysis',
  'Proposal/Price Quote',
  'Negotiation/Review',
  'Closed Won',
  'Closed Lost',
];

const STAGE_COLORS = {
  Prospecting: '#3b82f6',
  Qualification: '#06b6d4',
  'Needs Analysis': '#6366f1',
  'Value Proposition': '#8b5cf6',
  'Id. Decision Makers': '#a855f7',
  'Perception Analysis': '#ec4899',
  'Proposal/Price Quote': '#f97316',
  'Negotiation/Review': '#eab308',
  'Closed Won': '#10b981',
  'Closed Lost': '#ef4444',
};

// Kanban view fetches a single larger batch instead of the table's
// pagination - the point of a board is seeing the whole pipeline across
// every stage at once. 200 is comfortably under the /salesforce/opportunities
// route's own 500-record ceiling (see opportunitiesController.getOpportunities).
const BOARD_FETCH_LIMIT = 200;

const formatCurrency = (amount) => `$${(amount || 0).toLocaleString()}`;

/**
 * OpportunitiesBoard - drag-and-drop Kanban view of Opportunities by stage.
 * Dragging a card to a new column PATCHes the exact same authenticated,
 * rate-limited /api/salesforce/opportunities/:id endpoint the edit modal
 * uses (see opportunitiesController.updateOpportunity) - no new backend
 * surface, so it automatically gets the same stage-change email, activity
 * feed entry, and cache invalidation as any other stage change, for free.
 */
export const OpportunitiesBoard = ({ refreshKey, onEdit, onDelete, onCloseWon, onCloseLost, onMutated }) => {
  const toast = useToast();
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const columnRefs = useRef({});

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/refresh loading flag, not derivable from props/state
    setIsLoading(true);
    setError(null);

    api
      .get('/salesforce/opportunities', { params: { limit: BOARD_FETCH_LIMIT, offset: 0 } })
      .then((response) => {
        if (!cancelled && response.data.success) {
          setOpportunities(response.data.data?.records || []);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load board');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const handleDrop = async (opportunity, newStage) => {
    if (newStage === opportunity.StageName || pendingIds.has(opportunity.Id)) return;

    const previousStage = opportunity.StageName;
    markSelfAction(opportunity.Id, opportunity.Name);

    // Optimistic move - the card should settle into its new column the
    // instant the drag ends, not after a network round trip.
    setOpportunities((prev) =>
      prev.map((o) => (o.Id === opportunity.Id ? { ...o, StageName: newStage } : o))
    );
    setPendingIds((prev) => new Set(prev).add(opportunity.Id));

    try {
      await api.patch(`/salesforce/opportunities/${opportunity.Id}`, { StageName: newStage });
      toast.success(`"${opportunity.Name}" moved to ${newStage}`);
      onMutated?.();
    } catch (err) {
      // Roll back on failure - a drag must never silently lie about where
      // the deal actually is in Salesforce.
      setOpportunities((prev) =>
        prev.map((o) => (o.Id === opportunity.Id ? { ...o, StageName: previousStage } : o))
      );
      toast.error(err.message || 'Failed to move opportunity');
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(opportunity.Id);
        return next;
      });
    }
  };

  if (error) return <div className="opp-error-banner">{error}</div>;
  if (isLoading) return <div className="board-loading">Loading board...</div>;

  return (
    <div className="kanban-board">
      {STAGES.map((stage) => {
        const cards = opportunities.filter((o) => o.StageName === stage);
        const stageValue = cards.reduce((sum, o) => sum + (o.Amount || 0), 0);

        return (
          <div
            key={stage}
            className="kanban-column"
            ref={(el) => {
              columnRefs.current[stage] = el;
            }}
          >
            <div className="kanban-column-header" style={{ borderTopColor: STAGE_COLORS[stage] || '#6b7280' }}>
              <span className="kanban-column-title">{stage}</span>
              <span className="kanban-column-count">{cards.length}</span>
            </div>
            <div className="kanban-column-value">{formatCurrency(stageValue)}</div>

            <div className="kanban-column-body">
              <AnimatePresence>
                {cards.map((opp) => (
                  <KanbanCard
                    key={opp.Id}
                    opportunity={opp}
                    columnRefs={columnRefs}
                    isPending={pendingIds.has(opp.Id)}
                    onDrop={handleDrop}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onCloseWon={onCloseWon}
                    onCloseLost={onCloseLost}
                  />
                ))}
              </AnimatePresence>
              {cards.length === 0 && <div className="kanban-empty">No deals</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const KanbanCard = ({ opportunity, columnRefs, isPending, onDrop, onEdit, onDelete, onCloseWon, onCloseLost }) => {
  const handleDragEnd = (_event, info) => {
    const { x, y } = info.point;
    for (const stage of Object.keys(columnRefs.current)) {
      const el = columnRefs.current[stage];
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        onDrop(opportunity, stage);
        return;
      }
    }
  };

  const isClosed = Boolean(opportunity.StageName?.startsWith('Closed'));

  return (
    <motion.div
      className={`kanban-card ${isPending ? 'is-pending' : ''}`}
      layout
      drag={!isPending}
      dragSnapToOrigin
      dragElastic={0.15}
      dragMomentum={false}
      whileDrag={{ scale: 1.04, zIndex: 30, boxShadow: '0 14px 28px rgba(0,0,0,0.3)' }}
      onDragEnd={handleDragEnd}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <div className="kanban-card-name">{opportunity.Name}</div>
      <div className="kanban-card-amount">{formatCurrency(opportunity.Amount)}</div>
      {opportunity.CloseDate && (
        <div className="kanban-card-date">{new Date(opportunity.CloseDate).toLocaleDateString()}</div>
      )}

      <div className="kanban-card-actions">
        <button
          type="button"
          className="kanban-icon-btn"
          title="Edit"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onEdit(opportunity)}
        >
          <EditIcon width={13} height={13} />
        </button>
        {!isClosed && (
          <>
            <button
              type="button"
              className="kanban-icon-btn success"
              title="Close as Won"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onCloseWon(opportunity)}
            >
              <CheckCircleIcon width={13} height={13} />
            </button>
            <button
              type="button"
              className="kanban-icon-btn warning"
              title="Close as Lost"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onCloseLost(opportunity)}
            >
              <XIcon width={13} height={13} />
            </button>
          </>
        )}
        <button
          type="button"
          className="kanban-icon-btn danger"
          title="Delete"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onDelete(opportunity)}
        >
          <TrashIcon width={13} height={13} />
        </button>
      </div>

      {isPending && <div className="kanban-card-syncing">Syncing…</div>}
    </motion.div>
  );
};

export default OpportunitiesBoard;
