import React, { useState } from 'react';
import { FiPlus, FiEdit3, FiTrash2, FiUser, FiCheck, FiX } from 'react-icons/fi';
import axios from 'axios';

const SignatoriesTab = ({
  accountId,
  member,
  accountSignatories = [],
  onAddSignatory,
  onEditSignatory,
  onRemoveSignatory,
  isLoading = false,
  existingMemberSignatories = [],
  error = null,
  isViewMode = false,
  showMessage
}) => {
  const [isAddingSignatory, setIsAddingSignatory] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [signatoryForm, setSignatoryForm] = useState({
    name: '',
    idNumber: '',
    phoneNumber: '',
    relationship: '',
    isFromMember: false
  });

  const resetForm = () => {
    setSignatoryForm({
      name: '',
      idNumber: '',
      phoneNumber: '',
      relationship: '',
      isFromMember: false
    });
  };

  const handleAddClick = () => {
    setIsAddingSignatory(true);
    setEditingIndex(null);
    resetForm();
  };

  const handleEditClick = (index) => {
    const signatory = accountSignatories[index];
    setSignatoryForm({
      name: signatory.name || '',
      idNumber: signatory.idNumber || '',
      phoneNumber: signatory.phoneNumber || '',
      relationship: signatory.relationship || '',
      isFromMember: signatory.isFromMember || false
    });
    setEditingIndex(index);
    setIsAddingSignatory(false);
  };

  const handleCancel = () => {
    setIsAddingSignatory(false);
    setEditingIndex(null);
    resetForm();
  };

  const handleSave = async () => {
    // Validation
    if (!signatoryForm.name.trim()) {
      showMessage?.('Please enter signatory name', 'error');
      return;
    }

    if (!signatoryForm.idNumber.trim()) {
      showMessage?.('Please enter ID number', 'error');
      return;
    }

    try {
      if (editingIndex !== null) {
        // Update existing signatory
        if (accountId && accountId !== 'new') {
          // Update on server
          const updatedSignatories = [...accountSignatories];
          updatedSignatories[editingIndex] = signatoryForm;
          
          await axios.put(`http://localhost:3001/accounts/${accountId}`, {
            signatories: JSON.stringify(updatedSignatories)
          }, {
            headers: { accessToken: localStorage.getItem('accessToken') }
          });
          
          showMessage?.('Signatory updated successfully', 'success');
        }
        onEditSignatory?.(editingIndex, signatoryForm);
      } else {
        // Add new signatory
        if (accountId && accountId !== 'new') {
          // Save on server
          const updatedSignatories = [...accountSignatories, signatoryForm];
          
          await axios.put(`http://localhost:3001/accounts/${accountId}`, {
            signatories: JSON.stringify(updatedSignatories)
          }, {
            headers: { accessToken: localStorage.getItem('accessToken') }
          });
          
          showMessage?.('Signatory added successfully', 'success');
        }
        onAddSignatory?.(signatoryForm);
      }
      
      handleCancel();
    } catch (error) {
      console.error('Error saving signatory:', error);
      showMessage?.(error.response?.data?.message || 'Error saving signatory', 'error');
    }
  };

  const handleDelete = async (index) => {
    if (!window.confirm('Are you sure you want to remove this signatory?')) {
      return;
    }

    try {
      if (accountId && accountId !== 'new') {
        // Delete on server
        const updatedSignatories = accountSignatories.filter((_, i) => i !== index);
        
        await axios.put(`http://localhost:3001/accounts/${accountId}`, {
          signatories: JSON.stringify(updatedSignatories)
        }, {
          headers: { accessToken: localStorage.getItem('accessToken') }
        });
        
        showMessage?.('Signatory removed successfully', 'success');
      }
      
      onRemoveSignatory?.(index);
    } catch (error) {
      console.error('Error removing signatory:', error);
      showMessage?.(error.response?.data?.message || 'Error removing signatory', 'error');
    }
  };

  const handleCopyFromMember = (memberSignatory) => {
    setSignatoryForm({
      name: memberSignatory.name || '',
      idNumber: memberSignatory.idNumber || '',
      phoneNumber: memberSignatory.phoneNumber || '',
      relationship: memberSignatory.relationship || '',
      isFromMember: true
    });
  };

  if (isLoading) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        color: 'var(--text-secondary)' 
      }}>
        Loading signatories...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: 'rgba(239, 68, 68, 0.1)', 
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '8px',
        color: '#dc2626'
      }}>
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div style={{ padding: '0' }}>
      {/* Existing Member Signatories Section */}
      {existingMemberSignatories && existingMemberSignatories.length > 0 && !isViewMode && (
        <div style={{ 
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '8px'
        }}>
          <h4 style={{ 
            margin: '0 0 12px 0', 
            color: 'var(--primary-700)',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            Member's Authorized Signatories
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {existingMemberSignatories.map((sig, index) => (
              <div 
                key={`member-sig-${index}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  backgroundColor: 'white',
                  border: '1px solid #e0e7ff',
                  borderRadius: '6px'
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {sig.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    ID: {sig.idNumber} {sig.phoneNumber && `• Phone: ${sig.phoneNumber}`}
                    {sig.relationship && ` • ${sig.relationship}`}
                  </div>
                </div>
                {!isAddingSignatory && editingIndex === null && (
                  <button
                    type="button"
                    onClick={() => {
                      handleAddClick();
                      handleCopyFromMember(sig);
                    }}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      backgroundColor: 'var(--primary-500)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <FiPlus size={12} />
                    Add to Account
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account Signatories Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h4 style={{ 
          margin: 0, 
          color: 'var(--primary-700)',
          fontSize: '16px',
          fontWeight: '600'
        }}>
          Account Signatories
        </h4>
        {!isViewMode && !isAddingSignatory && editingIndex === null && (
          <button
            type="button"
            onClick={handleAddClick}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: 'var(--primary-500)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: '600'
            }}
          >
            <FiPlus />
            Add Signatory
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(isAddingSignatory || editingIndex !== null) && (
        <div style={{
          padding: '16px',
          backgroundColor: '#f9fafb',
          border: '2px solid var(--primary-300)',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <h5 style={{ 
            margin: '0 0 12px 0', 
            color: 'var(--primary-700)',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {editingIndex !== null ? 'Edit Signatory' : 'Add New Signatory'}
          </h5>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '12px',
            marginBottom: '12px'
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '4px', 
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className="input"
                value={signatoryForm.name}
                onChange={(e) => setSignatoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter signatory name"
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '4px', 
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                ID Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                className="input"
                value={signatoryForm.idNumber}
                onChange={(e) => setSignatoryForm(prev => ({ ...prev, idNumber: e.target.value }))}
                placeholder="Enter ID number"
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '4px', 
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Phone Number
              </label>
              <input
                type="text"
                className="input"
                value={signatoryForm.phoneNumber}
                onChange={(e) => setSignatoryForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '4px', 
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                Relationship
              </label>
              <input
                type="text"
                className="input"
                value={signatoryForm.relationship}
                onChange={(e) => setSignatoryForm(prev => ({ ...prev, relationship: e.target.value }))}
                placeholder="e.g., Director, Authorized Signatory"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: '#e5e7eb',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FiX />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: 'var(--success-600)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FiCheck />
              {editingIndex !== null ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Signatories List */}
      {accountSignatories.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: '#f9fafb',
          border: '1px dashed #d1d5db',
          borderRadius: '8px',
          color: 'var(--text-secondary)'
        }}>
          <FiUser size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p style={{ margin: 0, fontSize: '14px' }}>
            No signatories added yet.
            {!isViewMode && ' Click "Add Signatory" to get started.'}
          </p>
        </div>
      ) : (
        <div style={{ 
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          {accountSignatories.map((signatory, index) => (
            <div
              key={`account-sig-${index}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px',
                backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                borderBottom: index < accountSignatories.length - 1 ? '1px solid #e5e7eb' : 'none'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <FiUser size={16} style={{ color: 'var(--primary-500)' }} />
                  {signatory.name}
                  {signatory.isFromMember && (
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      borderRadius: '12px',
                      fontWeight: '500'
                    }}>
                      From Member
                    </span>
                  )}
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  color: 'var(--text-secondary)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '8px'
                }}>
                  <span>
                    <strong>ID:</strong> {signatory.idNumber}
                  </span>
                  {signatory.phoneNumber && (
                    <span>
                      <strong>Phone:</strong> {signatory.phoneNumber}
                    </span>
                  )}
                  {signatory.relationship && (
                    <span>
                      <strong>Relationship:</strong> {signatory.relationship}
                    </span>
                  )}
                </div>
              </div>
              
              {!isViewMode && editingIndex !== index && !isAddingSignatory && (
                <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                  <button
                    type="button"
                    onClick={() => handleEditClick(index)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '13px',
                      backgroundColor: '#f3f4f6',
                      color: 'var(--primary-600)',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Edit signatory"
                  >
                    <FiEdit3 size={14} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(index)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '13px',
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                    title="Remove signatory"
                  >
                    <FiTrash2 size={14} />
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SignatoriesTab;
