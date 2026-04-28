// src/config/menuConfig.js
import {
    LayoutDashboard,
    BookOpen,
    Users,
    Award,
    GraduationCap,
    Settings,
    History,
    UserCheck,
    Library,
    Briefcase,
    FileSpreadsheet,
    Megaphone,
    ClipboardCheck,
    ScrollText,
    BookMarked,
    ShieldCheck,
    UserCog,
    Calendar,
    CalendarDays, // أيقونة للجدول
    BellRing,     // أيقونة للإعلانات
    MessagesSquare // أيقونة للمقابلات
} from "lucide-react";

const iconSize = 20;

export const menuConfig = {
    student: [
        {
            name: "Dashboard",
            path: "/student/dashboard",
            icon: <LayoutDashboard size={iconSize} />
        },
        {
            name: "Pre-Registration",
            path: "/student/registration",
            icon: <FileSpreadsheet size={iconSize} />
        },
        {
            name: "My Transcript",
            path: "/student/transcript",
            icon: <ScrollText size={iconSize} />
        },
        {
            name: "Meet Advisor",
            path: "/student/meetings",
            icon: <MessagesSquare size={iconSize} /> // تم التغيير لتمييز المقابلات
        },
        {
            name: "Schedule",
            path: "/student/St-Schedule",
            icon: <CalendarDays size={iconSize} /> // تم التغيير لتمييز الجدول الدراسي
        },
    ],

    coordinator: [
        {
            name: "Dashboard",
            path: "/staff/coordinator/dashboard",
            icon: <LayoutDashboard size={iconSize} />
        },
        {
            name: "Pre-Registration",
            path: "/staff/coordinator/registration",
            icon: <ClipboardCheck size={iconSize} />
        },
        {
            name: "Students Management",
            path: "/staff/coordinator/students",
            icon: <Users size={iconSize} />
        },
        {
            name: "Courses Management",
            path: "/staff/coordinator/program-courses",
            icon: <Library size={iconSize} />
        },
        {
            name: "Staff Management",
            path: "/staff/coordinator/ece-staff",
            icon: <Briefcase size={iconSize} />
        },
        {
            name: "Advising Management",
            path: "/staff/coordinator/Advising-management",
            icon: <UserCheck size={iconSize} />
        },
        {
            name: "Anouncements",
            path: "/staff/coordinator/Anouncements",
            icon: <BellRing size={iconSize} /> // تم التغيير لتمييز الإعلانات
        },
        {
            name: "Schedule",
            path: "/staff/coordinator/ScheduleManager",
            icon: <CalendarDays size={iconSize} />
        },
        {
            name: "Semesters History",
            path: "/staff/coordinator/semester-history",
            icon: <History size={iconSize} />
        },
    ],

    lecturer: [
        {
            name: "Dashboard",
            path: "/staff/lecturer/dashboard",
            icon: <LayoutDashboard size={iconSize} />
        },
        {
            name: "My Courses",
            path: "/staff/lecturer/lec-courses",
            icon: <BookMarked size={iconSize} />
        },
        {
            name: "Schedule",
            path: "/staff/lecturer/lec-Schedule",
            icon: <CalendarDays size={iconSize} />
        },

    ],

    "academic-advisor": [
        {
            name: "Dashboard",
            path: "/staff/academic-advisor/dashboard",
            icon: <LayoutDashboard size={iconSize} />
        },
        {
            name: "My Students",
            path: "/staff/academic-advisor/advise-students",
            icon: <GraduationCap size={iconSize} />
        },
        {
            name: "Anouncements",
            path: "/staff/academic-advisor/advising-anouncements",
            icon: <Megaphone size={iconSize} />
        },
        {
            name: "Meetings",
            path: "/staff/academic-advisor/ad-meetings",
            icon: <Calendar size={iconSize} />
        }
    ],

    ta: [
        {
            name: "Dashboard",
            path: "/staff/ta/dashboard",
            icon: <LayoutDashboard size={iconSize} />
        },
        {
            name: "Assist Courses",
            path: "/staff/ta/ta-courses",
            icon: <BookOpen size={iconSize} />
        },
        {
            name: "Schedule",
            path: "/staff/ta/ta-Schedule",
            icon: <CalendarDays size={iconSize} />
        }, ,
        {
            name: "Anouncements",
            path: "/staff/ta/TA-anouncements",
            icon: <Megaphone size={iconSize} />
        }
    ],

    admin: [
        {
            name: "Dashboard",
            path: "/staff/admin/dashboard",
            icon: <ShieldCheck size={iconSize} />
        },
        {
            name: "User Management",
            path: "/staff/admin/users",
            icon: <UserCog size={iconSize} />
        },
        {
            name: "System Settings",
            path: "/staff/admin/settings",
            icon: <Settings size={iconSize} />
        }
    ]
};