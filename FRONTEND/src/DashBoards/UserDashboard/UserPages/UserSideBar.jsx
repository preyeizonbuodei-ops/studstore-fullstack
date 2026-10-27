import { useAuthStore } from "../../../Store/AuthStore";
import {
    File,
    GraduationCap,
    Home,
    LogOutIcon,
    Settings,
    User,
    Book,
    Menu,
    X,
    Boxes,
    MessagesSquare,
} from "lucide-react";
import {
    NavLink,
    useLocation,
    useNavigate,
} from "react-router-dom";

const UserSideBar = ({ isOpen, setIsOpen }) => {
    const Logout = useAuthStore((state) => state.Logout);
    const navigate = useNavigate();
    const location = useLocation();

    const isCoursesActive =
        location.pathname === "/me/courses" ||
        location.pathname.startsWith("/courses/") ||
        location.pathname.startsWith("/lessons/");

    const handleNavigation = () => {
        setIsOpen(false);
    };

    const linkClass = ({ isActive }) =>
        `flex items-center gap-3 rounded px-3 py-3 transition duration-300 ${
            isActive
                ? "bg-white text-black"
                : "hover:bg-white hover:text-black"
        }`;

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                aria-label="Open navigation menu"
                className="fixed left-4 top-4 z-40 rounded-lg bg-blue-950 p-3 text-white shadow-lg lg:hidden"
            >
                <Menu size={24} />
            </button>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 z-50 h-screen w-[250px] overflow-y-auto bg-blue-950 text-white transition-transform duration-300 lg:sticky lg:z-auto lg:block lg:w-auto lg:translate-x-0 ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Header */}
                <div className="mb-3 flex items-center justify-between gap-3 p-3 shadow-[0_2px_12px_rgba(0,0,0,0.20)]">
                    <div className="flex items-center gap-3">
                        <GraduationCap className="size-10 text-blue-500" />

                        <div>
                            <h1 className="font-semibold">
                                E-Learning
                            </h1>

                            <p className="text-sm text-gray-300">
                                Student
                            </p>
                        </div>
                    </div>

                    {/* Mobile Close Button */}
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        aria-label="Close navigation menu"
                        className="rounded-lg p-2 hover:bg-white/10 lg:hidden"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="flex flex-col gap-2 px-3">
                    {/* Home Page */}
                    <NavLink
                        to="/"
                        end
                        onClick={handleNavigation}
                        className={linkClass}
                    >
                        <Home size={20} />
                        <span>Home page</span>
                    </NavLink>

                    {/* Dashboard */}
                    <NavLink
                        to="/me"
                        end
                        onClick={handleNavigation}
                        className={linkClass}
                    >
                        <Boxes size={20} />
                        <span>Dashboard</span>
                    </NavLink>

                    {/* My Courses */}
                    <NavLink
                        to="/me/courses"
                        onClick={handleNavigation}
                        className={() =>
                            `flex items-center gap-3 rounded px-3 py-3 transition duration-300 ${
                                isCoursesActive
                                    ? "bg-white text-black"
                                    : "hover:bg-white hover:text-black"
                            }`
                        }
                    >
                        <Book size={20} />
                        <span>My Courses</span>
                    </NavLink>

                    {/* Learning Materials */}
                    <NavLink
                        to="/me/learning-materials"
                        onClick={handleNavigation}
                        className={linkClass}
                    >
                        <File size={20} />
                        <span>Learning Materials</span>
                    </NavLink>

                    {/* Profile */}
                    <NavLink
                        to="/me/profile"
                        onClick={handleNavigation}
                        className={linkClass}
                    >
                        <User size={20} />
                        <span>Profile</span>
                    </NavLink>

                    {/* Student Voices */}
                    <NavLink
                        to="/me/student-voices"
                        onClick={handleNavigation}
                        className={linkClass}
                    >
                        <MessagesSquare size={20} />
                        <span>Student Voices</span>
                    </NavLink>

                    {/* Settings */}
                    <NavLink
                        to="/me/setting"
                        onClick={handleNavigation}
                        className={linkClass}
                    >
                        <Settings size={20} />
                        <span>Settings</span>
                    </NavLink>

                    {/* Logout */}
                    <button
                        type="button"
                        className="flex items-center gap-3 rounded px-3 py-3 transition duration-300 hover:bg-white hover:text-black"
                        onClick={async () => {
                            try {
                                await Logout();
                            } finally {
                                setIsOpen(false);
                                navigate("/login");
                            }
                        }}
                    >
                        <LogOutIcon size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default UserSideBar;