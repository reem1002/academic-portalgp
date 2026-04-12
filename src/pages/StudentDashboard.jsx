import React, { useEffect, useState } from "react";
import { Megaphone, Calendar } from "lucide-react";
import api from "../services/api";
import "./styles/StudentDashboard.css";

const StudentDashboard = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const res = await api.get("/announcements/");
            setAnnouncements(res.data);
            console.log(res.data)
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="student-dashboard">

            {/* Header */}
            <div className="student-header">
                <h1>Welcome</h1>
                <p>Here are the latest announcements for you</p>
            </div>

            {/* Announcements Section */}
            <div className="ann-section">
                <div className="section-header">
                    <h2>
                        <Megaphone size={20} />
                        Latest Announcements
                    </h2>
                </div>

                {loading ? (
                    <div className="loader">Loading...</div>
                ) : announcements.length === 0 ? (
                    <p className="empty">No announcements yet</p>
                ) : (
                    <div className="ann-grid">
                        {announcements.slice(0, 6).map((ann) => (
                            <div key={ann._id} className="student-ann-card">

                                <div className="card-top">
                                    <span className="tag">Public</span>
                                </div>

                                <h3>{ann.title}</h3>
                                <p>{ann.content}</p>

                                <div className="card-footer">
                                    <div className="date">
                                        <Calendar size={14} />
                                        {new Date(ann.createdAt).toLocaleDateString()}
                                    </div>

                                    <span className="author">
                                        {ann.staffId?.staffName || "Admin"}
                                    </span>
                                </div>

                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

export default StudentDashboard;