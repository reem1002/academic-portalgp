import React, { useState, useEffect } from 'react';
import api from "../../services/api";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
    Trash2, Settings, X, RefreshCw, Layers, User, Hash, ChevronRight, Menu, ChevronLeft
} from 'lucide-react';
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
        } finally {
            setLoading(false);
        }
    };

    const generatePeriods = async () => {
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
            fetchData();
            setIsModalOpen(false);
        } catch (err) {
            alert("Failed to update periods");
        }
    };

    const toggleLecLength = async (offering) => {
        const currentLen = offering.schedule?.lecLength || 2;
        const newLen = currentLen === 1 ? 2 : 1;
        try {
            await api.post(`/schedule/${offering._id}`, {
                days: offering.schedule.days,
                lecLength: newLen,
                lecPeriod: offering.schedule.lecPeriod
            });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || "Error changing length");
        }
    };

    const onDragEnd = (result) => {
        const { destination, draggableId } = result;
        if (!destination) return;

        if (destination.droppableId === 'delete-area') {
            handleDeleteSchedule(draggableId);
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
        try {
            await api.post(`/schedule/${offeringId}`, {
                days: [day],
                lecLength: lecLength,
                lecPeriod: period
            });
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || "Conflict or Server Error");
        }
    };

    const handleDeleteSchedule = async (offeringId) => {
        try {
            await api.delete(`/schedule/${offeringId}`);
            fetchData();
        } catch (err) {
            console.error("❌ Delete failed:", err);
        }
    };

    const renderCourseCard = (offering, isInsideGrid = false) => (
        <div className={`uniform-card-s ${isInsideGrid ? 'grid-version' : ''}`} title={offering.courseId?.courseName}>
            <div className="course-header-row">
                <p className="course-name-text-s">
                    {offering.courseId?.courseName || "Unknown"}
                </p>
            </div>

            <div className="course-details-wrapper">
                <div className="detail-item-s">
                    <Hash size={12} />
                    <span>{offering.courseId?._id || "N/A"}</span>
                    {isInsideGrid && (
                        <button className="len-btn" onClick={(e) => {
                            e.stopPropagation();
                            toggleLecLength(offering);
                        }}>
                            <Layers size={10} /> {offering.schedule?.lecLength}P
                        </button>
                    )}
                </div>
                <div className="detail-item-s">
                    <User size={12} />
                    <span>{offering.instructorId?.name || "No Instructor"}</span>
                </div>
            </div>
            {/* {!isInsideGrid && <ChevronRight size={14} className="arrow-icon" />} */}
        </div>
    );

    if (loading) return <div className="loader">Initializing Portal...</div>;

    return (
        <div className="schedule-container">
            <DragDropContext onDragEnd={onDragEnd}>

                {/* Main Schedule Grid (Left Side) */}
                <main className="schedule-main">
                    <header className="management-header">
                        <div className="title-section">
                            <h2>Academic Schedual</h2>
                        </div>
                        <div className="header-actions">
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

                    <div className="sc-table-wrapper">
                        <table className="schedule-table">
                            <thead>
                                <tr>
                                    <th className="sticky-col">Days</th>
                                    {[...Array(6)].map((_, i) => {
                                        const pIdx = i * 2;
                                        const p = periods[pIdx];
                                        return (
                                            <th key={i} className="period-header">
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
                    <div className="sidebar-header">
                        <div className="header-top">

                            <h3>Catalog</h3>

                        </div>
                        <p>{offerings.filter(o => !o.schedule?.days?.length).length} available courses</p>
                        <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>
                            <X size={20} />
                        </button>
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