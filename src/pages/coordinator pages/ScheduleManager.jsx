import React, { useState, useEffect } from 'react';
import api from "../../services/api";
import swalService from "../../services/swal";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
    Trash2, Settings, X, RefreshCw, Layers, User, Hash, Menu, Download, Megaphone
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './ScheduleManager.css';

const ScheduleManager = () => {
    const [offerings, setOfferings] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [config, setConfig] = useState({
        startTime: "09:00",
        duration: 45,
        count: 12
    });

    const daysOfWeek = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/schedule');
            setOfferings(res.data.courseOfferings || []);
            setPeriods(res.data.schedule[0]?.periodsTime || []);
        } catch (err) {
            console.error("❌ Data fetch error:", err);
            swalService.error("Fetch Error", "Could not load schedule data.");
        } finally {
            setLoading(false);
        }
    };

    const generatePeriods = async () => {
        swalService.showLoading("Updating Grid...");
        let currentStart = config.startTime;
        const newPeriods = [];
        for (let i = 0; i < config.count; i++) {
            const [hours, minutes] = currentStart.split(':').map(Number);
            const startDate = new Date();
            startDate.setHours(hours, minutes, 0);
            const endDate = new Date(startDate.getTime() + config.duration * 60000);
            const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
            newPeriods.push({ startTime: currentStart, endTime });
            currentStart = endTime;
        }
        try {
            await api.post('/schedule/set/time', { periodsTime: newPeriods });
            await fetchData();
            swalService.success("Success", "Periods updated successfully");
            setIsModalOpen(false);
        } catch (err) {
            swalService.error("Update Failed", "Failed to update periods configuration");
        }
    };

    const toggleLecLength = async (offering) => {
        const currentLen = offering.schedule?.lecLength || 2;
        const newLen = currentLen === 1 ? 2 : 1;
        swalService.showLoading("Changing length...");
        try {
            await api.post(`/schedule/${offering._id}`, {
                days: offering.schedule.days,
                lecLength: newLen,
                lecPeriod: offering.schedule.lecPeriod
            });
            await fetchData();
            swalService.close();
        } catch (err) {
            handleScheduleError(err);
        }
    };

    const onDragEnd = (result) => {
        const { destination, draggableId } = result;
        if (!destination) return;

        if (destination.droppableId === 'delete-area') {
            confirmDeletion(draggableId);
            return;
        }

        if (destination.droppableId.includes('-')) {
            const [day, sessionIdxStr] = destination.droppableId.split('-');
            const sessionIndex = parseInt(sessionIdxStr);
            const actualLecPeriod = (sessionIndex - 1) * 2 + 1;
            handleAssignSchedule(draggableId, day, actualLecPeriod);
        }
    };

    const handleAssignSchedule = async (offeringId, day, period) => {
        const course = offerings.find(o => o._id === offeringId);
        const lecLength = course?.schedule?.lecLength || 2;
        swalService.showLoading("Assigning Course...");
        try {
            await api.post(`/schedule/${offeringId}`, {
                days: [day],
                lecLength: lecLength,
                lecPeriod: period
            });
            await fetchData();
            swalService.success("Assigned", `${course?.courseId?.courseName} has been scheduled.`);
        } catch (err) {
            handleScheduleError(err);
        }
    };

    const handleScheduleError = (err) => {
        const errorData = err.response?.data;
        if (errorData?.conflictCourses) {
            // إنشاء جدول HTML لعرض التعارضات بشكل محترم
            const conflictRows = errorData.conflictCourses.map(c =>
                `<tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${c.courseName}</td>
                    <td style="border: 1px solid #ddd; padding: 8px;">
                        ${c.conflictStudents.map(s => s.studentId.studentName).join(', ')}
                    </td>
                </tr>`
            ).join('');

            const tableHtml = `
                <div style="max-height: 300px; overflow-y: auto; margin-top: 10px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9em; text-align: left;">
                        <thead>
                            <tr style="background: #f3f4f6;">
                                <th style="border: 1px solid #ddd; padding: 8px;">Conflicting Course</th>
                                <th style="border: 1px solid #ddd; padding: 8px;">Students</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${conflictRows}
                        </tbody>
                    </table>
                </div>
            `;
            swalService.error("Schedule Conflict", tableHtml);
        } else {
            swalService.error("Error", errorData?.message || "Something went wrong");
        }
    };

    const confirmDeletion = async (offeringId) => {
        const result = await swalService.confirm("Remove Schedule?", "This will unassign the course from the current slot.");
        if (result.isConfirmed) {
            handleDeleteSchedule(offeringId);
        }
    };

    const handleDeleteSchedule = async (offeringId) => {
        swalService.showLoading("Removing...");
        try {
            await api.delete(`/schedule/${offeringId}`);
            await fetchData();
            swalService.success("Removed", "Course unassigned successfully");
        } catch (err) {
            swalService.error("Delete Failed", "Could not remove the schedule");
        }
    };

    const handleAnnounceSchedule = async () => {
        const result = await swalService.confirm(
            "Announce Schedule?",
            "This will notify all students and instructors that the schedule is final.",
            "Yes, Announce!"
        );

        if (result.isConfirmed) {
            swalService.showLoading("Announcing...");
            try {
                await api.post('/schedule/announce');
                swalService.success("Announced!", "The schedule has been published successfully.");
            } catch (err) {
                swalService.error("Failed", err.response?.data?.message || "Failed to announce schedule");
            }
        }
    };

    const exportToPDF = async () => {
        const tableElement = document.querySelector('.sc-table-wrapper');
        if (!tableElement) return;

        swalService.showLoading("Generating PDF...");
        try {
            const originalStyle = tableElement.style.cssText;
            tableElement.style.overflow = 'visible';
            tableElement.style.height = 'auto';
            tableElement.style.width = tableElement.scrollWidth + 'px';

            const canvas = await html2canvas(tableElement, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
                scrollY: -window.scrollY
            });

            tableElement.style.cssText = originalStyle;
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData);
            const ratio = Math.min((pdfWidth - 20) / imgProps.width, (pdfHeight - 20) / imgProps.height);
            const width = imgProps.width * ratio;
            const height = imgProps.height * ratio;

            pdf.addImage(imgData, 'PNG', (pdfWidth - width) / 2, 10, width, height);
            pdf.save("Academic_Schedule_2026.pdf");
            swalService.close();
        } catch (error) {
            swalService.error("Export Error", "Failed to generate PDF document");
        }
    };

    const renderCourseCard = (offering, isInsideGrid = false) => (
        <div className={`uniform-card-s ${isInsideGrid ? 'grid-version' : ''}`} title={offering.courseId?.courseName}>
            {isInsideGrid && (
                <button className="len-btn" onClick={(e) => {
                    e.stopPropagation();
                    toggleLecLength(offering);
                }}>
                    <Layers size={10} /> {offering.schedule?.lecLength}P
                </button>
            )}
            <div className="course-header-row">
                <p className="course-name-text-s">
                    {offering.courseId?.courseName || "Unknown"}
                </p>
            </div>
            <div className="course-details-wrapper">
                <div className="detail-item-s">
                    <Hash size={12} />
                    <span>{offering.courseId?._id || "N/A"}</span>
                </div>
                <div className="detail-item-s">
                    <User size={12} />
                    <span>{offering.instructorId?.staffName || "No Instructor"}</span>
                </div>
            </div>
        </div>
    );

    if (loading) return <div className="loader">Initializing Portal...</div>;

    return (
        <div className="management-container schedule-container ">
            <DragDropContext onDragEnd={onDragEnd}>

                {/* Main Schedule Grid (Left Side) */}
                <main className="schedule-main">
                    <header className="management-header">
                        <div className="prereg-header">
                            <h2>Academic Schedule</h2>
                        </div>
                        <div className="header-actions">
                            <button className="btn-2" onClick={handleAnnounceSchedule}>
                                <Megaphone size={18} /> Announce
                            </button>
                            <button className="btn-2" onClick={exportToPDF}>
                                <Download size={18} /> Export PDF
                            </button>
                            <button className="btn-1" onClick={() => setIsModalOpen(true)}>
                                <Settings size={18} /> Manage Periods
                            </button>
                            {!isSidebarOpen && (
                                <button className="btn-1" onClick={() => setIsSidebarOpen(true)}>
                                    <Menu size={18} /> Show Catalog
                                </button>
                            )}
                        </div>
                    </header>
                    <div className="sc-table-wrapper" id="printable-schedule">
                        <table className="schedule-table">
                            <thead>
                                <tr>
                                    {/* الـ z-index هنا أعلى لضمان ظهوره فوق الكولمن والرو عند التقاطع */}
                                    <th className="sticky-row sticky-col corner-header">Days</th>
                                    {[...Array(6)].map((_, i) => {
                                        const pIdx = i * 2;
                                        const p = periods[pIdx];
                                        return (
                                            <th key={i} className="sticky-row period-header">
                                                <div className="period-label">Session {i + 1}</div>
                                                <div className="time-range">
                                                    {p ? `${p.startTime} - ${periods[pIdx + 1]?.endTime || p.endTime}` : '--:--'}
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {daysOfWeek.map(day => (
                                    <tr key={day}>
                                        <td className="day-name sticky-col">{day}</td>
                                        {[...Array(6)].map((_, i) => {
                                            const sessionNum = i + 1;
                                            const currentLecStart = (i * 2) + 1;
                                            return (
                                                <Droppable key={`${day}-${sessionNum}`} droppableId={`${day}-${sessionNum}`}>
                                                    {(provided, snapshot) => {
                                                        const assignedCourses = offerings.filter(o =>
                                                            o.schedule?.days?.includes(day) &&
                                                            Number(o.schedule.lecPeriod) === currentLecStart
                                                        );

                                                        return (
                                                            <td ref={provided.innerRef} {...provided.droppableProps}
                                                                className={`slot ${snapshot.isDraggingOver ? 'drop-hover' : ''}`}>
                                                                <div className="courses-stack">
                                                                    {assignedCourses.map((course, idx) => (
                                                                        <Draggable key={course._id} draggableId={course._id} index={idx}>
                                                                            {(provided) => (
                                                                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                                                    {renderCourseCard(course, true)}
                                                                                </div>
                                                                            )}
                                                                        </Draggable>
                                                                    ))}
                                                                </div>
                                                                {provided.placeholder}
                                                            </td>
                                                        );
                                                    }}
                                                </Droppable>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </main>

                {/* Sidebar (Right Side) */}
                <aside className={`schedule-sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>
                    <div className="s_sidebar-header">
                        <div className="head">
                            <div className="header-top">
                                <h3>Catalog</h3>
                                <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <p className='available-text'>{offerings.filter(o => !o.schedule?.days?.length).length} available courses</p>
                        </div>
                    </div>

                    <Droppable droppableId="sidebar">
                        {(provided) => (
                            <div ref={provided.innerRef} {...provided.droppableProps} className="course-list">
                                {offerings
                                    .filter(o => !o.schedule?.days?.length)
                                    .map((offering, index) => (
                                        <Draggable key={offering._id} draggableId={offering._id} index={index}>
                                            {(provided) => (
                                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                    {renderCourseCard(offering)}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>

                    <Droppable droppableId="delete-area">
                        {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.droppableProps}
                                className={`delete-zone ${snapshot.isDraggingOver ? 'active' : ''}`}>
                                <Trash2 size={20} />
                                <span>Drop to Remove</span>
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </aside>

            </DragDropContext>

            {/* Settings Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Grid Settings</h2>
                            <button className="close-sidebar-btn" onClick={() => setIsModalOpen(false)}><X /></button>
                        </div>
                        <div className="modal-body">
                            <div className="config-grid">
                                <div className="input-group">
                                    <label>Start Time</label>
                                    <input type="time" value={config.startTime} onChange={e => setConfig({ ...config, startTime: e.target.value })} />
                                </div>
                                <div className="input-group">
                                    <label>Duration (Min)</label>
                                    <input type="number" value={config.duration} onChange={e => setConfig({ ...config, duration: parseInt(e.target.value) })} />
                                </div>
                                <button className="bulk-update-btn" onClick={generatePeriods}>
                                    <RefreshCw size={16} /> Update Grid
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduleManager;