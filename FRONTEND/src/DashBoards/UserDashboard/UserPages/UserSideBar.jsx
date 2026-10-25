import { useAuthStore } from "../../../Store/AuthStore";
import {
    File,
    GraduationCap,
    Home,
    LogOutIcon,
    Settings,
    User,
    Book,
    House,
    ChartBarIncreasing,
    Menu,
    X,
    Boxes
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

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

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed left-4 top-4 z-40 rounded-lg bg-blue-950 p-3 text-white shadow-lg lg:hidden"
            >
                <Menu size={24} />
            </button>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
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
                        onClick={() => setIsOpen(false)}
                        className="rounded-lg p-2 hover:bg-white/10 lg:hidden"
                    >
                        <X size={22} />
                    </button>

                </div>

                <div className="flex flex-col gap-2 px-3">

                    {/* Dashboard */}
                    <NavLink
                        to="/"
                        end
                        onClick={handleNavigation}
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded py-3 px-3 transition duration-500 ${
                                isActive
                                    ? "bg-white text-black"
                                    : "hover:bg-white hover:text-black"
                            }`
                        }
                    >
                        <Home />
                        <h1>Home page</h1>
                    </NavLink>


                    <NavLink
                        to="/me"
                        end
                        onClick={handleNavigation}
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded py-3 px-3 transition duration-500 ${
                                isActive
                                    ? "bg-white text-black"
                                    : "hover:bg-white hover:text-black"
                            }`
                        }
                    >
                        <Boxes />
                        <h1>Dashboard</h1>
                    </NavLink>

                    {/* My Courses */}
                    <NavLink
                        to="/me/courses"
                        onClick={handleNavigation}
                        className={() =>
                            `flex items-center gap-3 rounded py-3 px-3 transition duration-500 ${
                                isCoursesActive
                                    ? "bg-white text-black"
                                    : "hover:bg-white hover:text-black"
                            }`
                        }
                    >
                        <Book />
                        <h1>My Courses</h1>
                    </NavLink>

                    {/* Learning Materials */}
                    <NavLink
                        to="/me/learning-materials"
                        onClick={handleNavigation}
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded py-3 px-3 transition duration-500 ${
                                isActive
                                    ? "bg-white text-black"
                                    : "hover:bg-white hover:text-black"
                            }`
                        }
                    >
                        <File />
                        <h1>Learning Materials</h1>
                    </NavLink>

                    {/* Department */}


                    {/* Resources */}
                    

                    {/* Profile */}
                    <NavLink
                        to="/me/profile"
                        onClick={handleNavigation}
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded py-3 px-3 transition duration-500 ${
                                isActive
                                    ? "bg-white text-black"
                                    : "hover:bg-white hover:text-black"
                            }`
                        }
                    >
                        <User />
                        <h1>Profile</h1>
                    </NavLink>

                    {/* Settings */}
                    <NavLink
                        to="/me/setting"
                        onClick={handleNavigation}
                        className={({ isActive }) =>
                            `flex items-center gap-3 rounded py-3 px-3 transition duration-500 ${
                                isActive
                                    ? "bg-white text-black"
                                    : "hover:bg-white hover:text-black"
                            }`
                        }
                    >
                        <Settings />
                        <h1>Setting</h1>
                    </NavLink>

                    {/* Logout */}
                    <button
                        className="flex gap-2 rounded py-3 px-3 hover:bg-white hover:text-black"
                        onClick={async () => {
                            await Logout();
                            setIsOpen(false);
                            navigate("/login");
                        }}
                    >
                        <LogOutIcon />
                        Logout
                    </button>

                </div>
            </aside>
        </>
    );
};

export default UserSideBar;