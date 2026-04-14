import React, { useState, useEffect } from "react";
import api from "../services/api";
import swalService from "../services/swal";
import {
    Calendar, Clock, Plus, Loader2,
    Info, X, CheckCircle, CalendarClock
} from 'lucide-react';
import "./styles/AdvisingManagement.css";
import "./styles/Meetings.css";

const StudentMeetings = () => {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        meetingDate: "",
        meetingTime: "",
        meetingNotes: ""
    });

    useEffect(() => {
        fetchMeetings();
    }, []);

    const fetchMeetings = async () => {
        setLoading(true);
        try {
            const res = await api.get("/student/me/meetings");
            setMeetings(res.data || []);
        } catch (err) {
            swalService.error("Error", "Failed to load your meetings.");
        } finally {
            setLoading(false);
        }
    };

    const handleRequestMeeting = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post("/student/me/request-meeting", formData);

            await swalService.success("Sent!", "Your meeting request has been submitted.");
            setIsModalOpen(false);
            setFormData({ meetingDate: "", meetingTime: "", meetingNotes: "" }); // Reset form
            fetchMeetings(); // Refresh list
        } catch (err) {
            swalService.error("Failed", err.response?.data?.message || "Could not send request.");
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return <span className="badge-status pending">Pending</span>;
            case 'approved': return <span className="badge-status success">Approved</span>;
            case 'declined': return <span className="badge-status danger">Declined</span>;
            default: return <span className="badge-status gray">{status}</span>;
        }
    };

    // Calculate Stats for Insights
    const stats = {
        total: meetings.length,
        approved: meetings.filter(m => m.meetingStatus === 'approved').length,
        pending: meetings.filter(m => m.meetingStatus === 'pending').length
    };

    return (
        <div className="advising-container">
            <header className="meeting-header">
                <div className="management-header meeting-header">
                    <div className="title-section">
                        <h1>My Advising Meetings</h1>
                    </div>
                    <button className="btn-1" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} /> Request New Meeting
                    </button>
                </div>
            </header>

            {/* Insight Cards Section */}
            <div className="m_insights-grid">
                <div className="m_insight-card">
                    <div className="m_insight-icon total"><Calendar size={20} /></div>
                    <div className="m_insight-info">
                        <span className="m_insight-label">Total Requests</span>
                        <h3 className="m_insight-value">{stats.total}</h3>
                    </div>
                </div>
                <div className="m_insight-card">
                    <div className="m_insight-icon approved"><CheckCircle size={20} /></div>
                    <div className="m_insight-info">
                        <span className="m_insight-label">Approved</span>
                        <h3 className="m_insight-value text-success">{stats.approved}</h3>
                    </div>
                </div>
                <div className="m_insight-card">
                    <div className="m_insight-icon pending"><Clock size={20} /></div>
                    <div className="m_insight-info">
                        <span className="m_insight-label">Pending</span>
                        <h3 className="m_insight-value text-warning">{stats.pending}</h3>
                    </div>
                </div>
            </div>

            <div className="advising-content">
                <div className="table-wrapper">
                    {loading ? (
                        <div className="loading-state">
                            <Loader2 className="animate-spin" />
                            <p>Fetching your meetings...</p>
                        </div>
                    ) : (
                        <table className="advising-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Notes</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {meetings.length > 0 ? meetings.map(meeting => (
                                    <tr key={meeting._id}>
                                        <td>
                                            <div className="cell-with-icon">
                                                <Calendar size={14} className="cell-icon" />
                                                {new Date(meeting.meetingDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="cell-with-icon">
                                                <Clock size={14} className="cell-icon" />
                                                {meeting.meetingTime}
                                            </div>
                                        </td>
                                        <td className="notes-cell">
                                            {meeting.meetingNotes || "No notes provided"}
                                        </td>
                                        <td>{getStatusBadge(meeting.meetingStatus)}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="empty-table-msg">
                                            <Info size={40} />
                                            <p>No meetings found. Start by requesting one!</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Request Meeting Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Request a Meeting</h3>
                            <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleRequestMeeting}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Meeting Date</label>
                                    <input
                                        type="date"
                                        className="modal-select"
                                        required
                                        min={new Date().toISOString().split("T")[0]}
                                        value={formData.meetingDate}
                                        onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Meeting Time</label>
                                    <input
                                        type="time"
                                        className="modal-select"
                                        required
                                        value={formData.meetingTime}
                                        onChange={(e) => setFormData({ ...formData, meetingTime: e.target.value })}
                                    />
                                    <small className="form-help-text">
                                        Please select a convenient time during working hours.
                                    </small>
                                </div>
                                <div className="form-group">
                                    <label>Notes / Reason</label>
                                    <textarea
                                        className="modal-select"
                                        rows="3"
                                        placeholder="Mention what you want to discuss..."
                                        value={formData.meetingNotes}
                                        onChange={(e) => setFormData({ ...formData, meetingNotes: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={submitting}>
                                    {submitting ? <Loader2 className="animate-spin" size={18} /> : "Submit Request"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentMeetings;