import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Settings, X, Search, Clock, GraduationCap } from 'lucide-react';
import api from "../../services/api";
import '../styles/ProgramCourses.css'; // التأكد من مسار ملف الـ CSS الجديد

const MyCourses = () => {
    const { role } = useParams();
    const [courses, setCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showSchemaModal, setShowSchemaModal] = useState(false);
    const navigate = useNavigate();

    const [schema, setSchema] = useState({
        midTerm: 0, attendance: 0, lab: 0, practical: 0, bonus: 0
    });

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await api.get("/lecturers/me/courses");
            setCourses(res.data);
        } catch (err) {
            console.error("Error fetching courses", err);
        }
    };

    const handleOpenSchema = (course) => {
        setSelectedCourse(course);
        setSchema({
            midTerm: course.gradingSchema?.midTerm || 0,
            attendance: course.gradingSchema?.attendance || 0,
            lab: course.gradingSchema?.lab || 0,
            practical: course.gradingSchema?.practical || 0,
            bonus: course.gradingSchema?.bonus || 0
        });
        setShowSchemaModal(true);
    };

    const updateSchema = async () => {
        const total = schema.midTerm + schema.attendance + schema.lab + schema.practical;
        if (total !== 50) {
            alert(`Total (excluding bonus) must be exactly 50. Current total: ${total}`);
            return;
        }
        try {
            await api.put(`/lecturers/me/courses/${selectedCourse._id}/schema`, schema);
            alert("Schema updated successfully!");
            setShowSchemaModal(false);
            fetchCourses();
        } catch (err) {
            alert("Error updating schema");
        }
    };

    const filteredCourses = courses.filter(c =>
        c.courseId?._id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // حساب الإحصائيات للكروت
    const stats = {
        active: courses.length,
        enrollment: courses.reduce((a, b) => a + (b.enrolledCount || 0), 0),
        pending: courses.filter(c => c.status === 'proposed').length
    };

    return (
        <div className="management-container">
            <header className="management-header">
                <div className="title-section">
                    <h1>Courses Management</h1>
                </div>
            </header>

            {/* Insights Grid - نفس ستايل الكومبوننت الأول */}
            <div className="insights-grid">
                <div className="insight-card">
                    <div className="insight-header">
                        <span className="insight-icon icon-blue"><BookOpen size={18} /></span>
                        <span className="insight-label">Active Courses</span>
                    </div>
                    <div className="insight-value">{stats.active}</div>
                    <div className="insight-footer">Courses currently assigned</div>
                </div>

                <div className="insight-card">
                    <div className="insight-header">
                        <span className="insight-icon icon-green"><Users size={18} /></span>
                        <span className="insight-label">Total Enrollment</span>
                    </div>
                    <div className="insight-value">{stats.enrollment}</div>
                    <div className="insight-footer">Total students across all courses</div>
                </div>

                <div className="insight-card">
                    <div className="insight-header">
                        <span className="insight-icon icon-orange"><Clock size={18} /></span>
                        <span className="insight-label">Pending Setup</span>
                    </div>
                    <div className="insight-value">{stats.pending}</div>
                    <div className="insight-footer">Courses awaiting configuration</div>
                </div>
            </div>

            {/* Filters Area */}
            <div className="filters-wrapper">
                <Search size={22} color="#9ca3af" />
                <input
                    className="search-input"
                    type="text"
                    placeholder="Search by Course ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table Section */}
            <div className="table-wrapper">
                <table className="management-table">
                    <thead>
                        <tr>
                            <th>Course ID</th>
                            <th>Course Name</th>
                            <th>Semester</th>
                            <th style={{ textAlign: 'center' }}>Enrollment</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCourses.map(course => (
                            <tr key={course._id}>
                                <td className="course-id-cell" style={{ fontWeight: '700' }}>
                                    <Link
                                        to={`/staff/${role}/courses/${course._id}`}
                                        style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}
                                    >
                                        {course.courseId?._id}
                                    </Link>
                                </td>
                                <td  >
                                    {course.courseId?.courseName}
                                </td>
                                <td style={{ textTransform: 'capitalize' }}>
                                    {course.semesterId ? course.semesterId.replace('-', ' ') : 'N/A'}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <span className="type-badge" style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                                        {course.enrolledCount || 0} Students
                                    </span>
                                </td>
                                <td>
                                    <span className={`type-badge ${course.status === 'proposed' ? 'icon-orange' : 'icon-green'}`}
                                        style={{ textTransform: 'capitalize' }}>
                                        {course.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-btns">
                                        <button className="btn-icon btn-edit" title="Settings" onClick={() => handleOpenSchema(course)}>
                                            <Settings size={18} color='#6486ee' />
                                        </button>
                                        <button

                                            onClick={() => navigate(`/staff/${role}/grading/${course._id}/${course.courseId?._id}`)}
                                        >
                                            <Users size={18} color='#62b986' />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Grading Schema Modal - متوافق مع .modal-overlay و .modal-card */}
            {showSchemaModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <div className="modal-head">
                            <h3>Grading Schema</h3>
                            <button className="close-x-btn" onClick={() => setShowSchemaModal(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px' }}>
                                Total distribution must equal <b>50 marks</b> (excluding bonus).
                            </p>

                            {['midTerm', 'attendance', 'lab', 'practical', 'bonus'].map(key => (
                                <div key={key} className="form-group">
                                    <label className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                                    <input
                                        type="number"
                                        value={schema[key]}
                                        onChange={(e) => setSchema({ ...schema, [key]: Number(e.target.value) })}
                                        placeholder={`Enter ${key} marks`}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowSchemaModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-1" onClick={updateSchema} style={{ marginTop: 0 }}>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyCourses;