import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";
import { ArrowLeft, Search, Users, GraduationCap, Mail, Eye } from "lucide-react";
import "../styles/StudentDetails.css";

const CourseStudentsPage = () => {
    const { semesterId, courseId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { role } = useParams();
    const courseName = location.state?.courseName || "Course Students";

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await api.get(`/semester-work/course/${courseId}`);
                setStudents(res.data || []);
            } catch (err) {
                console.error("Error fetching students", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [courseId]);


    const filteredStudents = useMemo(() => {
        return students.filter(item =>
            item.studentId?.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.studentId?._id?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    if (loading) return <div className="loading">Fetching Students List...</div>;

    return (
        <div className="student-details-wrapper">
            <div className="details-header">
                <div className="header-left">
                    <button className="back-btn-round" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                    </button>
                    <div className="student-main-info">
                        <h1 style={{ fontSize: '1.5rem' }}>{courseName}</h1>
                        <div className="id-tags">
                            <span className="id-badge">Course ID: {courseId}</span>
                            <span className="id-badge">Semester: {semesterId}</span>
                        </div>
                    </div>
                </div>

                <div className="academic-profile-card" style={{ minWidth: '200px' }}>
                    <div className="advisor-info-row">
                        <div className="icon-circle"><Users size={20} /></div>
                        <div>
                            <p className="label">Total Enrolled</p>
                            <p className="name">{students.length} Students</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="data-section" style={{ marginTop: '20px' }}>
                <div className="filter-search-row">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search students by name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-wrapper">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Student ID</th>
                                <th>Student Name</th>
                                {/* <th>Email</th>
                                <th>Level</th> */}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((item) => (
                                    <tr key={item.studentId?._id}>
                                        <td className="bold">{item.studentId?._id}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {item.studentId?.studentName}
                                            </div>
                                        </td>
                                        {/* <td>{item.studentId?.studentEmail || "N/A"}</td>
                                        <td>
                                            <span className={`badge level-${item.studentId?.level || 1}`}>
                                                Level {item.studentId?.level || "N/A"}
                                            </span>
                                        </td> */}
                                        <td>
                                            <button
                                                className="view-btn-transparent"
                                                title="View Profile"
                                                onClick={() => navigate(`/staff/${role}/students/${item.studentId?._id}`)}
                                            >
                                                <Eye size={18} color="#3a86ff" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="empty-msg">No students found matching your search.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CourseStudentsPage;