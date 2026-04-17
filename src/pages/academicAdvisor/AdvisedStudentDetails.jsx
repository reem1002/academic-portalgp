import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import swalService from "../../services/swal";
import "../styles/StudentDetails.css";
import {
    FaArrowLeft, FaUserTie,
    FaExclamationTriangle, FaInfoCircle, FaEnvelope, FaPhoneAlt, FaSearch
} from "react-icons/fa";
import { GitBranch } from 'lucide-react';

import StudentProgressMapModal from "../../components/StudentProgressMap";

const CREDIT_MAP = {
    total: { label: "Total Credits", key: "completedCredits" },
    core: { label: "Core", key: "coreCompletedCredits" },
    elective1: { label: "Elective 1", key: "elective1CompletedCredits" },
    elective2: { label: "Elective 2", key: "elective2CompletedCredits" },
    elective3: { label: "Elective 3", key: "elective3CompletedCredits" },
    program: { label: "Elective Program", key: "electiveProgramCompletedCredits" },
    math: { label: "Eng. Math", key: "engMathCompletedCredits" },
    physics: { label: "Eng. Physics", key: "engPhysicsCompletedCredits" },
    training: { label: "Training", key: "trainingCompletedCredits" }
};

const AdvisedStudentDetails = () => {
    const navigate = useNavigate();
    const { id, role } = useParams(); // id هو الـ studentId
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            // الإند بوينت الجديدة الخاصة بالأدفايزور
            const res = await api.get(`/academic-advisors/me/students/${id}`);
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

    useEffect(() => {
        fetchStudentDetails();
        fetchAllCourses();
    }, [id]);

    if (loading) return <div className="loading-container"><div className="loader"></div></div>;
    if (error) return <div className="error-container"><FaExclamationTriangle size={30} /> {error}</div>;
    if (!data || !data.transcript) return null;

    const { transcript, semesterWorks } = data;

    const getDisplayCredits = () => {
        const apiKey = CREDIT_MAP[creditType]?.key;
        return transcript[apiKey] || 0;
    };

    // فلترة المواد المكتملة
    const filteredCourses = transcript.completedCourses?.filter(c => {
        const courseName = c.courseId?.courseName || c.courseId || "";
        const courseCode = c.courseId?._id || c.courseId || "";

        const matchesType = filterType === "all" || (filterType === "failed" ? c.grade < 60 : c.courseId?.courseType === filterType);
        const matchesSearch = courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            courseCode.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesType && matchesSearch;
    });

    const failedCount = transcript.completedCourses?.filter(c => c.grade < 60).length || 0;

    return (
        <div className="student-details-wrapper">
            <div className="details-header">
                <div className="header-left">
                    <button className="back-btn-round" onClick={() => navigate(-1)}><FaArrowLeft /></button>
                    <div className="student-main-info">
                        <h1>{transcript.studentId?.studentName}</h1>
                        <div className="id-tags">
                            <span className="id-badge">ID: {transcript.studentId?._id}</span>
                        </div>
                        <div className="status-container">
                            <span className={`badge ${transcript.atRisk ? 'risk' : 'safe'}`}>{transcript.atRisk ? "At Risk" : "Good Standing"}</span>
                            <span className="badge dept">{transcript.department}</span>
                            <span className={`badge level-${transcript.level}`}>{transcript.level}</span>
                            <span className="badge-select">Regulation: {transcript.regulation}</span>
                        </div>
                    </div>
                </div>

                <div className="academic-profile-card">
                    <div className="advisor-info-row " >
                        {/* <div className="icon-circle"><FaUserTie /></div> */}
                        <div className="advisor-contact-minimal" style={{ margin: '0 auto', padding: '0' }} >
                            <span><FaEnvelope /> {transcript.studentId?.studentPhone || "No Phone"}</span>
                            <span><FaPhoneAlt /> {transcript.studentId?.studentEmail || "No Phone"}</span>
                        </div>

                    </div>
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
                </div>

                <div className={`dash-card alert-card ${failedCount > 0 ? 'border-danger' : ''}`}>
                    <label>Failing Courses</label>
                    <div className="value-group">
                        <span className="big-val">{failedCount}</span>
                        <FaExclamationTriangle className={failedCount > 0 ? "text-danger" : "text-muted"} />
                    </div>
                    <p className="sub-info">Needs Academic Guidance</p>
                </div>

                <div className="dash-card">
                    <div className="card-header-flex">
                        <label>Done Credits</label>
                        <select className="card-select" value={creditType} onChange={(e) => setCreditType(e.target.value)}>
                            {Object.entries(CREDIT_MAP).map(([shortKey, info]) => (
                                <option key={shortKey} value={shortKey}>{info.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="value-group">
                        <span className="big-val">{getDisplayCredits()}</span>
                        <span className="unit">Hrs</span>
                    </div>
                </div>

                <div className="dash-card">
                    <label>Academic Alerts</label>
                    <div className="value-group">
                        <span className="big-val">{transcript.alerts}</span>
                        <FaInfoCircle className={transcript.alerts > 0 ? "text-warn" : "text-muted"} />
                    </div>
                </div>
            </div>

            <div className="details-content-sections">
                <div className="data-section">
                    <div className="section-title-bar">
                        <h3>Current Semester Works</h3>
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
                                                <span className="grade-pill">
                                                    {work.grade?.totalGrade ?? 0}/50
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="3" className="empty-msg">No current works found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="data-section" style={{ marginTop: '2rem' }}>
                        <div className="section-title-bar">
                            <h3>Academic Transcript</h3>
                            <button className="btn-1" onClick={() => setIsMapModalOpen(true)}>
                                <GitBranch size={18} /> View Progress Map
                            </button>
                        </div>

                        <div className="filter-search-row">
                            <div className="search-box">
                                <FaSearch />
                                <input type="text" placeholder="Search course..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
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
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* البداية الصحيحة للشرط: نتأكد أولاً هل المصفوفة تحتوي على بيانات */}
                                    {filteredCourses && filteredCourses.length > 0 ? (
                                        filteredCourses.map((course, index) => {
                                            const info = getGradeInfo(course.grade);

                                            // البحث عن تفاصيل المادة
                                            const courseDetails = allCourses.find(c => c._id === course.courseId) ||
                                                { _id: course.courseId, courseName: "Loading..." };

                                            return (
                                                <tr key={index}>
                                                    <td className="course-main-td">
                                                        <div className="course-code">{courseDetails._id}</div>
                                                        <div className="course-name-sub">{courseDetails.courseName}</div>
                                                    </td>
                                                    <td>
                                                        <span className={`level-pill ${courseDetails.courseLevel}`}>
                                                            {courseDetails.courseLevel || "N/A"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="type-tag">{courseDetails.courseType || "N/A"}</div>
                                                        <div className="credits-sub">{courseDetails.courseCredits || 0} Credits</div>
                                                    </td>
                                                    <td>
                                                        <span className={`status-pill ${info.class}`}>
                                                            {info.status}
                                                        </span>
                                                        <div className="grade-display" style={{ marginTop: '5px' }}>
                                                            {course.grade} <span className="letter-grade">({info.letter})</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="reg-badge">
                                                            {courseDetails.courseRegulation || "N/A"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        }) 
                                    ) : (
                                      
                                        <tr>
                                            <td colSpan="6" className="empty-msg">No courses found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <StudentProgressMapModal
                isOpen={isMapModalOpen}
                onClose={() => setIsMapModalOpen(false)}
                studentData={data}
                allCourses={allCourses}
            />
        </div>
    );
};

export default AdvisedStudentDetails;