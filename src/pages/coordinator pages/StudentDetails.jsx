import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import swalService from "../../services/swal";
import "../styles/StudentDetails.css";
import {
    FaArrowLeft, FaPlus, FaUserTie,
    FaExclamationTriangle, FaInfoCircle, FaEnvelope, FaPhoneAlt, FaSearch
} from "react-icons/fa";
import {
    Trash2, GitBranch, Edit
} from 'lucide-react';

import EditGradeModal from "../../components/EditGradeModal";
import StudentProgressMapModal from "../../components/StudentProgressMap";
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
    const navigate = useNavigate();
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { role } = useParams();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);

    const [filterType, setFilterType] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [creditType, setCreditType] = useState("total");
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [allCourses, setAllCourses] = useState([]);

    const fetchAllCourses = async () => {
        try {
            const res = await api.get("/courses");
            setAllCourses(res.data);
        } catch (err) {
            console.error("Failed to fetch courses", err);
        }
    };

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

    // دالة تحديث اللائحة (Regulation)
    const handleUpdateRegulation = async (newRegulation) => {
        try {
            swalService.showLoading("Updating Regulation...");
            await api.put(`/transcripts/${data.transcript._id}`, {
                regulation: newRegulation
            });
            await fetchStudentDetails();
            swalService.success("Success", `Regulation updated to ${newRegulation}`);
        } catch (err) {
            console.error(err);
            swalService.error("Error", "Failed to update regulation.");
        }
    };

    const handleUpdateGrade = async (courseId, newGrade) => {
        try {

            await api.put(`/transcripts/${data.transcript._id}/courses/${courseId}`, {
                grade: newGrade
            });
            await fetchStudentDetails();
            return true;
        } catch (err) {
            throw new Error(err.response?.data?.message || "Failed to update grade.");
        }
    };

    const getGradeInfo = (grade) => {
        if (grade >= 90) return { letter: "A", class: "safe", status: "Passed" };
        if (grade >= 80) return { letter: "B", class: "safe", status: "Passed" };
        if (grade >= 70) return { letter: "C", class: "safe", status: "Passed" };
        if (grade >= 60) return { letter: "D", class: "safe", status: "Passed" };
        return { letter: "F", class: "risk", status: "Failed" };
    };

    useEffect(() => {
        fetchStudentDetails();
        fetchAllCourses();
    }, [id]);

    if (loading) return <div className="loading-container"><div className="loader"></div></div>;
    if (error) return <div className="error-container"><FaExclamationTriangle size={30} /> {error}</div>;
    if (!data) return null;

    const { transcript, advisor, semester, semesterWorks } = data;

    const getDisplayCredits = () => {
        if (!transcript) return 0;
        const apiKey = CREDIT_MAP[creditType]?.key;
        return transcript[apiKey] || 0;
    };

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
                await fetchStudentDetails();
                swalService.success("Deleted", "The course has been removed and records updated.", 1500);
            } catch (err) {
                console.error(err);
                swalService.error("Error", "Failed to delete the course.");
            }
        }
    };

    return (
        <div className="management-container student-details-wrapper">
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

                            {/* تعديل اللائحة - Select Box */}
                            <select
                                className="regulation-select-badge badge-select"
                                value={transcript.regulation}
                                onChange={(e) => handleUpdateRegulation(e.target.value)}
                            >
                                <option value="New">New Regulation</option>
                                <option value="last">Last Regulation</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="academic-profile-card">
                    <div className="advisor-info-row">
                        <div className="icon-circle"><FaUserTie /></div>
                        <div>
                            <p className="label">Academic Advisor</p>
                            <p className="name">{advisor?.staffName || "Not Assigned"}</p>
                        </div>
                    </div>
                    {advisor && (
                        <div className="advisor-contact-minimal">
                            {advisor.staffEmail && <span><FaEnvelope /> {advisor.staffEmail}</span>}
                            {advisor.staffPhone && <span><FaPhoneAlt /> {advisor.staffPhone}</span>}
                        </div>
                    )}
                </div>
            </div>

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
                        <span className={`gpa-value ${transcript.GPA < 2 ? 'text-danger' : ''}`}>
                            {transcript.GPA?.toFixed(2)}
                        </span>
                        <span className="gpa-max">/ 4.0</span>
                    </div>
                    <div className="mini-progress-bar">
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
                <div className="data-section">
                    <div className="section-title-bar">
                        <h3>Current Semester Works</h3>
                        <div className="right-sind">
                            <span className="badge dept">{semester?._id}</span>
                            <button
                                className="enroll-btn-icon"
                                onClick={() => navigate(`/staff/${role}/coordinator/enroll/${data.transcript.studentId?._id}`)}
                                title="Enroll in Courses"
                                style={{
                                    background: '#dcfce7',
                                    color: '#166534',
                                    borderColor: '#bbf7d0',
                                    marginLeft: '5px'
                                }}
                            >
                                <FaPlus size={18} color="#10b981" />
                            </button>
                        </div>
                    </div>
                    <div className="table-responsive table-wrapper">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Course Name</th>
                                    <th>Grade</th>
                                    {/* <th>Actions</th> */}
                                </tr>
                            </thead>
                            <tbody>
                                {semesterWorks?.length > 0 ? (
                                    semesterWorks.map((work) => (
                                        <tr key={work._id}>
                                            <td className="bold">{work.courseId?._id}</td>
                                            <td>{work.courseId?.courseName}</td>
                                            <td>
                                                <span className="grade-pill">
                                                    {typeof work.grade === 'object' ? work.grade.totalGrade : work.grade}/50
                                                </span>
                                            </td>
                                            {/* <td>
                                                <button
                                                    className="edit-btn-table"
                                                    title="Edit Grade"
                                                    onClick={() => {
                                                        setEditingCourse(work);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                >
                                                    <Edit size={16} />
                                                </button>
                                            </td> */}
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="empty-msg">No courses enrolled this semester</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="data-section" style={{ marginTop: '2rem' }}>
                        <div className="section-title-bar">
                            <h3>Academic Transcript</h3>
                            <div className="action-group" style={{ display: 'flex', gap: '10px' }}>
                                <button className="btn-1" onClick={() => setIsMapModalOpen(true)}>
                                    <GitBranch size={18} /> Progress Map
                                </button>
                                <button className="btn-1" onClick={() => setIsAddModalOpen(true)}>
                                    <FaPlus /> Add Completed Course
                                </button>
                            </div>
                        </div>

                        <div className="filter-search-row">
                            <div className="search-box">
                                <FaSearch />
                                <input type="text" placeholder="Search course..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            <select className="filter-dropdown" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                <option value="all">All Courses</option>
                                <option value="core">Core Only</option>
                                <option value="elective1">Electives Only</option>
                                <option value="failed">Failed Only</option>
                            </select>
                        </div>

                        <div className="table-wrapper">
                            <table className="modern-table dynamic-table">
                                <thead>
                                    <tr>
                                        <th>Course Info</th>
                                        <th>Academic Level</th>
                                        <th>Type & Credits</th>
                                        <th>Status & Grade</th>
                                        <th>Regulation</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCourses && filteredCourses.length > 0 ? (
                                        filteredCourses.map((course, index) => {
                                            const info = getGradeInfo(course.grade);
                                            const courseDetails = course.courseId || {};

                                            return (
                                                <tr key={index}>
                                                    <td className="course-main-td">
                                                        <div className="course-code">{courseDetails._id}</div>
                                                        <div className="course-name-sub">{courseDetails.courseName}</div>
                                                    </td>

                                                    <td>
                                                        <span className={`level-pill ${courseDetails.courseLevel}`}>
                                                            {courseDetails.courseLevel}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <div className="type-tag">{courseDetails.courseType}</div>
                                                        <div className="credits-sub">{courseDetails.courseCredits} Credits</div>
                                                    </td>

                                                    {/* عمود الحالة والدرجة */}
                                                    <td>
                                                        <span className={`status-pill ${info.class}`}>
                                                            {info.status}
                                                        </span>
                                                        <div className="grade-display" style={{ marginTop: '5px' }}>
                                                            {course.grade} <span className="letter-grade">({info.letter})</span>
                                                        </div>
                                                    </td>

                                                    {/* عمود اللائحة */}
                                                    <td>
                                                        <span className="reg-badge">
                                                            {courseDetails.courseRegulation}
                                                        </span>
                                                    </td>

                                                    {/* عمود الأزرار */}
                                                    <td className="action-cell">
                                                        <div className="action-flex">
                                                            <button
                                                                className="btn-edit"
                                                                onClick={() => {
                                                                    setEditingCourse(course);
                                                                    setIsEditModalOpen(true);
                                                                }}
                                                                title="Edit Grade"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                            <button
                                                                className="btn-delete"
                                                                onClick={() => handleDeleteCourse(course._id)}
                                                                title="Remove Course"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr><td colSpan="6" className="empty-msg">No courses found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <EditGradeModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleUpdateGrade}
                courseData={editingCourse}
            />

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

            <StudentProgressMapModal
                isOpen={isMapModalOpen}
                onClose={() => setIsMapModalOpen(false)}
                studentData={data}
                allCourses={allCourses}
            />
        </div>
    );
};

export default StudentDetails;