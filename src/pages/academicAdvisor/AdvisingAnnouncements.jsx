import React, { useState, useEffect, useMemo } from "react";
import {
    Megaphone, Plus, Search, Edit3, Trash2,
    Calendar, ArrowUpRight, TrendingUp, X,
    LayoutGrid, List
} from "lucide-react";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import swalService from "../../services/swal";
import api from "../../services/api";
import "../styles/Announcements.css";

const AdvisingAnnouncements = () => {
    const [layout, setLayout] = useState("table");
    const [announcements, setAnnouncements] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({ title: "", content: "" });
    const [editingAnn, setEditingAnn] = useState(null);
    const [viewMode, setViewMode] = useState("week");

    // مساعد لجلب التاريخ بصيغة YYYY-MM-DD
    const getDateKey = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            // الـ Endpoint الجديد الخاص بالأدفايزر
            const res = await api.get("/academic-advisors/me/advising-list/announcements");
            setAnnouncements(res.data);
        } catch (err) {
            console.error("Error fetching data:", err);
            swalService.error("Error", "Failed to load announcements.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    // داتا التشارت
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

    const handleEdit = (ann) => {
        setEditingAnn(ann);
        setFormData({ title: ann.title, content: ann.content });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        const result = await swalService.confirm(
            "Delete Announcement?",
            "This will remove the announcement for all students in your list."
        );

        if (result.isConfirmed) {
            try {
                await api.delete(`/academic-advisors/me/advising-list/announcement/${id}`);
                swalService.success("Deleted!", "Announcement has been removed.");
                fetchAnnouncements();
            } catch (err) {
                swalService.error("Error", "Failed to delete the announcement.");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;

        try {
            setSubmitting(true);
            if (editingAnn) {
                // Update - لاحظ استخدام الـ _id في الـ URL
                await api.put(`/academic-advisors/me/advising-list/announcement/${editingAnn._id}`, {
                    ...formData,
                    semesterId: editingAnn.semesterId // الحفاظ على السيمستر
                });
                swalService.success("Updated!", "Announcement updated successfully.");
            } else {
                // Create - الباكيند غالباً بيضيف السيمستر تلقائياً لكن لو محتاج تبعته ممكن تضيفه هنا
                await api.post("/academic-advisors/me/advising-list/announcement", {
                    ...formData,
                    semesterId: "fall-2035" // يفضل طبعاً يكون ديناميكي من الـ Context لو متاح
                });
                swalService.success("Created!", "Announcement sent to your students.");
            }

            setIsModalOpen(false);
            setEditingAnn(null);
            setFormData({ title: "", content: "" });
            fetchAnnouncements();
        } catch (err) {
            swalService.error("Save Error", err.response?.data?.message || "Something went wrong.");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredData = useMemo(() => {
        return announcements.filter((ann) => {
            const matchesSearch = ann.title.toLowerCase().includes(searchTerm.toLowerCase());
            const annDate = ann.createdAt ? getDateKey(ann.createdAt) : "";
            const matchesDate = dateFilter ? annDate === dateFilter : true;
            return matchesSearch && matchesDate;
        });
    }, [announcements, searchTerm, dateFilter]);

    return (
        <div className="advising-container">
            {/* Header */}
            <div className="page-header-section">
                <div className="title-section">
                    <h1>Advising Announcements</h1>
                </div>
                <button className="btn-1" onClick={() => { setEditingAnn(null); setFormData({ title: "", content: "" }); setIsModalOpen(true); }}>
                    <Plus size={18} /> New Announcement
                </button>
            </div>

            {/* Stats & Chart */}
            <div className="insights-grid">
                <div className="stat-card">
                    <div className="stat-icon"><Megaphone size={24} /></div>
                    <div className="stat-info">
                        <h3>{announcements.length}</h3>
                        <p>Total Sent</p>
                    </div>
                    <div className="stat-trend positive"><ArrowUpRight size={14} /> Live</div>
                </div>

                <div className="chart-card">
                    <div className="chart-header">
                        <h4><TrendingUp size={16} /> Broadcast Activity</h4>
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
                            <Tooltip
                                labelFormatter={(value, payload) => payload[0]?.payload?.fullDate || value}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Area type="monotone" dataKey="posts" stroke="#3a86ff" strokeWidth={2} fillOpacity={1} fill="url(#colorPosts)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="controls-row">
                <div className="filters-group" style={{ flex: 1 }}>
                    <div className="search-box-modern">
                        <Search size={18} />
                        <input type="text" placeholder="Search by title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="date-filter-box">
                        <Calendar size={18} />
                        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                        {dateFilter && <X size={14} className="clear-date" onClick={() => setDateFilter("")} />}
                    </div>
                </div>

                <div className="layout-toggle">
                    <button className={layout === "table" ? "active" : ""} onClick={() => setLayout("table")}>
                        <List size={20} />
                    </button>
                    <button className={layout === "grid" ? "active" : ""} onClick={() => setLayout("grid")}>
                        <LayoutGrid size={20} />
                    </button>
                </div>
            </div>

            {/* List Display */}
            {loading ? (
                <div className="loading-state">Loading announcements...</div>
            ) : filteredData.length > 0 ? (
                layout === "table" ? (
                    <div className="table-wrapper">
                        <table className="advising-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Content Preview</th>
                                    <th>Date</th>
                                    <th>Semester</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map(ann => (
                                    <tr key={ann._id}>
                                        <td style={{ fontWeight: '600' }}>{ann.title}</td>
                                        <td className="content-cell">{ann.content}</td>
                                        <td>{new Date(ann.createdAt).toLocaleDateString()}</td>
                                        <td><span className="badge-semester">{ann.semesterId}</span></td>
                                        <td>
                                            <div className="action-btns">
                                                <button onClick={() => handleEdit(ann)} className="btn-edit"><Edit3 size={18} /></button>
                                                <button onClick={() => handleDelete(ann._id)} className="btn-delete"><Trash2 size={18} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="announcements-grid">
                        {filteredData.map(ann => (
                            <div key={ann._id} className="announcement-card">
                                <div className="card-header">
                                    <div className="card-badge">{ann.semesterId}</div>
                                    <div className="card-actions">
                                        <button onClick={() => handleEdit(ann)} className="btn-edit"><Edit3 size={16} /></button>
                                        <button onClick={() => handleDelete(ann._id)} className="btn-delete"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                <h3 className="card-title">{ann.title}</h3>
                                <p className="card-content">{ann.content}</p>
                                <div className="card-footer">
                                    <span className="date-text">{new Date(ann.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                <div className="no-data">No advising announcements found.</div>
            )}

            {/* Form Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editingAnn ? "Edit Announcement" : "Create New Announcement"}</h3>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    required
                                    placeholder="Enter a clear title"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Message Content</label>
                                <textarea
                                    required
                                    rows="5"
                                    placeholder="Write your message here..."
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" disabled={submitting} className="btn-1">
                                    {submitting ? "Processing..." : editingAnn ? "Save Changes" : "Post Announcement"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvisingAnnouncements;