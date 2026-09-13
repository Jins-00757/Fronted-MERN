import { useState } from 'react';
import useSalesforceData from '../../hooks/useSalesforceData';
import api from '../../services/api';
import './styles/OpportunitiesManager.css';

/**
 * OpportunitiesManager - Create, read, update, delete opportunities
 */
export const OpportunitiesManager = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({
    stage: '',
    amountMin: '',
    amountMax: '',
  });

  const { data: opportunities, loading, error, refetch } =
    useSalesforceData('/salesforce/opportunities', {
      autoRefresh: true,
      refreshInterval: 120000, // 2 minutes
    });

  const handleCreateOpportunity = async (formData) => {
    try {
      const response = await api.post('/salesforce/opportunities', formData);

      if (response.data.success) {
        setShowCreateForm(false);
        refetch();
        alert('Opportunity created successfully');
      }
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleUpdateOpportunity = async (id, updates) => {
    try {
      const response = await api.patch(
        `/salesforce/opportunities/${id}`,
        updates
      );

      if (response.data.success) {
        setEditingId(null);
        refetch();
        alert('Opportunity updated successfully');
      }
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleCloseOpportunity = async (id, won) => {
    if (!window.confirm(
      `Close as ${won ? 'Won' : 'Lost'}? This cannot be undone.`
    )) {
      return;
    }

    try {
      const response = await api.post(
        `/salesforce/opportunities/${id}/close`,
        { won }
      );

      if (response.data.success) {
        refetch();
        alert(response.data.message);
      }
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteOpportunity = async (id) => {
    if (!window.confirm('Delete this opportunity? This cannot be undone.')) {
      return;
    }

    try {
      const response = await api.delete(
        `/salesforce/opportunities/${id}`
      );

      if (response.data.success) {
        refetch();
        alert('Opportunity deleted successfully');
      }
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  if (error && !opportunities) {
    return (
      <div className="error-container">
        <p>Error: {error}</p>
        <button onClick={refetch}>Retry</button>
      </div>
    );
  }

  return (
    <div className="opportunities-manager">
      <div className="manager-header">
        <h2>Opportunities Manager</h2>
        <button
          className="btn-primary"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : '+ New Opportunity'}
        </button>
      </div>

      {showCreateForm && (
        <CreateOpportunityForm
          onSubmit={handleCreateOpportunity}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <FiltersPanel filters={filters} onFilterChange={setFilters} />

      {loading && <div className="loading">Loading opportunities...</div>}

      <div className="opportunities-grid">
        {opportunities?.records?.map((opp) => (
          <OpportunityCard
            key={opp.Id}
            opportunity={opp}
            isEditing={editingId === opp.Id}
            onEdit={() => setEditingId(opp.Id)}
            onUpdate={(updates) => handleUpdateOpportunity(opp.Id, updates)}
            onClose={(won) => handleCloseOpportunity(opp.Id, won)}
            onDelete={() => handleDeleteOpportunity(opp.Id)}
          />
        ))}
      </div>

      {opportunities?.records?.length === 0 && (
        <div className="no-data">No opportunities found</div>
      )}
    </div>
  );
};

// CreateOpportunityForm Component
const CreateOpportunityForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    Name: '',
    StageName: 'Prospecting',
    CloseDate: '',
    Amount: '',
    AccountId: '',
    Description: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="create-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Opportunity Name *</label>
        <input
          type="text"
          name="Name"
          value={formData.Name}
          onChange={handleChange}
          required
          placeholder="e.g., Acme Corp - Enterprise License"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Stage *</label>
          <select
            name="StageName"
            value={formData.StageName}
            onChange={handleChange}
            required
          >
            <option value="Prospecting">Prospecting</option>
            <option value="Qualification">Qualification</option>
            <option value="Needs Analysis">Needs Analysis</option>
            <option value="Value Proposition">Value Proposition</option>
            <option value="Id. Decision Makers">Id. Decision Makers</option>
            <option value="Perception Analysis">Perception Analysis</option>
            <option value="Proposal/Price Quote">Proposal/Price Quote</option>
            <option value="Negotiation/Review">Negotiation/Review</option>
            <option value="Closed Won">Closed Won</option>
            <option value="Closed Lost">Closed Lost</option>
          </select>
        </div>

        <div className="form-group">
          <label>Close Date *</label>
          <input
            type="date"
            name="CloseDate"
            value={formData.CloseDate}
            onChange={handleChange}
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Amount</label>
          <input
            type="number"
            name="Amount"
            value={formData.Amount}
            onChange={handleChange}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label>Account ID *</label>
          <input
            type="text"
            name="AccountId"
            value={formData.AccountId}
            onChange={handleChange}
            required
            placeholder="Salesforce Account ID"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          name="Description"
          value={formData.Description}
          onChange={handleChange}
          placeholder="Add any relevant notes..."
          rows="3"
        />
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Opportunity'}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

// OpportunityCard Component
const OpportunityCard = ({
  opportunity,
  isEditing,
  onEdit,
  onUpdate,
  onClose,
  onDelete,
}) => {
  const [editData, setEditData] = useState(null);

  const handleEditChange = (field, value) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    await onUpdate(editData);
    setEditData(null);
  };

  if (isEditing && !editData) {
    setEditData({ ...opportunity });
  }

  const amount = opportunity.Amount
    ? `$${parseFloat(opportunity.Amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : 'No amount';

  return (
    <div className="opportunity-card">
      {isEditing ? (
        <div className="card-edit">
          <input
            type="text"
            value={editData?.Name || ''}
            onChange={(e) => handleEditChange('Name', e.target.value)}
            className="edit-input"
          />
          <select
            value={editData?.StageName || ''}
            onChange={(e) => handleEditChange('StageName', e.target.value)}
            className="edit-select"
          >
            <option value="Prospecting">Prospecting</option>
            <option value="Qualification">Qualification</option>
            <option value="Value Proposition">Value Proposition</option>
            <option value="Negotiation/Review">Negotiation/Review</option>
            <option value="Closed Won">Closed Won</option>
            <option value="Closed Lost">Closed Lost</option>
          </select>
          <div className="edit-actions">
            <button className="btn-save" onClick={handleSave}>
              Save
            </button>
            <button className="btn-cancel" onClick={() => setEditData(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="card-header">
            <h3>{opportunity.Name}</h3>
            <span className={`stage-badge stage-${opportunity.StageName}`}>
              {opportunity.StageName}
            </span>
          </div>

          <div className="card-body">
            <div className="amount">{amount}</div>
            <div className="probability">
              {opportunity.Probability}% probability
            </div>
            <div className="close-date">
              Close Date: {new Date(opportunity.CloseDate).toLocaleDateString()}
            </div>
          </div>

          <div className="card-footer">
            <button className="btn-small" onClick={onEdit}>
              Edit
            </button>
            {!opportunity.IsClosed && (
              <>
                <button
                  className="btn-small btn-success"
                  onClick={() => onClose(true)}
                >
                  Won
                </button>
                <button
                  className="btn-small btn-danger"
                  onClick={() => onClose(false)}
                >
                  Lost
                </button>
              </>
            )}
            <button className="btn-small btn-delete" onClick={onDelete}>
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// FiltersPanel Component
const FiltersPanel = ({ filters, onFilterChange }) => {
  const handleFilterChange = (field, value) => {
    onFilterChange((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="filters-panel">
      <div className="filter-group">
        <label>Stage</label>
        <select
          value={filters.stage}
          onChange={(e) => handleFilterChange('stage', e.target.value)}
        >
          <option value="">All Stages</option>
          <option value="Prospecting">Prospecting</option>
          <option value="Qualification">Qualification</option>
          <option value="Value Proposition">Value Proposition</option>
          <option value="Negotiation/Review">Negotiation/Review</option>
          <option value="Closed Won">Closed Won</option>
          <option value="Closed Lost">Closed Lost</option>
        </select>
      </div>

      <div className="filter-group">
        <label>Min Amount</label>
        <input
          type="number"
          value={filters.amountMin}
          onChange={(e) => handleFilterChange('amountMin', e.target.value)}
          placeholder="0"
          min="0"
        />
      </div>

      <div className="filter-group">
        <label>Max Amount</label>
        <input
          type="number"
          value={filters.amountMax}
          onChange={(e) => handleFilterChange('amountMax', e.target.value)}
          placeholder="No limit"
          min="0"
        />
      </div>
    </div>
  );
};

export default OpportunitiesManager;