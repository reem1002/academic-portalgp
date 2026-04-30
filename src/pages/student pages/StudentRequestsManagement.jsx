import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import swalService from "../../services/swal";
import {
    Plus,
    ChevronDown,
    Trash2,
    Search,
    ClipboardList,
    AlertCircle,
    CheckCircle2,
    Clock,
    ArrowLeftRight,
    TrendingUp,
    FileMinus,
    Zap,
    X
} from 'lucide-react';
import '../styles/ProgramCourses.css';

const WITHDRAWAL_REASONS = [
    "Academic Difficulty", "Health Issues", "Not Ready for Final Exam",
    "Absence without Notice", "Absence from midterm or practical",
    "Low semester Work Performance", "Personal Reasons", "Other"
];

const StudentRequestsManagement = () => {
    const [requests, setRequests] = useState([]);
    const [courses, setCourses] = useState([]); // لاختيار الكورسات في المودال
    const [search, setSearch] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [modalType, setModalType] = useState(null); // 'withdrawal', 'add-drop', 'improve', 'overload'
    const [filterType, setFilterType] = useState('');

    // State للنماذج (Forms)
    const [formData, setFormData] = useState({
        courseId: '',
        withdrawalReason: '',
        writtenReason: '',
        studentSuggestion: '',
        addedCourses: [],
        droppedCourses: []
    });

    const fetchRequests = async () => {
        try {
            const res = await api.get("/student/me/academic-requests");
            setRequests(res.data.Requests || []);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAvailableCourses = async () => {
        try {
            const res = await api.get("/student/me/courses");
            setCourses(res.data.courses);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchRequests();
        fetchAvailableCourses();
    }, []);

    const stats = {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length
    };

    const resetForm = () => {
        setFormData({
            courseId: '',
            withdrawalReason: '',
            writtenReason: '',
            studentSuggestion: '',
            addedCourses: [],
            droppedCourses: []
        });
    };

    const openModal = (type) => {
        resetForm();
        setModalType(type);
        setDropdownOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        let endpoint = "";
        let payload = {};

        swalService.showLoading("Submitting your request...");

        try {
            switch (modalType) {
                case 'withdrawal':
                    endpoint = "/student/me/academic-requests/withdraw";
                    payload = {
                        courseId: formData.courseId,
                        withdrawalReason: formData.withdrawalReason,
                        writtenReason: formData.writtenReason,
                        studentSuggestion: formData.studentSuggestion
                    };
                    break;
                case 'add-drop':
                    endpoint = "/student/me/academic-requests/add-drop";
                    payload = {
                        addedCourses: formData.addedCourses,
                        droppedCourses: formData.droppedCourses,
                        studentSuggestion: formData.studentSuggestion
                    };
                    break;
                case 'improve':
                    endpoint = "/student/me/academic-requests/improve-grade";
                    payload = {
                        courseId: formData.courseId,
                        writtenReason: formData.writtenReason,
                        studentSuggestion: formData.studentSuggestion
                    };
                    break;
                case 'overload':
                    endpoint = "/student/me/academic-requests/overload";
                    payload = {
                        addedCourses: formData.addedCourses,
                        writtenReason: formData.writtenReason,
                        studentSuggestion: formData.studentSuggestion
                    };
                    break;
                default: break;
            }

            await api.post(endpoint, payload);
            swalService.success("Success", "Your request has been submitted to your advisor.");
            setModalType(null);
            fetchRequests();
        } catch (err) {
            swalService.error("Submission Failed", err.response?.data?.message || "Something went wrong");
        }
    };

    const deleteRequest = async (requestId) => {
        const result = await swalService.confirm(
            "Cancel Request?",
            "Are you sure you want to delete this pending request?",
            "Yes, Delete",
            "warning"
        );

        if (result.isConfirmed) {
            try {
                await api.delete(`/student/me/academic-requests/${requestId}`);
                swalService.success("Deleted", "Request removed successfully");
                fetchRequests();
            } catch (err) {
                swalService.error("Error", "Could not delete request");
            }
        }
    };

    const filteredRequests = requests.filter(r =>
        (r.requestType.toLowerCase().includes(search.toLowerCase()) ||
            (r.courseId?.courseName || "").toLowerCase().includes(search.toLowerCase())) &&
        (filterType ? r.requestType === filterType : true)
    );

    return (
        <div className="management-container">
            <header className="management-header">
                <div className="prereg-header">
                    <h2>Academic Requests</h2>
                </div>

                <div className="header-actions">
                    <div className="split-button-container">
                        <button className="main-add-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                            <Plus size={18} /> New Request
                        </button>
                        <button className="dropdown-toggle-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                            <ChevronDown size={18} />
                        </button>
                        {dropdownOpen && (
                            <div className="split-dropdown-menu" style={{ width: '200px' }}>
                                <button className="dropdown-item" onClick={() => openModal('withdrawal')}>
                                    <FileMinus size={14} /> Withdrawal Request
                                </button>
                                <button className="dropdown-item" onClick={() => openModal('add-drop')}>
                                    <ArrowLeftRight size={14} /> Add / Drop
                                </button>
                                <button className="dropdown-item" onClick={() => openModal('improve')}>
                                    <TrendingUp size={14} /> Improve Grade
                                </button>
                                <button className="dropdown-item" onClick={() => openModal('overload')}>
                                    <Zap size={14} /> Overload Request
                                </button>
                            </div>
                        )}
                    </div>
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
                    placeholder="Search requests..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="">All Types</option>
                    <option value="Withdrawal">Withdrawal</option>
                    <option value="Add Drop">Add Drop</option>
                    <option value="improve Grade">Improve Grade</option>
                    <option value="Overload">Overload</option>
                </select>
            </div>

            {/* Requests Table */}
            <div className="table-wrapper">
                <table className="management-table">
                    <thead>
                        <tr>
                            <th>Request Type</th>
                            <th>Target Course</th>
                            <th>Advisor</th>
                            <th>Status</th>
                            <th>Submitted Date</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRequests.length > 0 ? (
                            filteredRequests.map(req => (
                                <tr key={req._id}>
                                    <td style={{ fontWeight: '600', color: '#1e293b' }}>{req.requestType}</td>
                                    <td>
                                        {req.courseId ? (
                                            <div>
                                                <div style={{ fontWeight: '500' }}>{req.courseId.courseName}</div>
                                                <div style={{ fontSize: '11px', color: '#64748b' }}>{req.courseId._id}</div>
                                            </div>
                                        ) : (
                                            <span style={{ color: '#94a3b8' }}>N/A</span>
                                        )}
                                    </td>
                                    <td>{req.academicAdvisorId?.staffName || "Not Assigned"}</td>
                                    <td>
                                        <span className={`type-badge status-${req.status}`}
                                            style={{
                                                backgroundColor: req.status === 'pending' ? '#fef3c7' : req.status === 'approved' ? '#dcfce7' : '#fee2e2',
                                                color: req.status === 'pending' ? '#92400e' : req.status === 'approved' ? '#166534' : '#991b1b'
                                            }}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div className="action-btns">
                                            {req.status === 'pending' && (
                                                <button className="btn-icon btn-delete" onClick={() => deleteRequest(req._id)}>
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            /* --- Empty State Row --- */
                            <tr>
                                <td colSpan="6">
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '60px 0',
                                        color: '#94a3b8'
                                    }}>
                                        <ClipboardList size={48} strokeWidth={1} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                        <p style={{ fontSize: '16px', fontWeight: '500', margin: 0 }}>No academic requests found</p>
                                        <p style={{ fontSize: '13px', marginTop: '4px' }}>
                                            {search || filterType ? "Try adjusting your filters or search terms." : "You haven't submitted any requests yet."}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Request Modals */}
            {modalType && (
                <div className="modal-overlay">
                    <div className="modal-card wide">
                        <div className="modal-head">
                            <h3>{modalType.replace('-', ' ').toUpperCase()} REQUEST</h3>
                            <button className="close-x-btn" onClick={() => setModalType(null)}><X size="20" /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">

                                {/* Fields for Withdrawal / Improve Grade */}
                                {(modalType === 'withdrawal' || modalType === 'improve') && (
                                    <div className="form-group">
                                        <label>Select Course</label>
                                        <select
                                            required
                                            value={formData.courseId}
                                            onChange={e => setFormData({ ...formData, courseId: e.target.value })}
                                        >
                                            <option value="">Choose Course...</option>
                                            {courses.map(c => <option key={c._id} value={c._id}>{c.courseName} ({c._id})</option>)}
                                        </select>
                                    </div>
                                )}

                                {/* Reason for Withdrawal */}
                                {modalType === 'withdrawal' && (
                                    <div className="form-group">
                                        <label>Withdrawal Reason Category</label>
                                        <select
                                            required
                                            value={formData.withdrawalReason}
                                            onChange={e => setFormData({ ...formData, withdrawalReason: e.target.value })}
                                        >
                                            <option value="">Choose reason...</option>
                                            {WITHDRAWAL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                )}

                                {/* Fields for Add-Drop / Overload (Multiple Selection Simulation) */}
                                {(modalType === 'add-drop' || modalType === 'overload') && (
                                    <div className="form-group">
                                        <label>Add Courses (Comma separated IDs)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. CS101, MATH102"
                                            onChange={e => setFormData({ ...formData, addedCourses: e.target.value.split(',').map(s => s.trim()) })}
                                        />
                                    </div>
                                )}

                                {modalType === 'add-drop' && (
                                    <div className="form-group">
                                        <label>Drop Courses (Comma separated IDs)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. PHYS101"
                                            onChange={e => setFormData({ ...formData, droppedCourses: e.target.value.split(',').map(s => s.trim()) })}
                                        />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Written Reason / Justification</label>
                                    <textarea
                                        className="cell-input"
                                        style={{ border: '1px solid #cbd5f5', borderRadius: '6px', padding: '10px', minHeight: '80px' }}
                                        value={formData.writtenReason}
                                        onChange={e => setFormData({ ...formData, writtenReason: e.target.value })}
                                        placeholder="Explain why you are making this request..."
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Additional Suggestions (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.studentSuggestion}
                                        onChange={e => setFormData({ ...formData, studentSuggestion: e.target.value })}
                                        placeholder="Any suggestions for the department?"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setModalType(null)}>Cancel</button>
                                <button type="submit" className="btn-1">Submit Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentRequestsManagement;