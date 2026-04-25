import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import api from "../../services/api";
import { ArrowLeft, Search, Users, Eye, UserPlus, X, GraduationCap } from "lucide-react";
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

    // States للمودال والستاف
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState("instructor"); // 'instructor' or 'ta'
    const [lecturers, setLecturers] = useState([]);
    const [tas, setTas] = useState([]); // State للـ TAs
    const [selectedStaff, setSelectedStaff] = useState("");
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Students
                const res = await api.get(`/semester-work/course/${courseId}`);
                setStudents(res.data || []);

                // Fetch Staff for the modal
                const staffRes = await api.get("/staff");

                // تصفية المحاضرين
                const onlyLecturers = staffRes.data.filter(s => s.roles.includes("lecturer"));
                setLecturers(onlyLecturers);

                // تصفية المعيدين (TAs)
                const onlyTAs = staffRes.data.filter(s => s.roles.includes("ta"));
                setTas(onlyTAs);

            } catch (err) {
                console.error("Error fetching data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [courseId]);

    const handleAssignInstructor = async () => {
        if (!selectedStaff) return alert("Please select a lecturer");

        setAssigning(true);
        try {
            await api.post(`/course-offerings/${offeringId}/assign-instructor`, {
                instructorId: selectedStaff
            });
            alert("Instructor assigned successfully!");
            setIsModalOpen(false);
            setSelectedStaff("");
        } catch (err) {
            console.error("Error assigning instructor", err);
            alert("Failed to assign instructor.");
        } finally {
            setAssigning(false);
        }
    };

    const handleAssignTA = async () => {
        if (!selectedStaff) return alert("Please select a TA");

        setAssigning(true);
        try {
            // استخدام الـ endpoint الخاص بالـ TA والـ body الصحيح taId
            await api.post(`/course-offerings/${offeringId}/assign-ta`, {
                taId: selectedStaff
            });
            alert("TA assigned successfully!");
            setIsModalOpen(false);
            setSelectedStaff("");
        } catch (err) {
            console.error("Error assigning TA", err);
            alert("Failed to assign TA.");
        } finally {
            setAssigning(false);
        }
    };

    // فنكشن لفتح المودال وتحديد النوع
    const openModal = (type) => {
        setModalType(type);
        setSelectedStaff("");
        setIsModalOpen(true);
    };

    const filteredStudents = useMemo(() => {
        return students.filter(item =>
            item.studentId?.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.studentId?._id?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    if (loading) return <div className="loading">Fetching Students List...</div>;

    return (
        <div className="management-container student-details-wrapper">
            <div className="details-header">
                <div className="header-left">
                    <button className="back-btn-round" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                    </button>
                    <div className="student-main-info">
                        <h2 style={{ fontSize: '1.5rem' }}>{courseName}</h2>
                        <div className="id-tags">
                            <span className="id-badge">Course ID: {courseId}</span>
                            <span className="id-badge">Semester: {semesterId}</span>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {/* زرار تعيين المحاضر */}
                    <button className="btn-1" onClick={() => openModal("instructor")}>
                        <UserPlus size={18} />
                        Assign Lecturer
                    </button>

                    {/* زرار تعيين المعيد (TA) */}
                    <button className="btn-1" onClick={() => openModal("ta")}>
                        <GraduationCap size={18} />
                        Assign TA
                    </button>

                    <div className="academic-profile-card" style={{ minWidth: '180px' }}>
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

            {/* المودال الموحد لتعيين الستاف */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{modalType === "instructor" ? "Assign Instructor" : "Assign TA"}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X size={20} /></button>
                        </div>
                        <div className="modal-body">
                            <label>Select {modalType === "instructor" ? "Lecturer" : "Teaching Assistant"}:</label>
                            <select
                                value={selectedStaff}
                                onChange={(e) => setSelectedStaff(e.target.value)}
                                className="modal-select"
                            >
                                <option value="">-- Choose {modalType === "instructor" ? "a Lecturer" : "a TA"} --</option>
                                {(modalType === "instructor" ? lecturers : tas).map(staff => (
                                    <option key={staff._id} value={staff._id}>
                                        {staff.staffName} ({staff._id})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button
                                className="confirm-btn"
                                onClick={modalType === "instructor" ? handleAssignInstructor : handleAssignTA}
                                disabled={assigning}
                            >
                                {assigning ? "Assigning..." : "Assign Now"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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