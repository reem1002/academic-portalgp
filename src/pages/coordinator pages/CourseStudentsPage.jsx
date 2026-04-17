import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";
import { ArrowLeft, Search, Users, Eye, UserPlus, X } from "lucide-react"; // ضفت UserPlus و X
import "../styles/StudentDetails.css";

const CourseStudentsPage = () => {
    const { semesterId, courseId, offeringId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { role } = useParams();
    const courseName = location.state?.courseName || "Course Students";


    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // States جديدة للمودال والستاف
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [lecturers, setLecturers] = useState([]);
    const [selectedLecturer, setSelectedLecturer] = useState("");
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Students
                const res = await api.get(`/semester-work/course/${courseId}`);
                setStudents(res.data || []);

                // Fetch Staff for the modal
                const staffRes = await api.get("/staff");
                const onlyLecturers = staffRes.data.filter(s => s.roles.includes("lecturer"));
                setLecturers(onlyLecturers);
            } catch (err) {
                console.error("Error fetching data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [courseId]);

    const handleAssignInstructor = async () => {
        if (!selectedLecturer) return alert("Please select a lecturer");

        setAssigning(true);
        try {
            // 2. استخدام الـ offeringId الصحيح في الـ URL
            await api.post(`/course-offerings/${offeringId}/assign-instructor`, {
                instructorId: selectedLecturer
            });
            alert("Instructor assigned successfully!");
            setIsModalOpen(false);
        } catch (err) {
            console.error("Error assigning instructor", err);
            alert("Failed to assign instructor.");
        } finally {
            setAssigning(false);
        }
    };

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

                <div style={{ display: 'flex', gap: '15px' }}>
                    {/* زرار فتح المودال الجديد */}
                    <button className="assign-btn" onClick={() => setIsModalOpen(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                        <UserPlus size={20} />
                        Assign Lecturer
                    </button>

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
            </div>

            {/* المودال - Modal UI */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Assign Instructor</h2>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <label>Select Lecturer:</label>
                            <select
                                value={selectedLecturer}
                                onChange={(e) => setSelectedLecturer(e.target.value)}
                                className="modal-select"
                            >
                                <option value="">-- Choose a Lecturer --</option>
                                {lecturers.map(staff => (
                                    <option key={staff._id} value={staff._id}>
                                        {staff.staffName} ({staff._id})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button className="confirm-btn" onClick={handleAssignInstructor} disabled={assigning}>
                                {assigning ? "Assigning..." : "Assign Now"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* باقي الجدول كما هو */}
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
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((item) => (
                                    <tr key={item.studentId?._id}>
                                        <td className="bold">{item.studentId?._id}</td>
                                        <td>{item.studentId?.studentName}</td>
                                        <td>
                                            <button
                                                className="view-btn-transparent"
                                                onClick={() => navigate(`/staff/${role}/students/${item.studentId?._id}`)}
                                            >
                                                <Eye size={18} color="#3a86ff" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="empty-msg">No students found matching your search.</td>
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