import React, { useContext, useEffect, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { FiSave, FiX, FiArrowLeft } from "react-icons/fi";
import axios from "axios";
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import DashboardWrapper from '../components/DashboardWrapper';
import { usePermissions } from "../hooks/usePermissions";
import { PERMISSIONS } from "../helpers/PermissionUtils";
import frontendLoggingService from "../services/frontendLoggingService";

function CollateralForm() {
  const history = useHistory();
  const { id } = useParams();
  const { authState, isLoading } = useContext(AuthContext);
  const { showMessage } = useSnackbar();
  const { canAdd, canEdit } = usePermissions();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    memberId: '',
    collateralType: '',
    description: '',
    value: '',
    currency: 'USD',
    ownershipType: 'Full Ownership',
    ownershipPercentage: '100.00',
    location: '',
    condition: '',
    appraisalDate: '',
    appraisedBy: '',
    appraisalValue: '',
    documentNumber: '',
    documentType: '',
    insurancePolicyNumber: '',
    insuranceCompany: '',
    insuranceExpiryDate: '',
    lienHolder: '',
    lienAmount: '',
    status: 'Active',
    remarks: ''
  });

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  useEffect(() => {
    if (authState.status) {
      fetchMembers();
      if (isEdit) {
        fetchCollateral();
      }
    }
  }, [authState.status, id]);

  const fetchMembers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/members', {
        headers: { 
          accessToken: localStorage.getItem('accessToken'),
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.entity) {
        setMembers(response.data.entity);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      showMessage('Failed to fetch members', 'error');
    }
  };

  const fetchCollateral = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3001/collateral/${id}`, {
        headers: { 
          accessToken: localStorage.getItem('accessToken'),
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.entity) {
        const collateral = response.data.entity;
        setFormData({
          memberId: collateral.memberId || '',
          collateralType: collateral.collateralType || '',
          description: collateral.description || '',
          value: collateral.value || '',
          currency: collateral.currency || 'USD',
          ownershipType: collateral.ownershipType || 'Full Ownership',
          ownershipPercentage: collateral.ownershipPercentage || '100.00',
          location: collateral.location || '',
          condition: collateral.condition || '',
          appraisalDate: collateral.appraisalDate ? collateral.appraisalDate.split('T')[0] : '',
          appraisedBy: collateral.appraisedBy || '',
          appraisalValue: collateral.appraisalValue || '',
          documentNumber: collateral.documentNumber || '',
          documentType: collateral.documentType || '',
          insurancePolicyNumber: collateral.insurancePolicyNumber || '',
          insuranceCompany: collateral.insuranceCompany || '',
          insuranceExpiryDate: collateral.insuranceExpiryDate ? collateral.insuranceExpiryDate.split('T')[0] : '',
          lienHolder: collateral.lienHolder || '',
          lienAmount: collateral.lienAmount || '',
          status: collateral.status || 'Active',
          remarks: collateral.remarks || ''
        });
      }
    } catch (error) {
      console.error('Error fetching collateral:', error);
      showMessage('Failed to fetch collateral details', 'error');
      history.push('/collateral');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.memberId || !formData.collateralType || !formData.description || !formData.value) {
      showMessage('Please fill in all required fields', 'error');
      return;
    }

    if (parseFloat(formData.value) <= 0) {
      showMessage('Collateral value must be greater than 0', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        value: parseFloat(formData.value),
        ownershipPercentage: parseFloat(formData.ownershipPercentage),
        appraisalValue: formData.appraisalValue ? parseFloat(formData.appraisalValue) : null,
        lienAmount: formData.lienAmount ? parseFloat(formData.lienAmount) : null
      };

      let response;
      if (isEdit) {
        response = await axios.put(`http://localhost:3001/collateral/${id}`, payload, {
          headers: { 
            accessToken: localStorage.getItem('accessToken'),
            'Content-Type': 'application/json'
          }
        });
        frontendLoggingService.logUpdate("Collateral", id, formData.description, "Updated collateral");
      } else {
        response = await axios.post('http://localhost:3001/collateral', payload, {
          headers: { 
            accessToken: localStorage.getItem('accessToken'),
            'Content-Type': 'application/json'
          }
        });
        frontendLoggingService.logCreate("Collateral", response.data.entity?.id, formData.description, "Created new collateral");
      }

      showMessage(`Collateral ${isEdit ? 'updated' : 'created'} successfully`, 'success');
      history.push('/collateral');
      
    } catch (error) {
      console.error('Error saving collateral:', error);
      let errorMessage = `Failed to ${isEdit ? 'update' : 'create'} collateral`;
      
      if (error.response) {
        errorMessage = error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Network error: Unable to connect to server';
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      showMessage(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardWrapper>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <div>Loading...</div>
        </div>
      </DashboardWrapper>
    );
  }

  if (!authState.status) {
    return null;
  }

  if (loading) {
    return (
      <DashboardWrapper>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <div>Loading collateral details...</div>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <header className="header">
        <div className="header__left">
          <button 
            className="btn btn--secondary"
            onClick={() => history.push('/collateral')}
            style={{ marginRight: '16px' }}
          >
            <FiArrowLeft /> Back
          </button>
          <div className="greeting">
            {isEdit ? 'Edit Collateral' : 'Add New Collateral'}
          </div>
        </div>
      </header>

      <main className="dashboard__content">
        <section className="card" style={{ padding: 24 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              
              {/* Basic Information */}
              <div>
                <h3 style={{ marginBottom: '16px', color: 'var(--primary-700)' }}>Basic Information</h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Member <span style={{ color: 'red' }}>*</span>
                  </label>
                  <select
                    name="memberId"
                    value={formData.memberId}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select Member</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.firstName} {member.lastName} ({member.memberId})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Collateral Type <span style={{ color: 'red' }}>*</span>
                  </label>
                  <select
                    name="collateralType"
                    value={formData.collateralType}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select Type</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Inventory">Inventory</option>
                    <option value="Securities">Securities</option>
                    <option value="Cash Deposit">Cash Deposit</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Description <span style={{ color: 'red' }}>*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                    placeholder="Describe the collateral in detail..."
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Value <span style={{ color: 'red' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="number"
                      name="value"
                      value={formData.value}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                      placeholder="0.00"
                    />
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      style={{
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="UGX">UGX</option>
                      <option value="KES">KES</option>
                      <option value="TZS">TZS</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Ownership Information */}
              <div>
                <h3 style={{ marginBottom: '16px', color: 'var(--primary-700)' }}>Ownership Information</h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Ownership Type
                  </label>
                  <select
                    name="ownershipType"
                    value={formData.ownershipType}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="Full Ownership">Full Ownership</option>
                    <option value="Partial Ownership">Partial Ownership</option>
                    <option value="Joint Ownership">Joint Ownership</option>
                    <option value="Lease">Lease</option>
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Ownership Percentage (%)
                  </label>
                  <input
                    type="number"
                    name="ownershipPercentage"
                    value={formData.ownershipPercentage}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Physical location of the collateral"
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Condition
                  </label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select Condition</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>

              {/* Appraisal Information */}
              <div>
                <h3 style={{ marginBottom: '16px', color: 'var(--primary-700)' }}>Appraisal Information</h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Appraisal Date
                  </label>
                  <input
                    type="date"
                    name="appraisalDate"
                    value={formData.appraisalDate}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Appraised By
                  </label>
                  <input
                    type="text"
                    name="appraisedBy"
                    value={formData.appraisedBy}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Name of appraiser"
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Appraisal Value
                  </label>
                  <input
                    type="number"
                    name="appraisalValue"
                    value={formData.appraisalValue}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Professional appraisal value"
                  />
                </div>
              </div>

              {/* Documentation */}
              <div>
                <h3 style={{ marginBottom: '16px', color: 'var(--primary-700)' }}>Documentation</h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Document Number
                  </label>
                  <input
                    type="text"
                    name="documentNumber"
                    value={formData.documentNumber}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Title deed number, registration number, etc."
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Document Type
                  </label>
                  <select
                    name="documentType"
                    value={formData.documentType}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Select Document Type</option>
                    <option value="Title Deed">Title Deed</option>
                    <option value="Registration Certificate">Registration Certificate</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Receipt">Receipt</option>
                    <option value="Certificate">Certificate</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Insurance Information */}
              <div>
                <h3 style={{ marginBottom: '16px', color: 'var(--primary-700)' }}>Insurance Information</h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Insurance Policy Number
                  </label>
                  <input
                    type="text"
                    name="insurancePolicyNumber"
                    value={formData.insurancePolicyNumber}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Insurance policy number"
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Insurance Company
                  </label>
                  <input
                    type="text"
                    name="insuranceCompany"
                    value={formData.insuranceCompany}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Name of insurance company"
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Insurance Expiry Date
                  </label>
                  <input
                    type="date"
                    name="insuranceExpiryDate"
                    value={formData.insuranceExpiryDate}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              {/* Lien Information */}
              <div>
                <h3 style={{ marginBottom: '16px', color: 'var(--primary-700)' }}>Lien Information</h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Lien Holder
                  </label>
                  <input
                    type="text"
                    name="lienHolder"
                    value={formData.lienHolder}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Name of lien holder"
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Lien Amount
                  </label>
                  <input
                    type="number"
                    name="lienAmount"
                    value={formData.lienAmount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="Outstanding lien amount"
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Released">Released</option>
                  </select>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                    placeholder="Additional remarks or notes..."
                  />
                </div>
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'flex-end', 
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                type="button"
                onClick={() => history.push('/collateral')}
                style={{
                  padding: '12px 24px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FiX /> Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#059669',
                  color: 'white',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: saving ? 0.6 : 1
                }}
              >
                <FiSave /> {saving ? 'Saving...' : (isEdit ? 'Update Collateral' : 'Create Collateral')}
              </button>
            </div>
          </form>
        </section>
      </main>
    </DashboardWrapper>
  );
}

export default CollateralForm;
