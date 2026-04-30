import React, { useState, useEffect } from 'react';
import {
    CheckCircle,
    XCircle,
    Clock,
    Search,
    Filter,
    Eye,
    MessageSquare,
    User,
    BookOpen,
    Calendar,
    AlertCircle,
    ClipboardList,
    ArrowUpCircle,
    ArrowDownCircle,
    RotateCcw,
    Plus,
    ChevronDown,
    Trash2,
    CheckCircle2,
    ArrowLeftRight,
    TrendingUp,
    FileMinus,
    Zap,
    X
} from 'lucide-react';
import api from '../../services/api';
import swalService from "../../services/swal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const AdvisorAcademicRequests = () => {
    // States
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState(''); // Added missing state for type filtering
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [advisorComment, setAdvisorComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch Requests
    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get("/academic-advisors/me/academic-requests");
            setRequests(res.data.requests || []);
        } catch (err) {
            console.error('Error fetching requests:', err);
            swalService.error("Failed to load student requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    // Handle Response (Approve/Reject)
    const handleRespond = async (requestId, status) => {
        if (!advisorComment && status === 'rejected') {
            swalService.error('Missing Comment', 'Please provide a reason for rejection');
            return;
        }

        try {
            setIsSubmitting(true);
            await api.put(`/academic-advisors/me/academic-requests/respond/${requestId}`, {
                status: status,
                academicAdvisorComment: advisorComment
            });

            swalService.success(`Request ${status === 'approved' ? 'Approved' : 'Rejected'} successfully`);
            await fetchRequests();
            setSelectedRequest(null);
            setAdvisorComment('');
        } catch (error) {
            console.error('Error responding to request:', error);
            swalService.error("Operation Failed", error.response?.data?.message || "Server error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Corrected Filter Logic
    const filteredRequests = requests.filter(req => {
        const studentName = req.studentId?.studentName?.toLowerCase() || '';
        const studentId = req.studentId?.id?.toString() || '';
        const term = searchTerm.toLowerCase();

        const matchesSearch = studentName.includes(term) || studentId.includes(term);
        const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
        const matchesType = typeFilter === '' || req.requestType === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    // Stats calculation
    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
    };

    // Internalized Styles
    const styles = {
        tableHeader: { padding: '16px', fontSize: '13px', color: '#64748b', fontWeight: '600' },
        tableCell: { padding: '16px', fontSize: '14px' },
        modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
        modalContent: { backgroundColor: '#fff', width: '90%', maxWidth: '650px', borderRadius: '20px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }
    };

    return (
        <div className="management-container">
            <header className="management-header">
                <div className="prereg-header">
                    <h2>Academic Requests</h2>
                </div>
            </header>

            {/* Insights Grid */}
            <div className="insights-grid">
                <div className="insight-card">
                    <div className="insight-header">
                        <span className="insight-icon icon-blue"><ClipboardList size={18} /></span>
                        <span className="insight-label">Total Requests</span>
                    </div>
                    <div className="insight-value">{stats.total}</div>
                </div>

                <div className="insight-card">
                    <div className="insight-header">
                        <span className="insight-icon icon-orange"><Clock size={18} /></span>
                        <span className="insight-label">Pending</span>
                    </div>
                    <div className="insight-value">{stats.pending}</div>
                </div>

                <div className="insight-card">
                    <div className="insight-header">
                        <span className="insight-icon icon-green"><CheckCircle2 size={18} /></span>
                        <span className="insight-label">Approved</span>
                    </div>
                    <div className="insight-value">{stats.approved}</div>
                </div>

                <div className="insight-card">
                    <div className="insight-header">
                        <span className="insight-icon icon-purple"><AlertCircle size={18} /></span>
                        <span className="insight-label">Rejected</span>
                    </div>
                    <div className="insight-value">{stats.rejected}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-wrapper">
                <Search size={22} color="#9ca3af" />
                <input
                    className="search-input"
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                    <option value="">All Types</option>
                    <option value="Withdrawal">Withdrawal</option>
                    <option value="Add Drop">Add Drop</option>
                    <option value="improve Grade">Improve Grade</option>
                    <option value="Overload">Overload</option>
                </select>
            </div>

            {/* Table */}
            <div className="table-wrapper" >
                <table >
                    <thead style={{ backgroundColor: '#f1f5f9' }}>
                        <tr>
                            <th >Student</th>
                            <th >Type</th>
                            <th >Requested Changes</th>
                            <th >Date</th>
                            <th >Status</th>
                            <th >Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading requests...</td></tr>
                        ) : filteredRequests.length > 0 ? (
                            filteredRequests.map(req => (
                                <tr key={req._id} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s' }}>
                                    <td style={styles.tableCell}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {/* <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#1e293b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '14px' }}>
                                                {req.studentId?.studentName?.charAt(0) || '?'}
                                            </div> */}
                                            <div>
                                                <div style={{ fontWeight: '600', color: '#1e293b' }}>{req.studentId?.studentName}</div>
                                                <div style={{ fontSize: '12px', color: '#64748b' }}>ID: {req.studentId?.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={styles.tableCell}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            backgroundColor: '#f1f5f9',
                                            color: '#475569'
                                        }}>{req.requestType}</span>
                                    </td>
                                    <td style={styles.tableCell}>
                                        <RequestDataView request={req} />
                                    </td>
                                    <td style={styles.tableCell}>{new Date(req.createdAt).toLocaleDateString()}</td>
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
                                <td colSpan="6" style={{ padding: '60px 0', textAlign: 'center' }}>
                                    <div style={{ color: '#94a3b8' }}>
                                        <ClipboardList size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                                        <p>No student requests found.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {selectedRequest && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Review Request</h2>
                            <button onClick={() => { setSelectedRequest(null); setAdvisorComment(''); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                                <XCircle size={24} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                            <InfoGroup label="Student Name" value={selectedRequest.studentId.studentName} icon={<User size={16} />} />
                            <InfoGroup label="Student ID" value={selectedRequest.studentId.id} icon={<AlertCircle size={16} />} />
                            <InfoGroup label="Semester" value={selectedRequest.semesterId.name} icon={<Calendar size={16} />} />
                            <InfoGroup label="Type" value={selectedRequest.requestType} icon={<ClipboardList size={16} />} />
                        </div>

                        <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <MessageSquare size={16} /> Student Justification
                            </h3>
                            <p style={{ margin: 0, color: '#1e293b', fontWeight: '500', fontStyle: 'italic', lineHeight: '1.6' }}>
                                "{selectedRequest.writtenReason || selectedRequest.studentSuggestion || "No explanation provided"}"
                            </p>
                            {selectedRequest.withdrawalReason && (
                                <div style={{ marginTop: '10px', fontSize: '13px', color: '#64748b' }}>
                                    <strong>Category:</strong> {selectedRequest.withdrawalReason}
                                </div>
                            )}
                        </div>

                        {selectedRequest.status === 'pending' ? (
                            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                                    Academic Advisor Feedback
                                </label>
                                <textarea
                                    placeholder="Provide feedback or reason for your decision..."
                                    value={advisorComment}
                                    onChange={(e) => setAdvisorComment(e.target.value)}
                                    style={{
                                        width: '100%',
                                        height: '100px',
                                        padding: '12px',
                                        borderRadius: '10px',
                                        border: '1px solid #e2e8f0',
                                        marginBottom: '20px',
                                        outline: 'none',
                                        fontSize: '14px'
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        disabled={isSubmitting}
                                        onClick={() => handleRespond(selectedRequest._id, 'approved')}
                                        style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        <CheckCircle size={18} /> Approve
                                    </button>
                                    <button
                                        disabled={isSubmitting}
                                        onClick={() => handleRespond(selectedRequest._id, 'rejected')}
                                        style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#b44d4b', color: '#fff', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                    >
                                        <XCircle size={18} /> Reject
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: selectedRequest.status === 'approved' ? '#ecfdf5' : '#fef2f2', border: `1px solid ${selectedRequest.status === 'approved' ? '#10b981' : '#ef4444'}` }}>
                                <div style={{ fontWeight: '700', color: selectedRequest.status === 'approved' ? '#065f46' : '#991b1b', marginBottom: '4px' }}>
                                    Result: {selectedRequest.status.toUpperCase()}
                                </div>
                                <div style={{ fontSize: '14px', color: selectedRequest.status === 'approved' ? '#065f46' : '#991b1b' }}>
                                    <strong>Advisor Comment:</strong> {selectedRequest.academicAdvisorComment || "No comment provided"}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper components remain the same
const RequestDataView = ({ request }) => {
    switch (request.requestType) {
        case 'Add Drop':
            return (
                <div style={{ fontSize: '12px' }}>
                    {request.addedCourses?.length > 0 && (
                        <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ArrowUpCircle size={14} /> Add: {request.addedCourses.join(', ')}
                        </div>
                    )}
                    {request.droppedCourses?.length > 0 && (
                        <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ArrowDownCircle size={14} /> Drop: {request.droppedCourses.join(', ')}
                        </div>
                    )}
                </div>
            );
        case 'Withdrawal':
            return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                    <XCircle size={14} color="#ef4444" /> {request.courseId}
                </div>
            );
        case 'improve Grade':
            return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                    <RotateCcw size={14} color="#6366f1" /> {request.courseId}
                </div>
            );
        case 'Overload':
            return (
                <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                    <ArrowUpCircle size={14} /> {request.addedCourses?.join(', ') || 'N/A'}
                </div>
            );
        default:
            return <span>{request.courseId || 'N/A'}</span>;
    }
};

const StatusBadge = ({ status }) => {
    const styles = {
        pending: { bg: '#fffbeb', text: '#f59e0b' },
        approved: { bg: '#ecfdf5', text: '#10b981' },
        rejected: { bg: '#fef2f2', text: '#ef4444' }
    };
    const current = styles[status] || styles.pending;
    return (
        <span style={{
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '700',
            backgroundColor: current.bg,
            color: current.text,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
        }}>
            {status === 'pending' && <Clock size={12} />}
            {status.toUpperCase()}
        </span>
    );
};

const InfoGroup = ({ label, value, icon }) => (
    <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '500' }}>
            {icon} {label}
        </label>
        <div style={{ fontSize: '15px', color: '#1e293b', fontWeight: '600' }}>{value || 'N/A'}</div>
    </div>
);

export default AdvisorAcademicRequests;