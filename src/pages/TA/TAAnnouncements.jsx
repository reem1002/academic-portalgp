import React, { useState, useEffect, useMemo } from "react";
import {
    Megaphone, Plus, Search, Edit3, Trash2,
    Calendar, ArrowUpRight, TrendingUp, X,
    LayoutGrid, List, Check, ChevronDown, User, Filter
} from "lucide-react";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import swalService from "../../services/swal";
import api from "../../services/api";
import "../styles/Announcements.css";

const TAAnnouncements = () => {
    // --- States ---
    const [layout, setLayout] = useState("table");
    const [announcements, setAnnouncements] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [totalFilterId, setTotalFilterId] = useState("all");

    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingAnn, setEditingAnn] = useState(null);
    const [viewMode, setViewMode] = useState("week");

    const [formData, setFormData] = useState({
        title: "",
        content: "",
        type: "general",
        expiresAt: "",
        courseId: ""
    });

    const types = ["general", "urgent", "event", "deadline", "warning"];

    const getDateKey = (date) => {
        if (!date) return "";
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    };

    // 1. جلب الكورسات أولاً
    const fetchCourses = async () => {
        try {
            const res = await api.get("/tas/me/courses");
            const coursesData = Array.isArray(res.data) ? res.data : [];
            setCourses(coursesData);
            if (coursesData.length > 0) {

                setSelectedCourseId(coursesData[0]._id);
            }
        } catch (err) {
            console.error("Error fetching courses:", err);
        }
    };

    // 2. جلب إعلانات الكورس المختار
    const fetchAnnouncements = async () => {
        if (!selectedCourseId) return;
        try {
            setLoading(true);
            const res = await api.get(`/tas/me/courses/${selectedCourseId}/announcements`);
            setAnnouncements(Array.isArray(res.data) ? res.data : (res.data.data || []));
        } catch (err) {
            console.error("Error fetching announcements:", err);
            setAnnouncements([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        fetchAnnouncements();
    }, [selectedCourseId]);

    // --- Chart Logic ---
    const chartData = useMemo(() => {
        const range = viewMode === "week" ? 7 : 30;
        const days = [...Array(range)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return getDateKey(d);
        }).reverse();

        return days.map((date) => {
            const d = new Date(date);
            const label = viewMode === "week"
                ? d.toLocaleDateString("en-US", { weekday: "short" })
                : d.toLocaleDateString("en-US", { day: "numeric", month: "short" });

            return {
                name: label,
                posts: announcements.filter((a) => getDateKey(a.createdAt) === date).length,
                fullDate: d.toLocaleDateString("en-US", { dateStyle: "medium" }),
            };
        });
    }, [announcements, viewMode]);

    const filteredData = useMemo(() => {
        return announcements.filter((ann) => {
            const matchesSearch = ann.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ann.content.toLowerCase().includes(searchTerm.toLowerCase());
            const annDate = ann.createdAt ? getDateKey(ann.createdAt) : "";
            const matchesDate = dateFilter ? annDate === dateFilter : true;
            const matchesType = typeFilter === "all" ? true : ann.type === typeFilter;

            return matchesSearch && matchesDate && matchesType;
        });
    }, [announcements, searchTerm, dateFilter, typeFilter]);

    // لحساب التوتال بناءً على اختيار اليوزر في الكارد
    const displayTotalCount = useMemo(() => {
        if (totalFilterId === "all") return announcements.length;
        return announcements.filter(a => a.courseId === totalFilterId).length;
    }, [announcements, totalFilterId]);

    const handleEdit = (ann) => {
        setEditingAnn(ann);
        setFormData({
            title: ann.title,
            content: ann.content,
            type: ann.type || "general",
            expiresAt: ann.expiresAt ? getDateKey(ann.expiresAt) : "",
            courseId: ann.courseId || selectedCourseId
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        const result = await swalService.confirm("Delete Announcement?", "This action cannot be undone.");
        if (result.isConfirmed) {
            try {
                await api.delete(`/tas/me/courses/${id}/announcements`);
                swalService.success("Deleted!", "Announcement removed.");
                fetchAnnouncements();
            } catch (err) { swalService.error("Error", "Failed to delete."); }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;
        try {
            setSubmitting(true);
            if (editingAnn) {
                await api.put(`/tas/me/courses/${editingAnn._id}/announcements`, formData);
                swalService.success("Updated", "Announcement updated successfully");
            } else {
                // نستخدم الـ courseId اللي تم اختياره في الفورم
                await api.post(`/tas/me/courses/${formData.courseId}/announcements`, formData);
                swalService.success("Sent", "Announcement published successfully");
            }
            setIsModalOpen(false);
            fetchAnnouncements();
            setFormData({ title: "", content: "", type: "general", expiresAt: "", courseId: "" });
        } catch (err) {
            swalService.error("Save Error", err.response?.data?.message || "Failed to save.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="management-container advising-ann-container">
            {/* Header */}
            <div className="page-header-section">
                <div className="prereg-header">
                    <h2>Course Announcements
                        <select
                            className="course-selector-header"
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                            style={{ marginLeft: '15px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 8px' }}
                        >
                            {courses.map(c => (
                                <option key={c._id} value={c._id}>{c.courseId?.courseName || c._id}</option>
                            ))}
                        </select>
                    </h2>
                </div>
                <button className="btn-1" onClick={() => {
                    setEditingAnn(null);
                    setFormData({ title: "", content: "", type: "general", expiresAt: "", courseId: selectedCourseId });
                    setIsModalOpen(true);
                }}>
                    <Plus size={18} /> New Announcement
                </button>
            </div>

            {/* Insights Section */}
            <div className="insights-grid">
                <div className="stat-card">
                    <div className="stat-icon"><Megaphone size={24} /></div>
                    <div className="stat-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h3>{displayTotalCount}</h3>
                            <select
                                value={totalFilterId}
                                onChange={(e) => setTotalFilterId(e.target.value)}
                                className="insight-select"
                                style={{ padding: '2px 4px', fontSize: '12px', borderRadius: '4px', border: '1px solid #e2e8f0', outline: 'none' }}
                            >
                                <option value="all">All</option>
                                {courses.map(c => <option key={c._id} value={c._id}>{c.courseId?.courseName}</option>)}
                            </select>
                        </div>
                        <p>Total Announcements</p>
                    </div>
                    <div className="stat-trend positive"><ArrowUpRight size={14} /> Active</div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <h4><TrendingUp size={16} /> Posting Activity</h4>
                        <div className="view-toggle">
                            <button className={viewMode === "week" ? "active" : ""} onClick={() => setViewMode("week")}>Week</button>
                            <button className={viewMode === "month" ? "active" : ""} onClick={() => setViewMode("month")}>Month</button>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={120}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3a86ff" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3a86ff" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Tooltip labelFormatter={(v, p) => p[0]?.payload?.fullDate || v} />
                            <Area type="monotone" dataKey="posts" stroke="#3a86ff" fill="url(#colorPosts)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="filters-bar-modern">
                <div className="filters-upper-row">
                    <div className="search-box-modern">
                        <Search size={18} />
                        <input type="text" placeholder="Search in content..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>

                    <div className="filter-group-horizontal">
                        <div className="filter-item">
                            <Filter size={16} />
                            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                                <option value="all">All Types</option>
                                {types.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                            </select>
                        </div>

                        <div className="filter-item date">
                            <Calendar size={16} />
                            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                            {dateFilter && <X size={14} className="clear-icon" onClick={() => setDateFilter("")} />}
                        </div>
                    </div>

                    <div className="layout-toggle">
                        <button className={layout === "table" ? "active" : ""} onClick={() => setLayout("table")}><List size={20} /></button>
                        <button className={layout === "grid" ? "active" : ""} onClick={() => setLayout("grid")}><LayoutGrid size={20} /></button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div> {/* يمكنك إضافة سبينر هنا */}
                    <p>Loading course data...</p>
                </div>
            ) : (
                layout === "table" ? (
                    <div className="table-wrapper">
                        <table className="advising-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Type</th>
                                    <th>Content Preview</th>
                                    <th>Expiry</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length > 0 ? (
                                    filteredData.map(ann => (
                                        <tr key={ann._id}>
                                            <td style={{ fontWeight: '600' }}>{ann.title}</td>
                                            <td><span className={`badge-type ${ann.type}`}>{ann.type}</span></td>
                                            <td className="content-cell">{ann.content}</td>
                                            <td>{ann.expiresAt ? new Date(ann.expiresAt).toLocaleDateString() : "Permanent"}</td>
                                            <td>
                                                <div className="action-btns">
                                                    <button onClick={() => handleEdit(ann)} className="btn-edit"><Edit3 size={18} /></button>
                                                    <button onClick={() => handleDelete(ann._id)} className="btn-delete"><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5">
                                            <div className="empty-table-state">
                                                <p>No announcements found for this course.</p>
                                                <button
                                                    className="btn-text"
                                                    onClick={() => {
                                                        setEditingAnn(null);
                                                        setFormData({ title: "", content: "", type: "general", expiresAt: "", courseId: selectedCourseId });
                                                        setIsModalOpen(true);
                                                    }}
                                                >
                                                    Create your first announcement
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="announcements-grid">
                        {filteredData.length > 0 ? (
                            filteredData.map(ann => (
                                <div key={ann._id} className={`announcement-card border-${ann.type}`}>
                                    <div className="card-top">
                                        <span className={`badge-type ${ann.type}`}>{ann.type}</span>
                                        <div className="action-btns">
                                            <button onClick={() => handleEdit(ann)} className="btn-edit-small"><Edit3 size={16} /></button>
                                            <button onClick={() => handleDelete(ann._id)} className="btn-delete-small"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <h3 className="card-title">{ann.title}</h3>
                                    <p className="card-content">{ann.content}</p>
                                    <div className="card-meta-info">
                                        <div className="meta-row">
                                            <Calendar size={14} />
                                            <span>Expires: {ann.expiresAt ? new Date(ann.expiresAt).toLocaleDateString() : "No Expiry"}</span>
                                        </div>
                                        <div className="meta-row" style={{ marginTop: '4px' }}>
                                            <span className="date-text">Published: {new Date(ann.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="grid-empty-state">
                                <p>No announcements to display</p>
                                <span>Try adjusting your filters or select another course.</span>
                            </div>
                        )}
                    </div>
                )
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editingAnn ? "Edit Course Announcement" : "Create New Announcement"}</h3>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Target Course</label>
                                <select
                                    required
                                    value={formData.courseId}
                                    onChange={e => setFormData({ ...formData, courseId: e.target.value })}
                                >
                                    <option value="">Select Course</option>
                                    {courses.map(c => (
                                        <option key={c._id} value={c._id}>{c.courseId?.courseName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Announcement Title</label>
                                <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Lab Session Update" />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Type</label>
                                    <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        {types.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Expiry Date</label>
                                    <input type="date" value={formData.expiresAt} onChange={e => setFormData({ ...formData, expiresAt: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Message</label>
                                <textarea required rows="6" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} placeholder="Detailed announcement content..." />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" disabled={submitting} className="btn-1">
                                    {submitting ? "Saving..." : editingAnn ? "Update Announcement" : "Post to Course"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TAAnnouncements;