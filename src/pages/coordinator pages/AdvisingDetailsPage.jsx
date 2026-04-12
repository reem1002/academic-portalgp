import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import swalService from "../../services/swal";
import { FaArrowLeft, FaUserGraduate, FaExclamationCircle, FaSearch, FaEnvelope } from "react-icons/fa";
import { Trash2, UserCheck, Eye } from 'lucide-react';
import "../styles/AdvisingDetails.css";

const AdvisingDetails = () => {
    const navigate = useNavigate();
    const { advisorId } = useParams();
    const { role } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [actionLoading, setActionLoading] = useState(false); // لحالة التحميل أثناء الحذف

    const fetchDetails = async () => {
        try {
            const res = await api.get(`/advisors/${advisorId}/advisors/advising-lists`);
            setData(res.data);
        } catch (err) {
            console.error("Error fetching list", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [advisorId]);

    const handleRemoveStudent = async (studentId) => {
        if (!studentId) return;

        // استخدام الـ Confirm الخاص بـ SweetAlert
        const result = await swalService.confirm(
            "Remove Student",
            "Are you sure you want to remove this student from the advising list?"
        );

        if (result.isConfirmed) {
            setActionLoading(true);
            try {
                const payload = {
                    _id: data._id,
                    studentId: studentId
                };

                await api.post("/advisors/remove-student", payload);

                // التحديث اليدوي للـ State لضمان عدم اختفاء الجدول
                setData(prev => ({
                    ...prev,
                    students: prev.students.filter(item => item.student?._id !== studentId),
                    studentsCount: prev.studentsCount - 1
                }));

                // تنبيه النجاح
                swalService.success("Removed!", "The student has been removed from the list.");

            } catch (err) {
                console.error("Remove failed", err);
                // تنبيه الخطأ
                const errorMsg = err.response?.data?.message || "Failed to remove student";
                swalService.error("Oops!", errorMsg);
            } finally {
                setActionLoading(false);
            }
        }
    };

    if (loading) return <div className="loading-container"><div className="loader"></div></div>;
    if (!data) return <div className="error-container">No data found for this advisor.</div>;

    const { advisor, students, studentsCount } = data;

    const filteredStudents = students?.filter(item =>
        item.student?.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.student?._id?.includes(searchTerm)
    );

    return (
        <div className="student-details-wrapper-ad">
            <div className="details-header">
                <div className="header-left">
                    <button className="back-btn-round" onClick={() => window.history.back()}>
                        <FaArrowLeft />
                    </button>
                    <div className="student-main-info">
                        <h1>{advisor?.staffName}</h1>
                        <div className="id-tags">
                            <span className="id-badge">ID: {advisor?._id}</span>
                            <span className="id-badge">Advisor</span>
                        </div>
                    </div>
                </div>

                <div className="academic-profile-card">
                    <div className="advisor-info-row">
                        <div className="icon-circle"><UserCheck size={20} /></div>
                        <div>
                            <p className="label">Contact Email</p>
                            <p className="name" style={{ fontSize: '0.8rem' }}>{advisor?.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="dash-card primary">
                    <label>Total Students</label>
                    <div className="value-group" style={{ marginTop: '10px' }}>
                        <span className="big-val">{studentsCount || 0}</span>
                        <FaUserGraduate className="text-muted" />
                    </div>
                    <p className="sub-info">Students under supervision</p>
                </div>

                <div className="dash-card">
                    <label>Active Advisor</label>
                    <div className="value-group" style={{ marginTop: '10px' }}>
                        <span className="big-val">Yes</span>
                        <UserCheck className="text-success" />
                    </div>
                    <p className="sub-info">Staff Status</p>
                </div>

                <div className="dash-card">
                    <label>Last Updated</label>
                    <div className="value-group" style={{ marginTop: '10px' }}>
                        <span className="big-val" style={{ fontSize: '1.2rem' }}>
                            {new Date(data.updatedAt).toLocaleDateString()}
                        </span>
                    </div>
                    <p className="sub-info">Advising list update</p>
                </div>
            </div>

            <div className="data-section">
                <div className="section-title-bar">
                    <h3>Supervised Students</h3>
                </div>

                <div className="filter-search-row">
                    <div className="search-box">
                        <FaSearch />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
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
                                <th>Name</th>
                                <th>Record ID</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents?.length > 0 ? (
                                filteredStudents.map((item) => (
                                    <tr key={item._id}>
                                        <td className="bold">{item.student?._id}</td>
                                        <td>{item.student?.studentName}</td>
                                        <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{item._id}</td>
                                        <td>
                                            <div style={{ display: 'flex', justifyContent: 'center' }}>


                                                <button className="view-btn-transparent" title="View Profile"
                                                    onClick={() => navigate(`/staff/${role}/students/${item.student?._id}`)}>
                                                    <Eye size={18} color="#3a86ff" />
                                                </button>
                                                <button
                                                    className="delete-btn-table"
                                                    title="Remove from list"
                                                    onClick={() => handleRemoveStudent(item.student?._id)}
                                                    disabled={actionLoading}
                                                >
                                                    <Trash2 size={18} style={{ color: actionLoading ? '#cbd5e1' : '#ef4444' }} />
                                                </button>

                                                <div />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="empty-msg" style={{ textAlign: 'center', padding: '2rem' }}>
                                        No students found in this list.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};

export default AdvisingDetails;