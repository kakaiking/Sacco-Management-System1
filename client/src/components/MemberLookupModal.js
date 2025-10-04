import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiSearch } from 'react-icons/fi';
import axios from 'axios';

// Helper function to generate member name based on member type
const getMemberName = (member) => {
  if (!member) return '';
  
  switch (member.category) {
    case 'Individual':
    case 'Minor':
      return `${member.firstName || ''} ${member.lastName || ''}`.trim();
    case 'Corporate':
      return member.companyName || '';
    case 'Chama':
      return member.chamaName || '';
    case 'Joint':
      // For joint members, show the primary member name and indicate it's joint
      const primaryName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
      return primaryName ? `${primaryName} (Joint)` : 'Joint Member';
    default:
      // Fallback to firstName + lastName for unknown types
      return `${member.firstName || ''} ${member.lastName || ''}`.trim();
  }
};

function MemberLookupModal({ isOpen, onClose, onSelectMember }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);

  // Fetch members when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/members', {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      setMembers(response.data.entity || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter members based on search term - comprehensive search across all member fields
  const filteredMembers = members.filter(member => {
    const searchLower = searchTerm.toLowerCase();
    const memberName = getMemberName(member).toLowerCase();
    
    // Helper function to safely check if a field contains the search term
    const fieldContains = (field) => {
      return field && field.toString().toLowerCase().includes(searchLower);
    };
    
    // Search across all member fields
    return (
      // Basic member information
      fieldContains(member.memberNo) ||
      fieldContains(memberName) ||
      fieldContains(member.firstName) ||
      fieldContains(member.lastName) ||
      fieldContains(member.companyName) ||
      fieldContains(member.chamaName) ||
      
      // Identification fields
      fieldContains(member.identificationNumber) ||
      fieldContains(member.identificationType) ||
      fieldContains(member.kraPin) ||
      fieldContains(member.companyKraPin) ||
      fieldContains(member.guardianKraPin) ||
      
      // Contact information
      fieldContains(member.email) ||
      fieldContains(member.personalPhone) ||
      fieldContains(member.alternativePhone) ||
      fieldContains(member.guardianPhone) ||
      
      // Address information
      fieldContains(member.country) ||
      fieldContains(member.county) ||
      fieldContains(member.subCounty) ||
      fieldContains(member.address) ||
      fieldContains(member.businessAddress) ||
      fieldContains(member.guardianAddress) ||
      
      // Corporate/Chama specific fields
      fieldContains(member.registrationNumber) ||
      fieldContains(member.chamaRegistrationNumber) ||
      fieldContains(member.businessType) ||
      
      // Guardian information (for minors)
      fieldContains(member.guardianName) ||
      fieldContains(member.guardianIdNumber) ||
      fieldContains(member.guardianEmail) ||
      fieldContains(member.guardianRelationship) ||
      
      // Other relevant fields
      fieldContains(member.nationality) ||
      fieldContains(member.gender) ||
      fieldContains(member.maritalStatus) ||
      fieldContains(member.category) ||
      fieldContains(member.status) ||
      
      // Search in next of kin information
      (member.nextOfKin && member.nextOfKin.some(kin => 
        fieldContains(kin.firstName) ||
        fieldContains(kin.lastName) ||
        fieldContains(kin.phoneNumber) ||
        fieldContains(kin.relationType)
      )) ||
      
      // Search in chama members information
      (member.chamaMembers && member.chamaMembers.some(chamaMember => 
        fieldContains(chamaMember.firstName) ||
        fieldContains(chamaMember.lastName) ||
        fieldContains(chamaMember.phoneNumber) ||
        fieldContains(chamaMember.email) ||
        fieldContains(chamaMember.identificationNumber) ||
        fieldContains(chamaMember.kraPin)
      )) ||
      
      // Search in authorized signatories information
      (member.authorizedSignatories && member.authorizedSignatories.some(signatory => 
        fieldContains(signatory.firstName) ||
        fieldContains(signatory.lastName) ||
        fieldContains(signatory.phoneNumber) ||
        fieldContains(signatory.email) ||
        fieldContains(signatory.identificationNumber) ||
        fieldContains(signatory.kraPin) ||
        fieldContains(signatory.position)
      )) ||
      
      // Search in joint members information
      (member.jointMembers && member.jointMembers.some(jointMember => 
        fieldContains(jointMember.firstName) ||
        fieldContains(jointMember.lastName) ||
        fieldContains(jointMember.phoneNumber) ||
        fieldContains(jointMember.email) ||
        fieldContains(jointMember.identificationNumber) ||
        fieldContains(jointMember.kraPin)
      ))
    );
  });

  const handleMemberSelect = (member) => {
    setSelectedMember(member);
  };

  const handleMemberDoubleClick = (member) => {
    setSelectedMember(member);
    onSelectMember(member);
    onClose();
  };

  const handleConfirmSelection = () => {
    if (selectedMember) {
      onSelectMember(selectedMember);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedMember(null);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Member</h2>
          <button className="modal-close" onClick={handleClose}>
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          {/* Search Input */}
          <div className="search-section">
            <div className="search-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by name, phone, KRA PIN, ID number, email, address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            {selectedMember && (
              <button
                className="role-select-tick"
                onClick={handleConfirmSelection}
                title="Select this member"
              >
                <FiCheck />
              </button>
            )}
          </div>

          {/* Members Table */}
          <div className="modal-table-container">
            {loading ? (
              <div className="loading-message">Loading members...</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Member Name</th>
                    <th>Member No</th>
                    <th>Phone</th>
                    <th>ID Number</th>
                    <th>Member Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">
                        {searchTerm ? 'No members found matching your search' : 'No members available'}
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => (
                      <tr 
                        key={member.id} 
                        className={selectedMember?.id === member.id ? 'selected' : ''}
                        onClick={() => handleMemberSelect(member)}
                        onDoubleClick={() => handleMemberDoubleClick(member)}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <input
                            type="radio"
                            name="memberSelection"
                            checked={selectedMember?.id === member.id}
                            onChange={() => handleMemberSelect(member)}
                          />
                        </td>
                        <td>{getMemberName(member)}</td>
                        <td>{member.memberNo || '-'}</td>
                        <td>{member.personalPhone || member.alternativePhone || '-'}</td>
                        <td>{member.identificationNumber || '-'}</td>
                        <td>{member.category || '-'}</td>
                        <td>
                          <div
                            style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "12px",
                              fontWeight: "500",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              backgroundColor: 
                                member.status === "Approved" ? "rgba(16, 185, 129, 0.2)" :
                                member.status === "Pending" ? "rgba(6, 182, 212, 0.2)" :
                                member.status === "Returned" ? "rgba(249, 115, 22, 0.2)" :
                                member.status === "Rejected" ? "rgba(239, 68, 68, 0.2)" :
                                member.status === "Active" ? "rgba(16, 185, 129, 0.2)" :
                                member.status === "Inactive" ? "rgba(239, 68, 68, 0.2)" :
                                member.status === "Withdrawn" ? "rgba(107, 114, 128, 0.2)" :
                                member.status === "Diseased" ? "rgba(75, 85, 99, 0.2)" :
                                "rgba(107, 114, 128, 0.2)",
                              color: 
                                member.status === "Approved" ? "#059669" :
                                member.status === "Pending" ? "#0891b2" :
                                member.status === "Returned" ? "#ea580c" :
                                member.status === "Rejected" ? "#dc2626" :
                                member.status === "Active" ? "#059669" :
                                member.status === "Inactive" ? "#dc2626" :
                                member.status === "Withdrawn" ? "#6b7280" :
                                member.status === "Diseased" ? "#4b5563" :
                                "#6b7280",
                              border: `1px solid ${
                                member.status === "Approved" ? "rgba(16, 185, 129, 0.3)" :
                                member.status === "Pending" ? "rgba(6, 182, 212, 0.3)" :
                                member.status === "Returned" ? "rgba(249, 115, 22, 0.3)" :
                                member.status === "Rejected" ? "rgba(239, 68, 68, 0.3)" :
                                member.status === "Active" ? "rgba(16, 185, 129, 0.3)" :
                                member.status === "Inactive" ? "rgba(239, 68, 68, 0.3)" :
                                member.status === "Withdrawn" ? "rgba(107, 114, 128, 0.3)" :
                                member.status === "Diseased" ? "rgba(75, 85, 99, 0.3)" :
                                "rgba(107, 114, 128, 0.3)"
                              }`
                            }}
                          >
                            {member.status}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemberLookupModal;
