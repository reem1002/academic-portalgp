import { useEffect, useState, useMemo } from "react";
import api from "../../services/api";
import swalService from "../../services/swal";
import {
    FaPlus,
    FaExclamationTriangle,
    FaCheckCircle,
    FaInfoCircle
} from "react-icons/fa";
import "../styles/StudentOfferings.css";
import {
    Trash2, X
} from 'lucide-react';

const StudentCourseOfferingsPage = () => {
    const [availableCourses, setAvailableCourses] = useState([]);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [draftEnrolled, setDraftEnrolled] = useState([]);
    const [allowedCredits, setAllowedCredits] = useState(0);
    const [activeTab, setActiveTab] = useState("Freshman");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const levels = ["Freshman", "Sophomore", "Junior", "senior-1", "senior-2", "Senior"];

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!loading) {
            localStorage.setItem("courseDraft", JSON.stringify(draftEnrolled));
        }
    }, [draftEnrolled, loading]);

    const isDirty = useMemo(() => {
        if (loading) return false;
        const draftIds = [...draftEnrolled].sort().join(",");
        const originalIds = [...enrolledCourses].sort().join(",");
        return draftIds !== originalIds;
    }, [draftEnrolled, enrolledCourses, loading]);


    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = "You have unsaved changes!";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDirty]);

    // const fetchData = async () => {
    //     setLoading(true);
    //     try {
    //         const availableRes = await api.get("/student/me/available-courses");
    //         setAvailableCourses(availableRes.data.availableOfferings || []);
    //         setAllowedCredits(availableRes.data.allowedCredits || 18);

    //         const enrolledRes = await api.get("/student/me/enrollments/current");
    //         const data = enrolledRes.data || {};
    //         const currentIds = data?.courses?.map((c) => c.courseOfferingId) || [];

    //         setEnrolledCourses(currentIds);
    //         setDraftEnrolled(currentIds);
    //     } catch (err) {
    //         console.error(err);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const fetchData = async () => {

        setLoading(true);

        try {

            const availableRes = await api.get("/student/me/available-courses");

            setAvailableCourses(availableRes.data.availableOfferings || []);

            setAllowedCredits(availableRes.data.allowedCredits || 18);

            const enrolledRes = await api.get("/student/me/enrollments/current");

            const data = enrolledRes.data;
            const currentIds = data?.courses?.map((c) => c.courseOfferingId) || [];

            setEnrolledCourses(currentIds);
            const savedDraft = localStorage.getItem("courseDraft");
            setDraftEnrolled(currentIds);
        } catch (err) {

            console.error(err);

        } finally {

            setLoading(false);

        }

    };

    const currentTotalCredits = useMemo(() => {
        return draftEnrolled.reduce((sum, id) => {
            const offering = availableCourses.find((o) => o._id === id);
            return sum + (offering?.courseId?.courseCredits || 0);
        }, 0);
    }, [draftEnrolled, availableCourses]);

    const isLimitReached = currentTotalCredits >= allowedCredits;

    const addCourse = (id) => {
        const courseToAdd = availableCourses.find(c => c._id === id);
        const creditsOfCourse = courseToAdd?.courseId?.courseCredits || 0;

        if (!draftEnrolled.includes(id)) {
            if (currentTotalCredits + creditsOfCourse > allowedCredits) {
                swalService.error(
                    "Limit Exceeded",
                    `Your credit limit is ${allowedCredits}. This course exceeds it.`
                );
                return;
            }
            setDraftEnrolled([...draftEnrolled, id]);
        }
    };

    const removeCourse = (id) => {
        setDraftEnrolled(draftEnrolled.filter((c) => c !== id));
    };

    const saveEnrollment = async () => {
        // 1. طلب التأكيد باستخدام الكومبوننت بتاعك
        const result = await swalService.confirm(
            "Confirm Selection",
            `Are you sure you want to enroll in ${draftEnrolled.length} courses? Total credits: ${currentTotalCredits}`,
            "Confirm & Save"
        );

        if (!result.isConfirmed) return;

        setSaving(true);
        swalService.showLoading("Registering your courses..."); // الـ Loading اللطيف بتاعك

        try {
            const payload = {
                courses: draftEnrolled.map((id) => ({ courseOfferingId: id }))
            };

            const res = await api.post("/student/me/enroll", payload);

            const newIds = res.data.enrollment.courses.map((c) => c.courseOfferingId);
            setEnrolledCourses(newIds);
            setDraftEnrolled(newIds);
            localStorage.removeItem("courseDraft");

            // نجاح العملية
            swalService.success("Success!", "Your enrollment has been processed successfully.");
        } catch (err) {
            console.error(err);
            // عرض الخطأ اللي جاي من السيرفر
            swalService.error("Registration Failed", err.response?.data?.error || "Something went wrong!");
        } finally {
            setSaving(false);
        }
    };

    // const saveEnrollment = async () => {
    //     setSaving(true);

    //     const payload = {
    //         courses: draftEnrolled.map((id) => ({
    //             courseOfferingId: id
    //         }))
    //     };

    //     console.log("Sending payload:", payload);

    //     try {
    //         const res = await api.post("/student/me/enroll", payload);
    //         console.log("Response:", res.data);

    //         const newIds = res.data.enrollment.courses.map(
    //             (c) => c.courseOfferingId
    //         );

    //         setEnrolledCourses(newIds);
    //         setDraftEnrolled(newIds);
    //         localStorage.removeItem("courseDraft");

    //     } catch (err) {
    //         console.log("ERROR FULL:", err.response);
    //         swalService.error(
    //             "Failed",
    //             err.response?.data?.error || "Enrollment failed"
    //         );
    //     } finally {
    //         setSaving(false);
    //     }
    // };
    if (loading) return <div>Loading...</div>;

    return (
        <div className="management-container student-offerings-container">
            <div className="prereg-header header">
                <h2>Pre-registration Enrollment</h2>
                {isDirty ? (
                    <div className="status-alert warning"><FaExclamationTriangle /> Unsaved Changes</div>
                ) : (
                    <div className="status-alert success"><FaCheckCircle /> Everything is up to date</div>
                )}
            </div>

            <div className={`credit-info-card ${isLimitReached ? "limit-reached" : ""}`}>
                <div className="credit-text">
                    <FaInfoCircle />
                    <span>Credits: <strong>{currentTotalCredits}</strong> / {allowedCredits}</span>
                </div>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.min((currentTotalCredits / allowedCredits) * 100, 100)}%` }}></div>
                </div>
            </div>

            <div className="section">
                <h3>Available Courses ({activeTab})</h3>
                <div className="tabs-navigation">
                    {levels.map(level => (
                        <button
                            key={level}
                            className={`tab-item ${activeTab === level ? "active" : ""}`}
                            onClick={() => setActiveTab(level)}
                        >
                            {level}
                        </button>
                    ))}
                </div>
                <div className="table-wrapper">
                    <table className="offerings-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Credits</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {availableCourses
                                .filter(o => o.courseId.courseLevel?.toLowerCase() === activeTab.toLowerCase())
                                .map((offering) => {
                                    const isInDraft = draftEnrolled.includes(offering._id);
                                    const credits = offering.courseId.courseCredits;
                                    const isDisabled = !isInDraft && (currentTotalCredits + credits > allowedCredits);

                                    return (
                                        <tr key={offering._id} className={isInDraft ? "row-selected" : ""}>
                                            <td>{offering.courseId._id}</td>
                                            <td>{offering.courseId.courseName}</td>
                                            <td>{credits}</td>
                                            <td>
                                                <span className={`status-badge ${offering.status.toLowerCase()}`}>
                                                    {offering.status}
                                                </span>
                                            </td>
                                            <td>
                                                {isInDraft ? (
                                                    <button className="action-btn remove-in-table" onClick={() => removeCourse(offering._id)}>
                                                        <X size={18} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="action-btn add-in-table"
                                                        onClick={() => addCourse(offering._id)}
                                                        disabled={isDisabled}
                                                    >
                                                        <FaPlus size={18} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="section">
                <h3>Current Selection</h3>
                <div className="table-wrapper">
                    <table className="offerings-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Credits</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {draftEnrolled.length === 0 ? (
                                <tr><td colSpan="4"><p className="empty-msg">No courses selected</p></td></tr>
                            ) : (
                                draftEnrolled.map((id) => {
                                    const offering = availableCourses.find(o => o._id === id);
                                    if (!offering) return null;
                                    return (
                                        <tr key={id}>
                                            <td>{offering.courseId._id}</td>
                                            <td>{offering.courseId.courseName}</td>
                                            <td>{offering.courseId.courseCredits}</td>
                                            <td>
                                                <button className="remove-btn" onClick={() => removeCourse(id)}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                <button
                    className={`save-btn ${isDirty ? "active" : ""}`}
                    onClick={saveEnrollment}
                    disabled={!isDirty || saving}
                >
                    {saving ? "Saving..." : "Save Enrollment"}
                </button>
            </div>
        </div>
    );
};

export default StudentCourseOfferingsPage;