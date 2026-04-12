import React, { useState } from "react";
import { Edit2, X } from "lucide-react";
import api from "../services/api";
import swalService from "../services/swal";
import "./styles/SemesterTimeline.css";

const SemesterTimeline = ({ startDate, endDate, timeLine, semesterId, onUpdate }) => {
    // حالة المودال (مخفي/ظاهر) والبيانات اللي جواه
    const [editModal, setEditModal] = useState({
        show: false,
        type: "",
        dates: { start: "", end: "" }
    });

    const today = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    // حساب شريط التقدم
    const totalDuration = end - start;
    const progress = Math.min(Math.max((today - start) / totalDuration, 0), 1);

    const format = (dateStr) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short'
        });
    };

    const isActive = (startStr, endStr) => {
        if (!startStr || !endStr) return false;
        const s = new Date(startStr);
        const e = new Date(endStr);
        return today >= s && today <= e;
    };

    // فتح مودال التعديل وتجهيز التواريخ بصيغة YYYY-MM-DD للـ input
    const openEdit = (type, dates) => {
        setEditModal({
            show: true,
            type,
            dates: {
                start: dates?.start ? new Date(dates.start).toISOString().split('T')[0] : "",
                end: dates?.end ? new Date(dates.end).toISOString().split('T')[0] : ""
            }
        });
    };



    const handleUpdate = async (e) => {
        e.preventDefault();

        // 1. التحقق من المنطق (مثلاً: تاريخ النهاية ميكونش قبل البداية)
        if (new Date(editModal.dates.start) > new Date(editModal.dates.end)) {
            return swalService.error("Invalid Dates", "End date cannot be earlier than start date.");
        }

        try {
            // 2. إظهار لودينج
            swalService.showLoading("Updating timeline...");

            const payload = {
                start: new Date(editModal.dates.start).toISOString(),
                end: new Date(editModal.dates.end).toISOString()
            };

            await api.put(`/semesters/${semesterId}/${editModal.type}`, payload);

            // 3. رسالة نجاح سريعة
            await swalService.success("Timeline Updated", `The ${editModal.type} period has been updated.`);

            setEditModal({ ...editModal, show: false });
            if (onUpdate) onUpdate();
        } catch (err) {
            console.error("Update Error:", err);
            const errorMessage = err.response?.data?.message || "Something went wrong while updating the dates.";
            swalService.error("Update Failed", errorMessage);
        }
    };

    const academicEvents = [
        { name: "Pre-Registration", key: "preRegistration", dates: timeLine?.preRegistration },
        { name: "Add / Drop", key: "addDrop", dates: timeLine?.addDrop },
        { name: "Final Exams", key: "finalExams", dates: timeLine?.finalExams }
    ];

    return (
        <div className="timeline-wrapper">
            <h3>Semester Timeline</h3>
            <div className="timeline-container">
                <div className="timeline-line">
                    <div className="timeline-progress" style={{ width: `${progress * 100}%` }}></div>
                </div>

                <div className="timeline-events">
                    <div className="timeline-point start">
                        <span></span>
                        <p>Semester Start</p>
                        <small>{format(startDate)}</small>
                    </div>

                    {academicEvents.map((event, i) => (
                        <div key={i} className={`timeline-point ${isActive(event.dates?.start, event.dates?.end) ? "active" : ""}`}>
                            {/* أيقونة القلم للتعديل */}
                            <button className="edit-timeline-btn" onClick={() => openEdit(event.key, event.dates)}>
                                <Edit2 size={12} />
                            </button>
                            <span></span>
                            <h4>{event.name}</h4>
                            <p>{format(event.dates?.start)} — {format(event.dates?.end)}</p>
                        </div>
                    ))}

                    <div className="timeline-point end">
                        <span></span>
                        <p>Semester End</p>
                        <small>{format(endDate)}</small>
                    </div>
                </div>
            </div>

            {/* مودال التعديل الداخلي */}
            {editModal.show && (
                <div className="modal-overlay" style={{ zIndex: 2000 }}>
                    <div className="modal-container" style={{ width: '400px' }}>
                        <div className="modal-header">
                            <h4 style={{ textTransform: 'capitalize' }}>
                                Edit {editModal.type.replace(/([A-Z])/g, ' $1')}
                            </h4>
                            <button className="close-btn" onClick={() => setEditModal({ ...editModal, show: false })}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="semester-form">
                            <div className="form-group">
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    value={editModal.dates.start}
                                    onChange={(e) => setEditModal({ ...editModal, dates: { ...editModal.dates, start: e.target.value } })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>End Date</label>
                                <input
                                    type="date"
                                    value={editModal.dates.end}
                                    onChange={(e) => setEditModal({ ...editModal, dates: { ...editModal.dates, end: e.target.value } })}
                                    required
                                />
                            </div>
                            <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button type="button" className="cancel-btn" onClick={() => setEditModal({ ...editModal, show: false })}>
                                    Cancel
                                </button>
                                <button type="submit" className="create-btn">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SemesterTimeline;