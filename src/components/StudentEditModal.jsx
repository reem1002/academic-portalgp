import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, Phone, User } from 'lucide-react';
import api from '../services/api';
import swalService from "../services/swal";
import '../pages/styles/ProgramCourses.css';

const StudentEditModal = ({ isOpen, onClose, studentId, onUpdate }) => {
    const [formData, setFormData] = useState({
        studentName: '',
        studentEmail: '',
        studentPhone: '',
        username: ''
    });
    const [passwordData, setPasswordData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [changePassword, setChangePassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false); // حالة خاصة بجلب البيانات في البداية

    // جلب بيانات الطالب عند فتح المودال وتوفر الـ ID
    useEffect(() => {
        const fetchStudentData = async () => {
            if (isOpen && studentId) {
                try {
                    setFetching(true);
                    const response = await api.get(`/students/${studentId}`);
                    const student = response.data;

                    setFormData({
                        studentName: student.studentName || '',
                        studentEmail: student.studentEmail || '',
                        studentPhone: student.studentPhone || '',
                        username: student.username || '',
                    });
                    // إعادة ضبط الحالات الأخرى
                    setChangePassword(false);
                    setPasswordData({ password: '', confirmPassword: '' });
                    setErrors({});
                } catch (err) {
                    console.error("Error fetching student:", err);
                    swalService.error("Oops!", "Failed to load student data. Please try again.");
                    onClose();
                } finally {
                    setFetching(false);
                }
            }
        };

        fetchStudentData();
    }, [isOpen, studentId, onClose]);

    const validateBasic = () => {
        let newErrors = {};
        if (!formData.studentName.trim()) newErrors.studentName = "Student Name is required";
        if (formData.studentEmail && !/^\S+@\S+\.\S+$/.test(formData.studentEmail)) {
            newErrors.studentEmail = "Invalid email format";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleUpdateBasicInfo = async (e) => {
        e.preventDefault();
        if (!validateBasic()) return;

        try {
            setLoading(true);
            swalService.showLoading("Updating student profile...");

            await api.put(`/students/${studentId}`, formData);

            await swalService.success("Updated!", "Student information has been saved.");
            if (onUpdate) onUpdate();
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to update student info";
            swalService.error("Error", msg);
        } finally {
            setLoading(false);
        }
    };
    const handleUpdatePassword = async (e) => {
        e.preventDefault();

        if (!passwordData.password || passwordData.password.length < 6) {
            return swalService.error("Short Password", "Password must be at least 6 characters.");
        }
        if (passwordData.password !== passwordData.confirmPassword) {
            return swalService.error("Mismatch", "Passwords do not match.");
        }

        try {
            setLoading(true);
            swalService.showLoading("Resetting password...");

            await api.put(`/students/${studentId}`, {
                password: passwordData.password,
                username: formData.username
            });

            await swalService.success("Success", "Student password changed successfully.");
            setChangePassword(false);
            setPasswordData({ password: '', confirmPassword: '' });
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to change password";
            swalService.error("Update Failed", msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-card" style={{ maxWidth: '500px', width: '90%' }}>
                <div className="modal-head">
                    <h3>Edit Student Profile</h3>
                    <X onClick={onClose} style={{ cursor: 'pointer' }} />
                </div>

                <div className="modal-body" style={{ maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}>

                    {/* عرض مؤشر تحميل أثناء جلب البيانات */}
                    {fetching ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>Loading Student Data...</div>
                    ) : (
                        <>
                            <form onSubmit={handleUpdateBasicInfo}>
                                <div className="form-group">
                                    <label>Student Full Name</label>
                                    <input
                                        className={errors.studentName ? "input-error" : ""}
                                        value={formData.studentName}
                                        onChange={e => setFormData({ ...formData, studentName: e.target.value })}
                                    />
                                    {errors.studentName && <span className="error-msg">{errors.studentName}</span>}
                                </div>

                                <div className="form-row" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Email Address</label>
                                        <input
                                            type="email"
                                            className={errors.studentEmail ? "input-error" : ""}
                                            value={formData.studentEmail}
                                            onChange={e => setFormData({ ...formData, studentEmail: e.target.value })}
                                        />
                                        {errors.studentEmail && <span className="error-msg">{errors.studentEmail}</span>}
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label>Phone Number</label>
                                        <input
                                            value={formData.studentPhone}
                                            onChange={e => setFormData({ ...formData, studentPhone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="btn-submit" disabled={loading} style={{ marginTop: '15px', width: '100%' }}>
                                    {loading ? "Saving..." : "Update Basic Info"}
                                </button>
                            </form>

                            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />

                            {!changePassword ? (
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    style={{ width: '100%', background: 'transparent', color: '#b44d4b', border: '1px dashed #b44d4b', padding: '10px', borderRadius: '5px' }}
                                    onClick={() => setChangePassword(true)}
                                >
                                    <Lock size={16} style={{ marginRight: '8px', display: 'inline' }} /> Change Student Password?
                                </button>
                            ) : (
                                <form onSubmit={handleUpdatePassword} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <strong>Update Password</strong>
                                        <button type="button" onClick={() => setChangePassword(false)} style={{ border: 'none', background: 'none', color: '#b44d4b', cursor: 'pointer' }}>Cancel</button>
                                    </div>
                                    <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label>New Password</label>
                                            <input
                                                type="password"
                                                value={passwordData.password}
                                                onChange={e => setPasswordData({ ...passwordData, password: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group" style={{ flex: 1 }}>
                                            <label>Confirm</label>
                                            <input
                                                type="password"
                                                value={passwordData.confirmPassword}
                                                onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn-submit" style={{ background: '#b44d4b', marginTop: '10px', width: '100%' }} disabled={loading}>
                                        {loading ? "Updating..." : "Confirm New Password"}
                                    </button>
                                </form>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentEditModal;