import React, { useState } from 'react';
import { adminAPI } from '../../services/api';
import './BulkActions.css';

const BulkActions = ({ 
  selectedIds = [], 
  onAction, 
  categories = [],
  disabled = false 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState('');
  const [actionData, setActionData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const actions = [
    { id: 'update_category', label: 'Change Category', icon: '📁' },
    { id: 'update_status', label: 'Change Status', icon: '📊' },
    { id: 'update_price', label: 'Update Price', icon: '💰' },
    { id: 'activate', label: 'Activate Products', icon: '✅' },
    { id: 'deactivate', label: 'Deactivate Products', icon: '❌' },
    { id: 'delete', label: 'Delete Products', icon: '🗑️', danger: true }
  ];

  const inventoryStatuses = [
    { value: 'in_stock', label: 'In Stock' },
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'out_of_stock', label: 'Out of Stock' }
  ];

  const handleActionSelect = (actionId) => {
    setAction(actionId);
    setActionData({});
    setError('');
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setAction('');
    setActionData({});
    setError('');
  };

  const handleInputChange = (field, value) => {
    setActionData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateAction = () => {
    switch (action) {
      case 'update_price':
        if (!actionData.price || isNaN(parseFloat(actionData.price)) || parseFloat(actionData.price) < 0) {
          setError('Please enter a valid price');
          return false;
        }
        break;
      case 'update_category':
        if (!actionData.category_id && actionData.category_id !== null) {
          setError('Please select a category or choose "No Category"');
          return false;
        }
        break;
      case 'update_status':
        if (!actionData.inventory_status) {
          setError('Please select an inventory status');
          return false;
        }
        break;
    }
    return true;
  };

  const executeAction = async () => {
    if (!validateAction()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      let result;
      
      switch (action) {
        case 'update_category':
          result = await adminAPI.products.bulkUpdate(selectedIds, {
            category_id: actionData.category_id === 'null' ? null : parseInt(actionData.category_id)
          });
          break;
          
        case 'update_status':
          result = await adminAPI.products.bulkUpdate(selectedIds, {
            inventory_status: actionData.inventory_status
          });
          break;
          
        case 'update_price':
          const priceMultiplier = actionData.price_action === 'multiply' ? parseFloat(actionData.price) :
                                 actionData.price_action === 'add' ? null : null;
          const priceAdjustment = actionData.price_action === 'add' ? parseFloat(actionData.price) * 100 : null; // Convert to cents
          const setPrice = actionData.price_action === 'set' ? parseFloat(actionData.price) * 100 : null; // Convert to cents
          
          if (setPrice !== null) {
            result = await adminAPI.products.bulkUpdate(selectedIds, { price: setPrice });
          } else {
            // For multiply/add operations, we'd need to fetch current prices first
            // This is a simplified implementation - in practice, you might want to handle this on the backend
            throw new Error('Price multiplication and addition not yet implemented');
          }
          break;
          
        case 'activate':
          result = await adminAPI.products.bulkUpdate(selectedIds, { is_active: true });
          break;
          
        case 'deactivate':
          result = await adminAPI.products.bulkUpdate(selectedIds, { is_active: false });
          break;
          
        case 'delete':
          result = await adminAPI.products.bulkDelete(selectedIds);
          break;
          
        default:
          throw new Error('Unknown action');
      }

      if (onAction) {
        onAction({
          action,
          result,
          selectedIds
        });
      }

      handleModalClose();
    } catch (err) {
      setError(err.message || 'Failed to execute action');
    } finally {
      setLoading(false);
    }
  };

  const renderActionModal = () => {
    const actionInfo = actions.find(a => a.id === action);
    if (!actionInfo) return null;

    return (
      <div className="bulk-actions-modal-overlay" onClick={handleModalClose}>
        <div className="bulk-actions-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{actionInfo.icon} {actionInfo.label}</h3>
            <button className="modal-close" onClick={handleModalClose}>×</button>
          </div>
          
          <div className="modal-body">
            <p>This action will affect <strong>{selectedIds.length}</strong> product(s).</p>
            
            {action === 'update_category' && (
              <div className="form-group">
                <label htmlFor="category_id">New Category</label>
                <select
                  id="category_id"
                  value={actionData.category_id || ''}
                  onChange={(e) => handleInputChange('category_id', e.target.value)}
                >
                  <option value="">Select Category</option>
                  <option value="null">No Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {action === 'update_status' && (
              <div className="form-group">
                <label htmlFor="inventory_status">Inventory Status</label>
                <select
                  id="inventory_status"
                  value={actionData.inventory_status || ''}
                  onChange={(e) => handleInputChange('inventory_status', e.target.value)}
                >
                  <option value="">Select Status</option>
                  {inventoryStatuses.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {action === 'update_price' && (
              <div>
                <div className="form-group">
                  <label htmlFor="price_action">Price Action</label>
                  <select
                    id="price_action"
                    value={actionData.price_action || 'set'}
                    onChange={(e) => handleInputChange('price_action', e.target.value)}
                  >
                    <option value="set">Set to specific price</option>
                    <option value="multiply">Multiply by factor</option>
                    <option value="add">Add amount</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="price">
                    {actionData.price_action === 'multiply' ? 'Multiplier' : 
                     actionData.price_action === 'add' ? 'Amount to Add ($)' : 
                     'New Price ($)'}
                  </label>
                  <input
                    type="number"
                    id="price"
                    value={actionData.price || ''}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    step={actionData.price_action === 'multiply' ? '0.01' : '0.01'}
                    min={actionData.price_action === 'multiply' ? '0' : actionData.price_action === 'add' ? undefined : '0'}
                    placeholder={actionData.price_action === 'multiply' ? '1.1' : 
                                actionData.price_action === 'add' ? '5.00' : 
                                '19.99'}
                  />
                </div>
              </div>
            )}

            {action === 'delete' && (
              <div className="warning-message">
                <p><strong>⚠️ Warning:</strong> This action cannot be undone. Products will be permanently deleted.</p>
              </div>
            )}

            {actionInfo.danger && action !== 'delete' && (
              <div className="warning-message">
                <p><strong>⚠️ Caution:</strong> This action will modify multiple products at once.</p>
              </div>
            )}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </div>
          
          <div className="modal-actions">
            <button onClick={handleModalClose} disabled={loading}>
              Cancel
            </button>
            <button 
              onClick={executeAction} 
              disabled={loading}
              className={actionInfo.danger ? 'danger' : 'primary'}
            >
              {loading ? 'Processing...' : `${actionInfo.label} (${selectedIds.length})`}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (selectedIds.length === 0) {
    return (
      <div className="bulk-actions-empty">
        <span>Select products to perform bulk actions</span>
      </div>
    );
  }

  return (
    <div className="bulk-actions">
      <div className="bulk-actions-header">
        <span className="selected-count">
          {selectedIds.length} product{selectedIds.length !== 1 ? 's' : ''} selected
        </span>
      </div>
      
      <div className="bulk-actions-buttons">
        {actions.map(actionItem => (
          <button
            key={actionItem.id}
            className={`bulk-action-btn ${actionItem.danger ? 'danger' : ''}`}
            onClick={() => handleActionSelect(actionItem.id)}
            disabled={disabled}
            title={actionItem.label}
          >
            <span className="action-icon">{actionItem.icon}</span>
            <span className="action-label">{actionItem.label}</span>
          </button>
        ))}
      </div>

      {showModal && renderActionModal()}
    </div>
  );
};

export default BulkActions;