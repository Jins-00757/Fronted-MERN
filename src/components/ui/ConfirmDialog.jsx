import { Modal } from './Modal';

/**
 * ConfirmDialog - replaces window.confirm() for destructive/important
 * actions (closing or deleting an opportunity - see OpportunitiesList.jsx)
 * with a dismissible, on-brand dialog instead of a blocking browser prompt.
 */
export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  isLoading = false,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth={420}>
    <p className="confirm-message">{message}</p>
    <div className="confirm-actions">
      <button type="button" className="btn-modal-secondary" onClick={onClose} disabled={isLoading}>
        {cancelLabel}
      </button>
      <button
        type="button"
        className={`btn-modal-primary ${danger ? 'danger' : ''}`}
        onClick={onConfirm}
        disabled={isLoading}
      >
        {isLoading ? 'Working...' : confirmLabel}
      </button>
    </div>
  </Modal>
);

export default ConfirmDialog;
