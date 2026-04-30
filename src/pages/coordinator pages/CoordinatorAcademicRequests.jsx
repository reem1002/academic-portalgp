import React, { useState, useEffect } from 'react';
import {
    ClipboardList,
    Search,
    Filter,
    Eye,
    User,
    Calendar,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowUpCircle,
    ArrowDownCircle,
    RotateCcw,
    XCircle,
    FileText,
    LayoutDashboard
} from 'lucide-react';
import api from '../../services/api';
import swalService from "../../services/swal";

const CoordinatorAcademicRequests = () => {
    // States
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);

    // Fetch All Requests for Coordinator
    const fetchAllRequests = async () => {
        try {
            setLoading(true);
            // بناءً على التوثيق الذي أرسلته: http://localhost:5000/api/academic-requests/all
            const res = await api.get("/academic-requests/all");
            setRequests(res.data.Requests || []);
        } catch (err) {
            console.error('Error fetching coordinator requests:', err);
            swalService.error("Failed to load requests data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllRequests();
    }, []);

    // Filter Logic
    const filteredRequests = requests.filter(req => {
        const studentName = req.studentId?.studentName?.toLowerCase() || '';
        const advisorName = req.academicAdvisorId?.staffName?.toLowerCase() || '';
        const term = searchTerm.toLowerCase();

        const matchesSearch = studentName.includes(term) || advisorName.includes(term);
        const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
        const matchesType = typeFilter === '' || req.requestType === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    // Stats for Dashboard view
    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
    };

    // Unified Styles
    const styles = {
        tableHeader: { padding: '16px', fontSize: '13px', color: '#64748b', fontWeight: '600', textAlign: 'left' },
        tableCell: { padding: '16px', fontSize: '14px', borderBottom: '1px solid #f1f5f9' },
        modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)' },
        modalContent: { backgroundColor: '#fff', width: '90%', maxWidth: '700px', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', maxHeight: '85vh', overflowY: 'auto' }
    };

    return (
        <div className="management-container">
            <header className="management-header">
                <div className="prereg-header">
                    <h2>Academic Requests</h2>
                </div>
            </header>

            {/* Global Insights */}
            <div className="insights-grid">
                <div className="insight-card">
                    <div className="insight-header">
                        <span className="insight-icon icon-blue"><LayoutDashboard size={18} /></span>
                        <span className="insight-label">Total Volume</span>
                    </div>
                    <div className="insight-value">{stats.total}</div>
                </div>
                <div className="insight-card">
                    <div className="insight-header">
                        <span className="insight-icon icon-orange"><Clock size={18} /></span>
                        <span className="insight-label">Under Review</span>
                    </div>
                    <div className="insight-value">{stats.pending}</div>
                </div>
                <div className="insight-card">
                    <div className="insight-header">
                        <span className="insight-icon icon-green"><CheckCircle2 size={18} /></span>
                        <span className="insight-label">Finalized</span>
                    </div>
                    <div className="insight-value">{stats.approved}</div>
                </div>
                <div className="insight-card">
                    <div className="insight-header">
                        <span className="insight-icon icon-purple"><AlertCircle size={18} /></span>
                        <span className="insight-label">Dismissed</span>
                    </div>
                    <div className="insight-value">{stats.rejected}</div>
                </div>
            </div>

            {/* Control Bar */}
            <div className="filters-wrapper">
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        className="search-input"
                        type="text"
                        placeholder="Search student or advisor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ paddingLeft: '40px' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="filter-select">
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="filter-select">
                        <option value="">All Types</option>
                        <option value="Withdrawal">Withdrawal</option>
                        <option value="Add Drop">Add Drop</option>
                        <option value="improve Grade">Improve Grade</option>
                        <option value="Overload">Overload</option>
                    </select>
                </div>
            </div>

            {/* Requests Table */}
            <div className="table-wrapper"  >
                <table >
                    <thead >
                        <tr>
                            <th >Student Info</th>
                            <th >Type</th>
                            <th >Course / Action</th>
                            <th >Advisor</th>
                            <th >Status</th>
                            <th >Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Fetching academic records...</td></tr>
                        ) : filteredRequests.length > 0 ? (
                            filteredRequests.map(req => (
                                <tr key={req._id} style={{ transition: '0.2s' }} className="table-row-hover">
                                    <td style={styles.tableCell}>
                                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{req.studentId?.studentName || "N/A"}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>ID: {req.studentId?._id || "N/A"}</div>
                                    </td>
                                    <td style={styles.tableCell}>
                                        <span className={`badge-type ${req.requestType.replace(/\s+/g, '-').toLowerCase()}`}>
                                            {req.requestType}
                                        </span>
                                    </td>
                                    <td style={styles.tableCell}>
                                        <RequestSummaryView request={req} />
                                    </td>
                                    <td style={styles.tableCell}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                                <User size={12} />
                                            </div>
                                            <span style={{ fontSize: '13px' }}>{req.academicAdvisorId?.staffName || "Unassigned"}</span>
                                        </div>
                                    </td>
                                    <td style={styles.tableCell}>
                                        <StatusBadge status={req.status} />
                                    </td>
                                    <td style={styles.tableCell}>
                                        <button
                                            onClick={() => setSelectedRequest(req)}
                                            className="btn-view"
                                            title='view details'
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8' }}>
                                    <FileText size={48} style={{ marginBottom: '12px', opacity: 0.2 }} />
                                    <p>No academic requests match your filters.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Detailed View Modal */}
            {selectedRequest && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Request Details</h3>
                            <button onClick={() => setSelectedRequest(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                            <InfoBox label="Student" value={selectedRequest.studentId?.studentName} icon={<User size={14} />} />
                            <InfoBox label="Assigned Advisor" value={selectedRequest.academicAdvisorId?.staffName} icon={<CheckCircle2 size={14} />} />
                            <InfoBox label="Request Date" value={new Date(selectedRequest.createdAt).toLocaleString()} icon={<Calendar size={14} />} />
                            <InfoBox label="Status" value={selectedRequest.status.toUpperCase()} icon={<Clock size={14} />} />
                        </div>

                        <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                            <h4 style={{ fontSize: '13px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '15px' }}>Decision Logs</h4>

                            <div style={{ marginBottom: '15px' }}>
                                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Advisor Comment:</div>
                                <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '500', marginTop: '4px' }}>
                                    {selectedRequest.academicAdvisorComment || "No comment provided by advisor."}
                                </div>
                            </div>

                            {selectedRequest.studentSuggestion && (
                                <div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>Student Justification:</div>
                                    <div style={{ fontSize: '14px', color: '#475569', marginTop: '4px', fontStyle: 'italic' }}>
                                        "{selectedRequest.studentSuggestion}"
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className='btn-cancel'
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Sub-components for clarity
const RequestSummaryView = ({ request }) => {
    const courseName = request.courseId?.courseName || request.courseId || "Multiple Courses";

    switch (request.requestType) {
        case 'Add Drop':
            return (
                <div style={{ fontSize: '12px' }}>
                    <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}><ArrowUpCircle size={12} /> Added: {request.addedCourses?.length || 0}</div>
                    <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}><ArrowDownCircle size={12} /> Dropped: {request.droppedCourses?.length || 0}</div>
                </div>
            );
        case 'Withdrawal':
            return <div style={{ color: '#ef4444', fontWeight: '500' }}>Withdraw: {courseName}</div>;
        case 'improve Grade':
            return <div style={{ color: '#6366f1', fontWeight: '500' }}>Improve: {courseName}</div>;
        case 'Overload':
            return <div style={{ color: '#f59e0b', fontWeight: '500' }}>Credit Overload</div>;
        default:
            return <span>{courseName}</span>;
    }
};

const StatusBadge = ({ status }) => {
    const map = {
        pending: { bg: '#fff7ed', text: '#c2410c', icon: <Clock size={12} /> },
        approved: { bg: '#f0fdf4', text: '#15803d', icon: <CheckCircle2 size={12} /> },
        rejected: { bg: '#fef2f2', text: '#b91c1c', icon: <XCircle size={12} /> }
    };
    const config = map[status] || map.pending;
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '700',
            backgroundColor: config.bg,
            color: config.text,
            textTransform: 'uppercase'
        }}>
            {config.icon} {status}
        </span>
    );
};

const InfoBox = ({ label, value, icon }) => (
    <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
            {icon} {label}
        </div>
        <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>{value || 'Not available'}</div>
    </div>
);

export default CoordinatorAcademicRequests;