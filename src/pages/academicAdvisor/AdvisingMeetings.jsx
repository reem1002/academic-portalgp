import React, { useState, useEffect } from "react";
import api from "../../services/api";
import swalService from "../../services/swal";
// import {
//     Calendar, Clock, Loader2, Info,
//     CheckCircle, CalendarClock, User,
//     Check, X, MessageSquare, ListTodo, History
// } from 'lucide-react';
import {
    Calendar, Clock, Loader2, Info,
    CheckCircle, CalendarClock, User,
    Check, X, MessageSquare, ListTodo, History,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import "../styles/AdvisingManagement.css";
import "../styles/Meetings.css";
import "./styles/Ad-meet.css";

const AdvisingMeetings = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [meetings, setMeetings] = useState([]);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [activeTab, setActiveTab] = useState('Meeting Requests');
    const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();
    // ... داخل المكون
    const [selectedDate, setSelectedDate] = useState(null);
    const [highlightedMeetingId, setHighlightedMeetingId] = useState(null);



    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [meetingsRes, requestsRes] = await Promise.all([
                api.get("/academic-advisors/me/meetings"),
                api.get("/academic-advisors/me/meetings/requests")
            ]);

            setMeetings(requestsRes.data || []);
            console.log("m====", meetingsRes.data);
            setRequests(requestsRes.data || []);
            console.log("r====", requestsRes.data);
        } catch (err) {
            swalService.error("Error", "Failed to load data from server.");
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (meetingId, status) => {
        const confirmMsg = status === 'approved' ? "Approve this meeting?" : "Decline this meeting?";
        const result = await swalService.confirm(status.toUpperCase(), confirmMsg);

        if (!result.isConfirmed) return;

        setActionLoading(meetingId);
        try {
            await api.post(`/academic-advisors/me/meetings/respond/${meetingId}`, { status });
            swalService.success("Success", `Meeting ${status} successfully.`);
            fetchAllData(); // تحديث الكل عشان البيانات تتنقل بين التابز
        } catch (err) {
            swalService.error("Failed", err.response?.data?.message || "Could not update status.");
        } finally {
            setActionLoading(null);
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

    // فلترة البيانات بناءً على التاب النشطة
    const getDisplayData = () => {
        let filtered = meetings;

        // 1. الفلترة حسب التاب النشطة
        if (activeTab === 'Meeting Requests') {
            filtered = filtered.filter(m => m.meetingStatus === 'pending');
        } else if (activeTab === 'Upcoming Meetings') {
            filtered = filtered.filter(m => m.meetingStatus === 'approved');
        } else {
            filtered = filtered.filter(m => m.meetingStatus === 'declined');
        }

        // 2. الفلترة حسب التاريخ المختار من الكاليندر
        if (selectedDate) {
            filtered = filtered.filter(m =>
                m.meetingDate && m.meetingDate.startsWith(selectedDate)
            );
        }

        // 3. الفلترة لو ميتنج محدد تم اختياره
        if (highlightedMeetingId) {
            filtered = filtered.filter(m => m._id === highlightedMeetingId);
        }

        return filtered;
    };

    const displayData = getDisplayData();

    const stats = {
        requests: meetings.filter(m => m.meetingStatus === 'pending').length,
        upcoming: meetings.filter(m => m.meetingStatus === 'approved').length,
        History: meetings.filter(m => m.meetingStatus === 'declined').length
    };

    const renderCalendar = () => {
        // 1. تعريف المتغيرات الأساسية داخل الدالة
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const totalDays = daysInMonth(month, year);
        const startDay = firstDayOfMonth(month, year);
        const days = []; // مصفوفة الأيام التي كانت تسبب خطأ no-undef

        // 2. بناء المربعات الفارغة (قبل بداية الشهر)
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        // 3. بناء أيام الشهر
        for (let d = 1; d <= totalDays; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

            const dayMeetings = meetings.filter(m =>
                m.meetingDate && m.meetingDate.startsWith(dateStr) && m.meetingStatus === 'approved'
            );

            const hasMeeting = dayMeetings.length > 0;
            const isSelected = selectedDate === dateStr;
            const isToday = new Date().toISOString().split('T')[0] === dateStr;

            days.push(
                <div
                    key={d}
                    className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected-day' : ''} ${hasMeeting ? 'has-event' : ''}`}
                    onClick={() => {
                        setSelectedDate(isSelected ? null : dateStr);
                        setHighlightedMeetingId(null);
                    }}
                >
                    <span className="day-number">{d}</span>

                    <div className="calendar-events-list">
                        {dayMeetings.slice(0, 3).map(m => (
                            <div
                                key={m._id}
                                className={`calendar-event-label ${highlightedMeetingId === m._id ? 'active-event' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDate(dateStr);
                                    setHighlightedMeetingId(m._id);
                                    setActiveTab('Upcoming Meetings')
                                }}
                            >
                                <span className="event-time">{m.meetingTime}</span>
                                <span className="event-title">{m.studentId?.substring(0, 5)}...</span>
                            </div>
                        ))}
                        {dayMeetings.length > 3 && (
                            <div className="more-events-tag">+{dayMeetings.length - 3} more</div>
                        )}
                    </div>
                </div>
            );
        }
        return days;
    };

    const changeMonth = (offset) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
    };

    return (
        <div className="advising-container">
            <header className="meeting-header">
                <div className="management-header meeting-header">
                    <div className="title-section">
                        <h1>Advising Management</h1>
                    </div>
                </div>
            </header>

            {/* Tabs Navigation */}
            {/* Tabs Navigation */}
            <div className="m_insights-grid">
                {/* 1. Meeting Requests - Pending Style */}
                <div
                    className={`m_insight-card clickable ${activeTab === 'Meeting Requests' ? 'active-tab pending-border' : ''}`}
                    onClick={() => { setActiveTab('Meeting Requests'); setHighlightedMeetingId(null); }}
                >
                    <div className="m_insight-icon pending"><ListTodo size={20} /></div>
                    <div className="m_insight-info">
                        <span className="m_insight-label">New Requests</span>
                        <h3 className="m_insight-value">{stats.requests}</h3>
                    </div>
                </div>

                {/* 2. Upcoming Meetings - Success/Approved Style */}
                <div
                    className={`m_insight-card clickable ${activeTab === 'Upcoming Meetings' ? 'active-tab approved-border' : ''}`}
                    onClick={() => { setActiveTab('Upcoming Meetings'); setHighlightedMeetingId(null); }}
                >
                    <div className="m_insight-icon approved"><Calendar size={20} /></div>
                    <div className="m_insight-info">
                        <span className="m_insight-label">Upcoming Meetings</span>
                        <h3 className="m_insight-value text-success">{stats.upcoming}</h3>
                    </div>
                </div>

                {/* 3. History - Neutral/Muted Style */}
                <div
                    className={`m_insight-card clickable ${activeTab === 'History' ? 'active-tab declined-border' : ''}`}
                    onClick={() => { setActiveTab('History'); setHighlightedMeetingId(null); }}
                >
                    <div className="m_insight-icon total"><History size={20} /></div>
                    <div className="m_insight-info">
                        <span className="m_insight-label">History</span>
                        <h3 className="m_insight-value text-muted">{stats.History}</h3>
                    </div>
                </div>
            </div>
            {/* Visual Calendar Section */}
            <div className="calendar-section-wrapper" style={{ marginBottom: '30px' }}>
                <div className="calendar-card">
                    <div className="calendar-header">
                        <div className="current-month-info">
                            <h2>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                        </div>
                        <div className="calendar-controls">
                            <button className="btn-icon" onClick={() => changeMonth(-1)}><ChevronLeft size={20} /></button>
                            <button className="btn-today" onClick={() => setCurrentMonth(new Date())}>Today</button>
                            <button className="btn-icon" onClick={() => changeMonth(1)}><ChevronRight size={20} /></button>
                        </div>
                    </div>

                    <div className="calendar-grid-header">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="weekday-label">{d}</div>
                        ))}
                    </div>

                    <div className="calendar-grid">
                        {renderCalendar()}
                    </div>
                </div>
            </div>

            <div className="advising-content">
                <div >
                    {loading ? (
                        <div className="loading-state">
                            <Loader2 className="animate-spin" />
                            <p>Fetching data...</p>
                        </div>
                    ) : (
                        <div className="maiin_table_contebt">
                            <div className="management-header meeting-header">
                                <div className="title-section">
                                    <h1>{activeTab}</h1>
                                </div>
                            </div>
                            {(selectedDate || highlightedMeetingId) && (
                                <div className="filter-info-bar">
                                    <span>Showing results for: <strong>{selectedDate}</strong> {highlightedMeetingId && "(Specific Meeting)"}</span>
                                    <button onClick={() => { setSelectedDate(null); setHighlightedMeetingId(null); }}>Reset Filters</button>
                                </div>
                            )}
                            <div className="table-wrapper">
                                <table className="advising-table">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Date & Time</th>
                                            <th>Notes</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayData.length > 0 ? displayData.map(meeting => (
                                            <tr key={meeting._id}>
                                                <td>
                                                    <div className="cell-with-icon">
                                                        <div className="author-avatar" style={{ width: '24px', height: '24px', fontSize: '10px' }}>
                                                            {meeting.studentId?.charAt(0) || "S"}
                                                        </div>
                                                        <span style={{ fontWeight: '500' }}>ID: {meeting.studentId}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="date-time-cell">
                                                        <div className="cell-with-icon">
                                                            <Calendar size={13} className="cell-icon" />
                                                            {new Date(meeting.meetingDate).toLocaleDateString()}
                                                        </div>
                                                        <div className="cell-with-icon subtitle-text">
                                                            <Clock size={13} className="cell-icon" />
                                                            {meeting.meetingTime}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="notes-cell">
                                                    <span>{meeting.meetingNotes || "No details provided"}</span>
                                                </td>
                                                <td>{getStatusBadge(meeting.meetingStatus)}</td>
                                                <td>
                                                    {meeting.meetingStatus === 'pending' ? (
                                                        <div className="action-btns">
                                                            <button
                                                                className="btn-approve-circle"
                                                                title="Approve"
                                                                disabled={actionLoading === meeting._id}
                                                                onClick={() => handleRespond(meeting._id, 'approved')}
                                                            >
                                                                {actionLoading === meeting._id ? <Loader2 size={16} className="animate-spin" /> : <Check size={18} />}
                                                            </button>
                                                            <button
                                                                className="btn-decline-circle"
                                                                title="Decline"
                                                                disabled={actionLoading === meeting._id}
                                                                onClick={() => handleRespond(meeting._id, 'declined')}
                                                            >
                                                                <X size={18} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted small">
                                                            {meeting.meetingStatus === 'approved' ? "Confirmed" : "Archived"}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan="5" className="empty-table-msg">
                                                    <Info size={40} />
                                                    <p>No {activeTab} found.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AdvisingMeetings;