import React, { useEffect, useState } from "react";
import {
    Megaphone, Calendar, User, Video,
    ArrowRight, Clock, Bell, CalendarCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./styles/StudentDashboard.css";

const StudentDashboard = () => {
    const navigate = useNavigate();

    // States
    const [announcements, setAnnouncements] = useState([]);
    const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [studentName, setStudentName] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [annRes, meetingRes, profileRes] = await Promise.all([
                api.get("/student/me/announcements"),
                api.get("/student/me/meetings"),
                api.get("/student/me/profile").catch(() => ({ data: { studentName: "Student" } }))
            ]);

            setAnnouncements(annRes.data);
            setFilteredAnnouncements(annRes.data);
            setMeetings(meetingRes.data);
            setStudentName(profileRes.data.studentName || profileRes.data.name || "Student");
        } catch (err) {
            console.error("Dashboard error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = async (tabType) => {
        setActiveTab(tabType);
        setLoading(true);
        try {
            let endpoint = "/student/me/announcements";

            if (tabType === "advisingList") {
                endpoint = "/student/me/advising-list-announcements";
            } else if (tabType === "department") {
                endpoint = "/student/me/department-announcements";
            } else if (tabType === "all-public") {
                const publicOnly = announcements.filter(a => a.target === "all");
                setFilteredAnnouncements(publicOnly);
                setLoading(false);
                return;
            }

            const res = await api.get(endpoint);
            setFilteredAnnouncements(res.data);
        } catch (err) {
            console.error("Filter error:", err);
            setFilteredAnnouncements([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "approved": return "sd-status-approved";
            case "declined": return "sd-status-declined";
            default: return "sd-status-pending";
        }
    };

    const getTagClass = (target) => {
        if (target === "advisingList") return "sd-tag-academic";
        if (target === "all") return "sd-tag-public";
        return "sd-tag-dept";
    };

    return (
        <div className="sd-page-wrapper">
            {/* Header Section */}
            <header className="sd-main-header">
                <div className="title-section">
                    <h1 className="sd-title">Welcome back, {studentName}!</h1>
                </div>
            </header>

            {/* Stats / Quick Insights */}
            <div className="sd-stats-grid">
                <div className="sd-stat-card">
                    <div className="sd-stat-icon-wrapper sd-ann-bg"><Bell size={20} /></div>
                    <div className="sd-stat-info">
                        <span className="sd-stat-label">Announcements</span>
                        <span className="sd-stat-value">{announcements.length}</span>
                    </div>
                </div>
                <div className="sd-stat-card">
                    <div className="sd-stat-icon-wrapper sd-meet-bg"><CalendarCheck size={20} /></div>
                    <div className="sd-stat-info">
                        <span className="sd-stat-label">Meetings</span>
                        <span className="sd-stat-value">{meetings.length}</span>
                    </div>
                </div>
            </div>

            <div className="sd-content-layout">
                {/* Main Content: Announcements */}
                <main className="sd-announcements-area">
                    <div className="sd-glass-card">
                        <div className="sd-section-header">
                            <div className="sd-section-title-box">
                                <Megaphone className="sd-primary-icon" size={24} />
                                <h2>Recent Announcements</h2>
                            </div>

                            <div className="sd-filter-tabs">
                                {["all", "all-public", "advisingList", "department"].map((tab) => (
                                    <button
                                        key={tab}
                                        className={`sd-tab-item ${activeTab === tab ? "is-active" : ""}`}
                                        onClick={() => handleTabChange(tab)}
                                    >
                                        {tab === "all" ? "All" : tab === "all-public" ? "Public" : tab === "advisingList" ? "Academic" : "Dept"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className="sd-loading-state">
                                <div className="sd-custom-spinner"></div>
                                <p>Updating feed...</p>
                            </div>
                        ) : filteredAnnouncements.length === 0 ? (
                            <div className="sd-empty-state">
                                <p>No announcements found in this category.</p>
                            </div>
                        ) : (
                            <div className="sd-cards-stack">
                                {filteredAnnouncements.map((ann) => (
                                    <div key={ann._id} className="sd-ann-item">
                                        <div className="sd-ann-header">
                                            <span className={`sd-pill-tag ${getTagClass(ann.target)}`}>
                                                {ann.target === "advisingList" ? "Academic" : ann.target === "all" ? "Public" : "Department"}
                                            </span>
                                            <span className="sd-semester-text">{ann.semesterId}</span>
                                        </div>
                                        <h3 className="sd-ann-title">{ann.title}</h3>
                                        <p className="sd-ann-content">{ann.content}</p>
                                        <div className="sd-ann-footer">
                                            <div className="sd-meta-item">
                                                <Calendar size={14} />
                                                <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <div className="sd-meta-item">
                                                <User size={14} />
                                                <span>{ann.staffId?.staffName || "Admin"}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                {/* Sidebar: Meetings */}
                <aside className="sd-meetings-sidebar">
                    <div className="sd-glass-card">
                        <div className="sd-sidebar-header">
                            <div className="sd-title-inline">
                                <Video size={20} className="sd-primary-icon" />
                                <h3>My Meetings</h3>
                            </div>
                        </div>

                        <div className="sd-mini-list">
                            {loading ? (
                                <p className="sd-loading-text">Loading...</p>
                            ) : meetings.length === 0 ? (
                                <div className="sd-empty-mini">
                                    <p>No scheduled meetings.</p>
                                </div>
                            ) : (

                                meetings.slice(0, 4).map(meet => (
                                    <div key={meet._id} className="sd-mini-card">
                                        <div className={`sd-card-accent ${getStatusClass(meet.meetingStatus)}`}></div>
                                        <div className="sd-mini-info">
                                            <h4>Meeting with Advisor</h4>
                                            <div className="sd-mini-meta">
                                                <span><Calendar size={12} /> {new Date(meet.meetingDate).toLocaleDateString()}</span>
                                                <span><Clock size={12} /> {meet.meetingTime}</span>
                                            </div>
                                        </div>
                                        <div className={`sd-mini-status ${getStatusClass(meet.meetingStatus)}`}>
                                            {meet.meetingStatus}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <button className="sd-full-btn" onClick={() => navigate("/student/meetings")}>
                            View Schedule
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default StudentDashboard;