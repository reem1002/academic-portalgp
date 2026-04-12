import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import swalService from "../services/swal";
// import '../styles/Modals.css';

const EditGradeModal = ({ isOpen, onClose, onSave, courseData }) => {
    // الستيت المحلية للدرجة
    const [grade, setGrade] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // تحديث الستيت لما الـ courseData تتغير (لما نفتح المودال لمادة جديدة)
    useEffect(() => {
        if (courseData) {
            setGrade(courseData.grade || '');
            setError(''); // رسالة الخطأ القديمة
        }
    }, [courseData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // التحقق من الدرجة
        const gradeNum = parseFloat(grade);
        if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
            setError('Please enter a valid grade between 0 and 100.');
            return;
        }

        setLoading(true);
        try {
            // نبعت الدرجة الجديدة للأب (StudentDetails) عشان ينفذ الـ API
            await onSave(courseData.courseId._id, gradeNum);
            onClose(); // نقفل المودال بعد النجاح
        } catch (err) {
            setError(err.message || 'Failed to update grade. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !courseData) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content small-modal" onClick={(e) => e.stopPropagation()}>
                <header className="modal-header">
                    <h3>Update Grade</h3>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </header>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="course-info-display">
                            <p className="label">Course Name</p>
                            <p className="value">{courseData.courseId?.courseName}</p>
                            <p className="sub-value">{courseData.courseId?._id}</p>
                        </div>

                        <div className="form-group">
                            <label htmlFor="grade">Grade (0 - 100)</label>
                            <input
                                type="number"
                                id="grade"
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                                placeholder="e.g. 85.5"
                                step="0.1"
                                min="0"
                                max="100"
                                required
                                autoFocus
                            />
                        </div>

                        {error && <p className="error-message-inline">{error}</p>}
                    </div>

                    <footer className="modal-footer">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? (
                                <span className="spinner-border spinner-border-sm"></span>
                            ) : (
                                <><Save size={16} /> Save Changes</>
                            )}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default EditGradeModal;