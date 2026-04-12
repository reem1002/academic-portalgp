import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../services/api";
import swalService from "../../services/swal";
import "../styles/StudentDetails.css";
import {
    FaArrowLeft, FaPlus, FaUserTie,
    FaExclamationTriangle, FaInfoCircle, FaEnvelope, FaPhoneAlt, FaSearch
} from "react-icons/fa";
import {
    Trash2,
} from 'lucide-react';

import EditGradeModal from "../../components/EditGradeModal";
import AddCompletedCourseModal from "../../components/AddCompletedCourseModal";

const CREDIT_MAP = {
    total: { label: "Total Credits", key: "completedCredits" },
    core: { label: "Core", key: "coreCompletedCredits" },
    elective1: { label: "Elective 1", key: "elective1CompletedCredits" },
    elective2: { label: "Elective 2", key: "elective2CompletedCredits" },
    elective3: { label: "Elective 3", key: "elective3CompletedCredits" },
    program: { label: "Elective Program", key: "electiveProgramCompletedCredits" },
    economy: { label: "Eng. Economy", key: "engEconomyCompletedCredits" },
    math: { label: "Eng. Math", key: "engMathCompletedCredits" },
    physics: { label: "Eng. Physics", key: "engPhysicsCompletedCredits" },
    project: { label: "Graduation Project", key: "graduationProjectCompletedCredits" },
    management: { label: "Project Management", key: "projectManagementElectiveCompletedCredits" },
    training: { label: "Training", key: "trainingCompletedCredits" }
};

const StudentDetails = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);

    const [filterType, setFilterType] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [creditType, setCreditType] = useState("total");

    const fetchStudentDetails = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/students/${id}/details`);
            setData(res.data);
            setLoading(false);
        } catch (err) {
            setError("Failed to load student data.");
            setLoading(false);
        }
    };
    const getGradeInfo = (grade) => {
        if (grade >= 90) return { letter: "A", class: "safe", status: "Passed" };
        if (grade >= 80) return { letter: "B", class: "safe", status: "Passed" };
        if (grade >= 70) return { letter: "C", class: "safe", status: "Passed" };
        if (grade >= 60) return { letter: "D", class: "safe", status: "Passed" };
        return { letter: "F", class: "risk", status: "Failed" };
    };

    useEffect(() => { fetchStudentDetails(); }, [id]);

    if (loading) return <div className="loading-container"><div className="loader"></div></div>;
    if (error) return <div className="error-container"><FaExclamationTriangle size={30} /> {error}</div>;
    if (!data) return null;

    const { transcript, advisor, semester, semesterWorks } = data;

    const getDisplayCredits = () => {
        if (!transcript) return 0;
        const apiKey = CREDIT_MAP[creditType]?.key;
        return transcript[apiKey] || 0;
    };

    // تصفية البيانات للجدول (نوع المادة + كلمة البحث)
    const filteredCourses = transcript.completedCourses?.filter(c => {
        const matchesType = filterType === "all" || (filterType === "failed" ? c.grade < 60 : c.courseId?.courseType === filterType);
        const matchesSearch = c.courseId?.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.courseId?._id.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesType && matchesSearch;
    });

    const failedCount = transcript.completedCourses?.filter(c => c.grade < 60).length || 0;

    const handleDeleteCourse = async (courseId) => {
        const result = await swalService.confirm(
            "Delete Course?",
            "This course will be permanently removed from the student's transcript. GPA will be recalculated.",
            "Yes, Delete it",
            "warning"
        );

        if (result.isConfirmed) {
            try {
                swalService.showLoading("Deleting course...");
                await api.delete(`/transcripts/${transcript._id}/courses/${courseId}`);

                // إعادة جلب البيانات لتحديث الـ GPA والـ Credits تلقائياً
                await fetchStudentDetails();

                swalService.success("Deleted", "The course has been removed and records updated.", 1500);
            } catch (err) {
                console.error(err);
                swalService.error("Error", "Failed to delete the course. It might be a required prerequisite.");
            }
        }
    };

    return (
        <div className="student-details-wrapper">
            <div className="details-header">
                <div className="header-left">
                    <button className="back-btn-round" onClick={() => window.history.back()}><FaArrowLeft /></button>
                    <div className="student-main-info">
                        <h1>{transcript.studentId?.studentName}</h1>
                        <div className="id-tags">
                            <span className="id-badge">ID: {transcript.studentId?._id}</span>
                            <span className="id-badge">@{transcript.studentId?.username}</span>
                        </div>
                        <div className="status-container">
                            <span className={`badge ${transcript.atRisk ? 'risk' : 'safe'}`}>{transcript.atRisk ? "At Risk" : "Good Standing"}</span>
                            <span className="badge dept">{transcript.department}</span>
                            <span className={`badge level-${transcript.level}`}>{transcript.level}</span>
                            <span className={`badge reg-${transcript.regulation?.toLowerCase()}`}>{transcript.regulation} Regulation</span>
                        </div>
                    </div>
                </div>

                {/* Academic Advisor Card المحدثة */}
                <div className="academic-profile-card">
                    <div className="advisor-info-row">
                        <div className="icon-circle"><FaUserTie /></div>
                        <div>
                            <p className="label">Academic Advisor</p>
                            <p className="name">{advisor?.staffName || "Not Assigned"}</p>
                        </div>
                    </div>
                    {/* عرض بيانات تواصل الأدفايزور إذا وجدت */}
                    {advisor && (
                        <div className="advisor-contact-minimal">
                            {advisor.staffEmail && <span><FaEnvelope /> {advisor.staffEmail}</span>}
                            {advisor.staffPhone && <span><FaPhoneAlt /> {advisor.staffPhone}</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* صف تواصل الطالب - يظهر قبل الـ Dashboard Grid */}
            <div className="student-contact-bar">
                <div className="contact-item">
                    <FaEnvelope className="icon" />
                    <span className="label">Email:</span>
                    <span className="value">{transcript.studentId?.studentEmail || "N/A"}</span>
                </div>
                <div className="contact-item">
                    <FaPhoneAlt className="icon" />
                    <span className="label">Phone:</span>
                    <span className="value">{transcript.studentId?.studentPhone || "N/A"}</span>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className={`dash-card primary ${transcript.GPA < 2 ? 'border-danger' : ''}`}>
                    <label>Cumulative GPA</label>
                    <div className="gpa-display">
                        {/* إضافة Class 'text-danger' لو الـ GPA أقل من 2 */}
                        <span className={`gpa-value ${transcript.GPA < 2 ? 'text-danger' : ''}`}>
                            {transcript.GPA?.toFixed(2)}
                        </span>
                        <span className="gpa-max">/ 4.0</span>
                    </div>
                    <div className="mini-progress-bar">
                        {/* تغيير لون الـ fill ليكون أحمر لو الـ GPA أقل من 2 */}
                        <div
                            className="fill"
                            style={{
                                width: `${(transcript.GPA / 4) * 100}%`,
                                backgroundColor: transcript.GPA < 2 ? '#e74c3c' : '#58b777'
                            }}
                        ></div>
                    </div>
                </div>

                <div className={`dash-card alert-card ${failedCount > 0 ? 'border-danger' : ''}`} onClick={() => setFilterType("failed")}>
                    <label>Failing Courses</label>
                    <div className="value-group">
                        <span className="big-val">{failedCount}</span>
                        <FaExclamationTriangle className={failedCount > 0 ? "text-danger" : "text-muted"} />
                    </div>
                    <p className="sub-info">Requires Immediate Action</p>
                </div>

                <div className="dash-card">
                    <div className="card-header-flex">
                        <label>Done Credits</label>
                        <select
                            className="card-select"
                            value={creditType}
                            onChange={(e) => setCreditType(e.target.value)}
                        >
                            {Object.entries(CREDIT_MAP).map(([shortKey, info]) => (
                                <option key={shortKey} value={shortKey}>
                                    {info.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="value-group">
                        <span className="big-val">{getDisplayCredits()}</span>
                        <span className="unit">Hrs</span>
                    </div>
                    <p className="sub-info">From total curriculum</p>
                </div>

                <div className="dash-card">
                    <label>Academic Alerts</label>
                    <div className="value-group">
                        <span className="big-val">{transcript.alerts}</span>
                        <FaInfoCircle className={transcript.alerts > 0 ? "text-warn" : "text-muted"} />
                    </div>
                    <p className="sub-info">System Notifications</p>
                </div>
            </div>

            <div className="details-content-sections">

                {/* Section 1: Semester Works */}

                <div className="data-section">

                    <div className="section-title-bar">

                        <h3>Current Semester Works</h3>

                        <span className="badge dept">{semester?._id}</span>

                    </div>

                    <div className="table-responsive table-wrapper">

                        <table className="modern-table">

                            <thead>

                                <tr>

                                    <th>Code</th>

                                    <th>Course Name</th>

                                    <th>Grade</th>

                                </tr>

                            </thead>

                            <tbody>

                                {semesterWorks?.length > 0 ? (
                                    semesterWorks.map((work) => (
                                        <tr key={work._id}>
                                            <td className="bold">{work.courseId?._id}</td>
                                            <td>{work.courseId?.courseName}</td>
                                            <td>
                                                {/* التعديل هنا: بدل work.grade فقط */}
                                                <span className="grade-pill">
                                                    {typeof work.grade === 'object' ? work.grade.totalGrade : work.grade}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (

                                    <tr><td colSpan="4" className="empty-msg">No courses enrolled this semester</td></tr>

                                )}

                            </tbody>

                        </table>

                    </div>

                    <div className="data-section">
                        <div className="section-title-bar">
                            <h3>Academic Transcript</h3>
                            <button className="add-action-btn" onClick={() => setIsAddModalOpen(true)}><FaPlus /> Add Completed Course</button>
                        </div>

                        <div className="filter-search-row">
                            <div className="search-box">
                                <FaSearch />
                                <input type="text" placeholder="Search by course name or code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            <select className="filter-dropdown" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                <option value="all">All Courses</option>
                                <option value="core">Core Only</option>
                                <option value="elective1">Electives Only</option>
                                <option value="failed">Failed Only</option>
                            </select>
                        </div>

                        <div className="table-wrapper">
                            <table className="modern-table">
                                <thead><tr><th>Code</th><th>Course Name</th><th>Status</th><th>Grade</th>
                                    <th>Actions</th>
                                </tr></thead>
                                <tbody>
                                    {filteredCourses && filteredCourses.length > 0 ? (
                                        filteredCourses.map((course, index) => {
                                            const info = getGradeInfo(course.grade);
                                            return (
                                                <tr key={index}>
                                                    <td className="bold">{course.courseId?._id}</td>
                                                    <td>{course.courseId?.courseName}</td>
                                                    <td>
                                                        <span className={`status-pill ${info.class}`}>
                                                            {info.status}
                                                        </span>
                                                    </td>
                                                    <td className="bold">
                                                        {course.grade} <small>[{info.letter}]</small>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="delete-btn-table"
                                                            onClick={() => handleDeleteCourse(course._id)}
                                                            title="Delete Course"
                                                        >
                                                            <Trash2 size={18} style={{ color: '#e74c3c' }} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="empty-msg">
                                                No courses completed yet
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>

            <EditGradeModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={fetchStudentDetails} courseData={editingCourse} />
            
            <AddCompletedCourseModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={() => {
                    fetchStudentDetails();
                    setIsAddModalOpen(false);
                    swalService.success("Course Added", "The transcript has been updated successfully.");
                }}
                transcriptId={transcript._id}
            />
        </div>
    );
};

export default StudentDetails;