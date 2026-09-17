import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import './ConflictResolutionModal.css';

const formatValue = (value) => {
  if (value === null || value === undefined || value === '') return '(empty)';
  return String(value);
};

/**
 * ConflictResolutionModal - generic field-by-field conflict resolution UI,
 * driven entirely by the conflict payload a 409 response carries (see
 * Backend-MERN's conflictResolutionService.buildConflictResponse). This
 * component knows nothing about Opportunity vs Quote specifics - any save
 * flow that sends `baseLastModifiedDate`/`baseValues` and handles a 409 the
 * same way can reuse it unchanged.
 *
 * `conflict.conflicts`: [{ field, baseValue, liveValue, incomingValue }]
 * `onResolve(resolvedFields)`: called once every conflicting field has a
 * chosen value - `resolvedFields` maps field -> the value to save.
 */
export const ConflictResolutionModal = ({ conflict, onResolve, onCancel, isSubmitting, fieldLabels = {} }) => {
  const [choices, setChoices] = useState({});
  const [customValues, setCustomValues] = useState({});

  useEffect(() => {
    if (!conflict) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting per-field choices for whichever conflict was just opened, not derivable from props/state
    setChoices({});
    setCustomValues({});
  }, [conflict]);

  if (!conflict) return null;

  const allChosen = conflict.conflicts.every((c) => choices[c.field]);

  const handleResolve = () => {
    const resolvedFields = {};
    conflict.conflicts.forEach((c) => {
      const choice = choices[c.field];
      resolvedFields[c.field] = choice === 'mine' ? c.incomingValue : choice === 'theirs' ? c.liveValue : customValues[c.field];
    });
    onResolve(resolvedFields);
  };

  return (
    <Modal isOpen title="Resolve Conflicting Changes" onClose={onCancel} maxWidth={640}>
      <div className="conflict-modal">
        <p className="conflict-modal-intro">
          This record was changed by someone else while you were editing it. Choose which value to keep for each
          field below - nothing has been saved yet.
        </p>

        {conflict.conflicts.map((c) => (
          <div key={c.field} className="conflict-field">
            <div className="conflict-field-name">{fieldLabels[c.field] || c.field}</div>

            <label className={`conflict-option ${choices[c.field] === 'theirs' ? 'selected' : ''}`}>
              <input
                type="radio"
                name={`conflict-${c.field}`}
                checked={choices[c.field] === 'theirs'}
                onChange={() => setChoices((prev) => ({ ...prev, [c.field]: 'theirs' }))}
              />
              <span className="conflict-option-label">Keep current value</span>
              <span className="conflict-option-value">{formatValue(c.liveValue)}</span>
            </label>

            <label className={`conflict-option ${choices[c.field] === 'mine' ? 'selected' : ''}`}>
              <input
                type="radio"
                name={`conflict-${c.field}`}
                checked={choices[c.field] === 'mine'}
                onChange={() => setChoices((prev) => ({ ...prev, [c.field]: 'mine' }))}
              />
              <span className="conflict-option-label">Keep my value</span>
              <span className="conflict-option-value">{formatValue(c.incomingValue)}</span>
            </label>

            <label className={`conflict-option conflict-option-custom ${choices[c.field] === 'custom' ? 'selected' : ''}`}>
              <input
                type="radio"
                name={`conflict-${c.field}`}
                checked={choices[c.field] === 'custom'}
                onChange={() => setChoices((prev) => ({ ...prev, [c.field]: 'custom' }))}
              />
              <span className="conflict-option-label">Custom</span>
              <input
                type="text"
                className="conflict-custom-input"
                placeholder="Enter a value..."
                value={customValues[c.field] ?? ''}
                onFocus={() => setChoices((prev) => ({ ...prev, [c.field]: 'custom' }))}
                onChange={(e) => {
                  setCustomValues((prev) => ({ ...prev, [c.field]: e.target.value }));
                  setChoices((prev) => ({ ...prev, [c.field]: 'custom' }));
                }}
              />
            </label>

            <div className="conflict-field-base">Your starting value was: {formatValue(c.baseValue)}</div>
          </div>
        ))}

        <div className="confirm-actions">
          <button type="button" className="btn-modal-secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="button" className="btn-modal-primary" onClick={handleResolve} disabled={!allChosen || isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Resolved Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConflictResolutionModal;
