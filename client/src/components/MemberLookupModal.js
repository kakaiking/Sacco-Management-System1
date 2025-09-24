import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiSearch } from 'react-icons/fi';
import axios from 'axios';

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

  // Filter members based on search term
  const filteredMembers = members.filter(member =>
    member.memberNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.idNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMemberSelect = (member) => {
    setSelectedMember(member);
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
                placeholder="Search members..."
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
                    <th>Member No</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>ID Number</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-data">
                        {searchTerm ? 'No members found matching your search' : 'No members available'}
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => (
                      <tr 
                        key={member.id} 
                        className={selectedMember?.id === member.id ? 'selected' : ''}
                        onClick={() => handleMemberSelect(member)}
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
                        <td>{member.memberNo}</td>
                        <td>{member.firstName}</td>
                        <td>{member.lastName}</td>
                        <td>{member.idNumber || '-'}</td>
                        <td>
                          <span className={`status-badge status-${member.status.toLowerCase()}`}>
                            {member.status}
                          </span>
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
