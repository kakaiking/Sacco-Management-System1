import React, { useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { FiPlus, FiEdit3, FiTrash2, FiEye, FiSearch, FiFilter, FiRefreshCw } from "react-icons/fi";
import DashboardWrapper from '../components/DashboardWrapper';
import { useSnackbar } from "../helpers/SnackbarContext";
import { AuthContext } from "../helpers/AuthContext";
import Pagination from '../components/Pagination';

function AccountOfficers() {
  const history = useHistory();
  const { authState, isLoading } = useContext(AuthContext);
  const { showMessage } = useSnackbar();

  const [accountOfficers, setAccountOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    // Only redirect if authentication check is complete and user is not authenticated
    if (!isLoading && !authState.status) {
      history.push("/login");
    }
  }, [authState, isLoading, history]);

  useEffect(() => {
    if (authState.status) {
      fetchAccountOfficers();
      fetchBranches();
    }
  }, [authState.status, currentPage, searchTerm, statusFilter, branchFilter]);

  const fetchAccountOfficers = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
        branchId: branchFilter
      };

      const response = await axios.get('http://localhost:3001/account-officers', {
        headers: { accessToken: localStorage.getItem('accessToken') },
        params
      });

      setAccountOfficers(response.data.entity || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalCount(response.data.totalCount || 0);
    } catch (error) {
      console.error("Error fetching account officers:", error);
      showMessage("Error fetching account officers", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await axios.get('http://localhost:3001/branch', {
        headers: { accessToken: localStorage.getItem('accessToken') }
      });
      setBranches(response.data.entity || []);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleBranchFilter = (e) => {
    setBranchFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setBranchFilter("");
    setCurrentPage(1);
  };

  const handleCreate = () => {
    history.push('/account-officers/new');
  };

  const handleView = (id) => {
    history.push(`/account-officers/${id}`);
  };

  const handleEdit = (id) => {
    history.push(`/account-officers/${id}?edit=1`);
  };

  const handleDelete = async (id, firstName, lastName) => {
    if (window.confirm(`Are you sure you want to delete account officer ${firstName} ${lastName}?`)) {
      try {
        await axios.delete(`http://localhost:3001/account-officers/${id}`, {
          headers: { accessToken: localStorage.getItem('accessToken') }
        });
        showMessage("Account officer deleted successfully", "success");
        fetchAccountOfficers();
      } catch (error) {
        console.error("Error deleting account officer:", error);
        showMessage(error.response?.data?.error || "Error deleting account officer", "error");
      }
    }
  };

  const handleRefresh = () => {
    fetchAccountOfficers();
  };

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'status-active';
      case 'inactive':
        return 'status-inactive';
      case 'suspended':
        return 'status-suspended';
      case 'terminated':
        return 'status-terminated';
      default:
        return 'status-default';
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardWrapper>
      <div className="page-container">
        <div className="page-header">
          <div className="page-title">
            <h1>Account Officers</h1>
            <p>Manage account officers and their assignments</p>
          </div>
          <div className="page-actions">
            <button className="refresh-button" onClick={handleRefresh}>
              <FiRefreshCw />
            </button>
            <button className="create-button" onClick={handleCreate}>
              <FiPlus /> Create Account Officer
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filters-row">
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search account officers..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            
            <div className="filter-group">
              <select value={statusFilter} onChange={handleStatusFilter}>
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
            
            <div className="filter-group">
              <select value={branchFilter} onChange={handleBranchFilter}>
                <option value="">All Branches</option>
                {branches.map(branch => (
                  <option key={branch.branchId} value={branch.branchId}>
                    {branch.branchName}
                  </option>
                ))}
              </select>
            </div>
            
            <button className="clear-filters-button" onClick={handleClearFilters}>
              <FiFilter /> Clear Filters
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="results-summary">
          <p>
            Showing {accountOfficers.length} of {totalCount} account officers
            {searchTerm && ` matching "${searchTerm}"`}
            {statusFilter && ` with status "${statusFilter}"`}
            {branchFilter && ` in branch "${branches.find(b => b.branchId === branchFilter)?.branchName}"`}
          </p>
        </div>

        {/* Table */}
        <div className="table-container">
          {loading ? (
            <div className="loading-spinner">Loading account officers...</div>
          ) : accountOfficers.length === 0 ? (
            <div className="no-data">
              <p>No account officers found</p>
              <button className="create-button" onClick={handleCreate}>
                <FiPlus /> Create First Account Officer
              </button>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Account Officer ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Branch</th>
                  <th>Department</th>
                  <th>Position</th>
                  <th>Clients</th>
                  <th>Status</th>
                  <th>Effective Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accountOfficers.map((officer) => (
                  <tr key={officer.accountOfficerId}>
                    <td>{officer.accountOfficerId}</td>
                    <td>
                      <div className="name-cell">
                        <div className="primary-name">
                          {officer.firstName} {officer.lastName}
                        </div>
                        {officer.employeeId && (
                          <div className="secondary-info">
                            ID: {officer.employeeId}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{officer.email}</td>
                    <td>
                      {officer.branch ? (
                        <div>
                          <div className="primary-name">{officer.branch.branchName}</div>
                          <div className="secondary-info">{officer.branch.branchCode}</div>
                        </div>
                      ) : (
                        <span className="no-data">-</span>
                      )}
                    </td>
                    <td>{officer.department || <span className="no-data">-</span>}</td>
                    <td>{officer.position || <span className="no-data">-</span>}</td>
                    <td>
                      <div className="clients-cell">
                        <span className="current-clients">{officer.currentClients}</span>
                        {officer.maxClients && (
                          <span className="max-clients">/ {officer.maxClients}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(officer.status)}`}>
                        {officer.status}
                      </span>
                    </td>
                    <td>
                      {new Date(officer.effectiveDate).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-button view"
                          onClick={() => handleView(officer.accountOfficerId)}
                          title="View Details"
                        >
                          <FiEye />
                        </button>
                        <button 
                          className="action-button edit"
                          onClick={() => handleEdit(officer.accountOfficerId)}
                          title="Edit"
                        >
                          <FiEdit3 />
                        </button>
                        <button 
                          className="action-button delete"
                          onClick={() => handleDelete(officer.accountOfficerId, officer.firstName, officer.lastName)}
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>
    </DashboardWrapper>
  );
}

export default AccountOfficers;
