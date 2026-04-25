import React, { useState, useEffect, useMemo } from "react";
import {
    Megaphone, Users, Plus, Search, Edit3, Trash2,
    Calendar, Globe, ArrowUpRight, TrendingUp, X,
    LayoutGrid, List
} from "lucide-react";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import swalService from "../../services/swal";
import api from "../../services/api";
import "../styles/Announcements.css";

const Announcements = () => {
    const [activeTab, setActiveTab] = useState("department");
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
    const [advisingLists, setAdvisingLists] = useState([]);
    const [selectedAdvId, setSelectedAdvId] = useState("");

    const getDateKey = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };

    const fetchAdvisingLists = async () => {
        try {
            const res = await api.get("/advisors/advising-lists/all");
            setAdvisingLists(res.data);
            if (res.data.length > 0 && !selectedAdvId) {
                setSelectedAdvId(res.data[0]._id); // اختيار أول واحدة تلقائياً
            }
        } catch (err) {
            console.error("Error fetching advising lists:", err);
        }
    };

    useEffect(() => {
        if (activeTab === "advising") {
            fetchAdvisingLists();
        }
    }, [activeTab]);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            let res;
            if (activeTab === "department") {
                res = await api.get("/announcements/");
            } else {
                // لو مفيش ID مختار لسه، متبعثش الريكويست
                if (!selectedAdvId) {
                    setAnnouncements([]);
                    setLoading(false);
                    return;
                }
                res = await api.get(`/announcements/advising-list/${selectedAdvId}`);
            }
            setAnnouncements(res.data);
        } catch (err) {
            console.error("Error fetching data:", err);
            setAnnouncements([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, [activeTab, selectedAdvId]);

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
            "Are you sure you want to delete this announcement? This action cannot be undone."
        );

        if (result.isConfirmed) {
            try {
                await api.delete(`/announcements/${id}`);
                swalService.success("Deleted!", "Announcement has been removed.");
                fetchAnnouncements();
            } catch (err) {
                swalService.error("Error", "Failed to delete the announcement.");
                console.error(err);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitting) return;

        try {
            setSubmitting(true);
            if (editingAnn) {
                await api.put(`/announcements/${editingAnn._id}`, {
                    ...formData,
                    semesterId: editingAnn.semesterId,
                    target: editingAnn.target
                });
                swalService.success("Updated!", "Announcement updated successfully.");
            } else {
                await api.post("/announcements/", {
                    ...formData,
                    target: activeTab === "department" ? "all" : "advising"
                });
                swalService.success("Created!", "New announcement has been posted.");
            }

            setIsModalOpen(false);
            setEditingAnn(null);
            setFormData({ title: "", content: "" });
            fetchAnnouncements();
        } catch (err) {
            swalService.error("Save Error", err.response?.data?.message || "Something went wrong while saving.");
            console.error("Save Error:", err);
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
        <div className="management-container advising-container">
            {/* Header */}
            <div className="page-header-section">
                <div className="prereg-header">
                    <h2>Announcements</h2>
                </div>
                <button className="btn-1" onClick={() => { setEditingAnn(null); setFormData({ title: "", content: "" }); setIsModalOpen(true); }}>
                    <Plus size={18} /> Create New
                </button>
            </div>

            {/* Insights Section */}
            <div className="insights-grid">
                <div className="stat-card">
                    <div className="stat-icon"><Megaphone size={24} /></div>
                    <div className="stat-info">
                        <h3>{announcements.length}</h3>
                        <p>Total Announcements</p>
                    </div>
                    <div className="stat-trend positive"><ArrowUpRight size={14} /> Active</div>
                </div>

                <div className="chart-card">
                    <div className="chart-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4><TrendingUp size={16} /> Activity Trend</h4>
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
                                formatter={(value) => [`${value} Announcements`, "Activity"]}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Area type="monotone" dataKey="posts" stroke="#3a86ff" strokeWidth={2} fillOpacity={1} fill="url(#colorPosts)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Tabs & Controls */}
            <div className="controls-row">
                <div className="advising-tabs">
                    <button className={activeTab === "department" ? "active" : ""} onClick={() => setActiveTab("department")}>
                        <Globe size={18} /> Department
                    </button>
                    <button className={activeTab === "advising" ? "active" : ""} onClick={() => setActiveTab("advising")}>
                        <Users size={18} /> Advising
                    </button>
                </div>

                <div className="filters-group">
                    {activeTab === "advising" && (
                        <div className="select-box-modern">
                            <Users size={18} />
                            <select
                                value={selectedAdvId}
                                onChange={(e) => setSelectedAdvId(e.target.value)}
                                className="adv-select"
                            >
                                <option value="">Select Advising List...</option>
                                {advisingLists.map(list => (
                                    <option key={list._id} value={list._id}>
                                        {list.advisor?.staffName || `List ${list._id}`} ({list.studentsCount} Students)
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* <div className="search-box-modern">
                        <Search size={18} />
                        <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div> */}
                    <div className="date-filter-box">
                        <Calendar size={18} />
                        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                        {dateFilter && <X size={14} className="clear-date" onClick={() => setDateFilter("")} />}
                    </div>
                    {/* Layout Switcher */}
                    <div className="layout-toggle">
                        <button className={layout === "table" ? "active" : ""} onClick={() => setLayout("table")} title="Table View">
                            <List size={20} />
                        </button>
                        <button className={layout === "grid" ? "active" : ""} onClick={() => setLayout("grid")} title="Cards View">
                            <LayoutGrid size={20} />
                        </button>
                    </div>

                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="loading-state">Loading...</div>
            ) : filteredData.length > 0 ? (
                layout === "table" ? (
                    /* Table View */
                    <div className="table-wrapper">
                        <table className="advising-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Content</th>
                                    <th>Date</th>
                                    <th>Author</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map(ann => (
                                    <tr key={ann._id}>
                                        <td style={{ fontWeight: '600', color: '#1e293b' }}>{ann.title}</td>
                                        <td className="content-cell">{ann.content}</td>
                                        <td>{new Date(ann.createdAt).toLocaleDateString()}</td>
                                        <td>{ann.staffId?.staffName || "Admin"}</td>
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
                    /* Cards View (Grid) */
                    <div className="announcements-grid">
                        {filteredData.map(ann => (
                            <div key={ann._id} className="announcement-card">
                                <div className="card-header">
                                    <div className="card-badge">{new Date(ann.createdAt).toLocaleDateString()}</div>
                                    <div className="card-actions">
                                        <button onClick={() => handleEdit(ann)} className="btn-edit"><Edit3 size={16} /></button>
                                        <button onClick={() => handleDelete(ann._id)} className="btn-delete"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                <h3 className="card-title">{ann.title}</h3>
                                <p className="card-content">{ann.content}</p>
                                <div className="card-footer">
                                    <div className="author-info">
                                        <div className="author-avatar">{ann.staffId?.staffName?.charAt(0) || "A"}</div>
                                        <span>{ann.staffId?.staffName || "Admin"}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                <div className="no-data">No announcements found.</div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>{editingAnn ? "Edit Announcement" : "New Announcement"}</h3>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Title</label>
                                <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Content</label>
                                <textarea required rows="4" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} />
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                                <button type="submit" disabled={submitting} className="btn-1">
                                    {submitting ? "Saving..." : editingAnn ? "Update" : "Create"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Announcements;