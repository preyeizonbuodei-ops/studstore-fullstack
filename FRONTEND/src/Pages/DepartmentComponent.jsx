import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Settings } from "lucide-react";

import Engineering from "../Image/lab3.jpg";
import { useUserDepartmentStore } from "../DashBoards/UserDashboard/DepartmentStore/UserDepartmentStore";


const DepartmentComponent = () => {
    const navigate = useNavigate();

    const {
        departments,
        isLoading,
        error,
        getDepartments,
    } = useUserDepartmentStore();

    useEffect(() => {
        getDepartments().catch(() => {});
    }, [getDepartments]);

    return (
        <div>

            {/* Departments from the backend */}
            <section
                id="departments-list"
                className="bg-gray-50 px-6 py-16 md:px-16"
            >
                <div className="mx-auto max-w-7xl">
                    <div className="mb-10 text-center">
                        <h2 className="text-3xl font-bold text-blue-950 md:text-4xl">
                            Our Engineering Departments
                        </h2>

                        <p className="mt-3 text-gray-600">
                            Discover our departments and explore their
                            major areas of study.
                        </p>
                    </div>

                    {isLoading && (
                        <p className="py-10 text-center text-gray-600">
                            Loading departments...
                        </p>
                    )}

                    
                    {!isLoading && error && (
                        <div className="flex justify-center py-10">
                            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                                    <Settings size={28} className="text-amber-600" />
                                </div>

                                <h3 className="mt-4 text-xl font-bold text-blue-950">
                                    Oops! Something went wrong
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-gray-600">
                                    We couldn't load the departments right now.
                                    Please try again in a moment.
                                </p>

                                <button
                                    onClick={() => getDepartments().catch(() => {})}
                                    className="mt-5 rounded-lg bg-blue-950 px-6 py-2.5 font-medium text-white transition hover:bg-blue-900"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}

                    {!isLoading && !error && departments.length === 0 && (
                        <p className="py-10 text-center text-gray-600">
                            No departments are available yet.
                        </p>
                    )}

                    {!isLoading && !error && departments.length > 0 && (
                        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
                            {departments.map((department) => (
                                <motion.article
                                    key={department._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.2 }}
                                    transition={{ duration: 0.4 }}
                                    className="overflow-hidden rounded-xl bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                                >
                                    <img
                                        src={
                                            department.image || Engineering
                                        }
                                        alt={department.name}
                                        className="h-52 w-full object-cover"
                                    />

                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-blue-950">
                                            {department.name}
                                        </h3>

                                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
                                            {department.description}
                                        </p>

                                        <button
                                            onClick={() =>
                                                navigate(
                                                    `/departments/${department._id}`
                                                )
                                            }
                                            className="mt-5 flex items-center gap-2 font-semibold text-blue-950 transition hover:text-amber-600"
                                        >
                                            Explore Department
                                            <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </motion.article>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default DepartmentComponent;