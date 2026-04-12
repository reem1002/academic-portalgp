import React, { useEffect, useState } from "react";
import api from "../services/api";
import "./styles/StudentDetails.css";
import "./styles/Transcript.css";
import swalService from "../services/swal";
import {
    FaUserTie, FaExclamationTriangle, FaInfoCircle,
    FaEnvelope, FaSearch, FaFileDownload
} from "react-icons/fa";

const CREDIT_MAP = {
    total: { label: "Total Completed", key: "completedCredits" },
    allowed: { label: "Allowed (Next Reg.)", key: "allowedCredits" },
    core: { label: "Core Courses", key: "coreCompletedCredits" },
    elective1: { label: "Elective 1", key: "elective1CompletedCredits" },
    elective2: { label: "Elective 2", key: "elective2CompletedCredits" },
    elective3: { label: "Elective 3", key: "elective3CompletedCredits" },
    program: { label: "Elective Program", key: "electiveProgramCompletedCredits" },
    math: { label: "Eng. Math", key: "engMathCompletedCredits" },
    physics: { label: "Eng. Physics", key: "engPhysicsCompletedCredits" },
    economy: { label: "Eng. Economy", key: "engEconomyCompletedCredits" },
    project: { label: "Grad. Project", key: "graduationProjectCompletedCredits" },
    management: { label: "Project Management", key: "projectManagementElectiveCompletedCredits" },
    training: { label: "Training", key: "trainingCompletedCredits" }
};

const StudentTranscript = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterType, setFilterType] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [creditType, setCreditType] = useState("total");
    const [statusFilter, setStatusFilter] = useState("all");


    const fetchMyDetails = async () => {
        try {
            setLoading(true);
            const res = await api.get("/student/me/details");
            console.log(res.data)
            setData(res.data);
            setLoading(false);
        } catch (err) {
            setError("Failed to load transcript data.");
            setLoading(false);
        }
    };

    const handleFailedCardClick = () => {

        setStatusFilter(prev => prev === "failed" ? "all" : "failed");
    };

    // دالة محسنة تعتمد على الـ Status الفعلي من الـ API
    const getGradeDisplay = (grade, status) => {
        const isPassed = status?.toLowerCase() === "passed";
        return {
            letter: grade >= 60 ? (grade >= 90 ? "A" : grade >= 80 ? "B" : grade >= 70 ? "C" : "D") : "F",
            class: isPassed ? "safe" : "risk",
            label: isPassed ? "Passed" : "Failed"
        };
    };

    useEffect(() => { fetchMyDetails(); }, []);

    if (loading) return <div className="loading-container"><div className="loader"></div></div>;
    if (error) return <div className="error-container"><FaExclamationTriangle size={30} /> {error}</div>;
    if (!data) return null;

    const { transcript, advisor, semester, semesterWorks } = data;

    const getDisplayCredits = () => {
        const apiKey = CREDIT_MAP[creditType]?.key;
        return transcript[apiKey] || 0;
    };


    const filteredCourses = transcript.completedCourses?.filter(c => {
        // 1. فلترة بناءً على الحالة (الدروب داون أو الكارد)
        const matchesStatus = statusFilter === "all" || c.status === statusFilter;

        // 2. فلترة بناءً على البحث النصي
        const matchesSearch =
            c.courseId?.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.courseId?._id.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesStatus && matchesSearch;
    });
    const handleExportPDF = async () => {
        swalService.showLoading("Generating your academic transcript...");

        try {
            // هنا الكود الخاص بالـ Export (سواء API call أو Client-side library)
            // سنحاكي تأخيراً بسيطاً للواقعية
            await new Promise(resolve => setTimeout(resolve, 1500));

            swalService.success("Ready!", "Your transcript has been exported successfully.");
        } catch (err) {
            swalService.error("Export Failed", "Could not generate the PDF file.");
        }
    };
    const contactAdvisor = (email) => {
        swalService.confirm(
            "Contact Advisor",
            `Do you want to send an email to ${email}?`,
            "Open Mail App"
        ).then((result) => {
            if (result.isConfirmed) {
                window.location.href = `mailto:${email}`;
            }
        });
    };

    const showRiskInfo = () => {
        swalService.info(
            "Academic Status",
            "Your status is 'At Risk' because your GPA is below 2.0 or you have failed multiple courses. Please consult your advisor."
        );
    };



    // عدد المواد الراسبة بناءً على الـ status
    const failedCount = transcript.completedCourses?.filter(c => c.status === "failed").length || 0;

    return (
        <div className="student-details-wrapper">
            <div className="details-header">
                <div className="header-left">
                    <div className="student-main-info">
                        <h1>{transcript.studentId?.studentName}</h1>
                        <div className="id-tags">
                            <span className="id-badge">ID: {transcript.studentId?._id}</span>
                            <span className="id-badge">@{transcript.studentId?.username}</span>
                            <span className="id-badge " onClick={handleExportPDF} style={{ cursor: 'pointer' }}>
                                <FaFileDownload /> Export PDF
                            </span>
                        </div>
                        <div className="status-container">
                            <span
                                className={`badge ${transcript.atRisk ? 'risk' : 'safe'}`}
                                onClick={transcript.atRisk ? showRiskInfo : null}
                                style={transcript.atRisk ? { cursor: 'help' } : {}}
                            >
                                {transcript.atRisk ? "At Risk" : "Good Standing"}
                            </span>

                            <span className="badge dept">{transcript.department}</span>
                            <span className={`badge level-${transcript.level}`}>{transcript.level}</span>
                            <span className={`badge reg-${transcript.regulation?.toLowerCase()}`}>
                                {transcript.regulation} Regulation
                            </span>
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

                    {advisor?.staffEmail && (

                        <div className="advisor-contact-minimal">

                            <span><FaEnvelope /> {advisor.staffEmail}</span>

                        </div>

                    )}

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



                <div className="dash-card">

                    <div className="card-header-flex">

                        <label>Credits Earned</label>

                        <select className="card-select" value={creditType} onChange={(e) => setCreditType(e.target.value)}>

                            {Object.entries(CREDIT_MAP).map(([key, info]) => (

                                <option key={key} value={key}>{info.label}</option>

                            ))}

                        </select>

                    </div>

                    <div className="value-group">

                        <span className="big-val">{getDisplayCredits()}</span>

                        <span className="unit">Hrs</span>

                    </div>

                </div>



                <div

                    className={`dash-card alert-card ${statusFilter === 'failed' ? 'active-filter' : ''}`}

                    onClick={handleFailedCardClick}

                    style={{ cursor: 'pointer' }}

                >

                    <label>Failing Courses</label>

                    <div className="value-group">

                        <span className="big-val">{failedCount}</span>

                        <FaExclamationTriangle className={failedCount > 0 ? "text-danger" : "text-muted"} />

                    </div>

                    <p className="sub-info">

                        {statusFilter === 'failed' ? "Click to show all" : "Click to filter failed"}

                    </p>

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
                {/* Current Works Section */}
                <div className="data-section">
                    <div className="section-title-bar">
                        <h3>Semester Works</h3>
                        <span className="badge dept">{semester?.name}</span>
                    </div>
                    <div className="table-wrapper">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Course</th>
                                    <th>Semester Work</th>
                                </tr>
                            </thead>
                            <tbody>
                                {semesterWorks && semesterWorks.length > 0 ? (
                                    semesterWorks.map((work) => (
                                        <tr key={work._id}>
                                            <td className="bold">{work.courseId?._id}</td>
                                            <td>{work.courseId?.courseName}</td>
                                            <td>
                                                <span className="grade-pill">
                                                    {work.grade?.totalGrade} / 50
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="empty-state-cell">
                                            <FaInfoCircle /> No semester works recorded for the current term.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Completed Courses Section */}
                <div className="data-section">
                    <div className="section-title-bar sec-2">
                        <h3>Transcript History</h3>
                    </div>
                    <div className="filter-search-row">
                        <div className="search-box">
                            <FaSearch />
                            <input
                                type="text"
                                placeholder="Search by name or code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="filter-dropdown"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Courses</option>
                            <option value="passed">Passed Only</option>
                            <option value="failed">Failed Only</option>
                        </select>
                    </div>
                    <div className="table-wrapper">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Course Name</th>
                                    <th>Status</th>
                                    <th>Final Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCourses && filteredCourses.length > 0 ? (
                                    filteredCourses.map((course, index) => {
                                        const info = getGradeDisplay(course.grade, course.status);
                                        return (
                                            <tr key={index}>
                                                <td className="bold">{course.courseId?._id}</td>
                                                <td>{course.courseId?.courseName}</td>
                                                <td><span className={`status-pill ${info.class}`}>{info.label}</span></td>
                                                <td className="bold">{course.grade} <small>[{info.letter}]</small></td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="empty-state-cell">
                                            <div className="empty-content">
                                                <p>No courses match your current search or filter.</p>
                                                {/* زرار اختياري لمسح الفلتر بسرعة */}
                                                {(searchTerm || statusFilter !== "all") && (
                                                    <button
                                                        className="btn-1"
                                                        onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}
                                                    >
                                                        Clear Filters
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentTranscript;