
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Layers } from "lucide-react";
import { useUserDepartmentStore } from "../DashBoards/UserDashboard/DepartmentStore/UserDepartmentStore";
import Navbar from "../Components/Navbar";
import Footer from "../Components/Foot";

export default function DepartmentDetails() {
    const { departmentId } = useParams();

    const {
        department,
        majorAreas,
        isLoading,
        error,
        getDepartmentById,
    } = useUserDepartmentStore();

    useEffect(() => {
        getDepartmentById(departmentId).catch(() => {});
    }, [departmentId, getDepartmentById]);

    if (isLoading) {
        return (
            <>
                <Navbar />
                <div className="mt-19 flex min-h-[60vh] items-center justify-center bg-gray-50 px-4">
                    <p className="text-center text-gray-600">
                        Loading department...
                    </p>
                </div>
                <Footer />
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />

                <div className="mt-19 flex min-h-[60vh] items-center justify-center bg-gray-50 px-4 py-12">
                    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                            <Layers
                                size={28}
                                className="text-amber-600"
                            />
                        </div>

                        <h2 className="mt-4 text-xl font-bold text-gray-900">
                            Oops! Something went wrong
                        </h2>

                        <p className="mt-2 leading-6 text-gray-600">
                            We couldn't load this department right now.
                            Please try again in a moment.
                        </p>

                        <button
                            onClick={() =>
                                getDepartmentById(departmentId).catch(() => {})
                            }
                            className="mt-5 rounded-lg bg-blue-950 px-6 py-2.5 font-medium text-white transition hover:bg-blue-900"
                        >
                            Try Again
                        </button>

                        <Link
                            to="/department"
                            className="mt-4 block text-sm font-medium text-gray-600 hover:text-blue-700"
                        >
                            Back to All Departments
                        </Link>
                    </div>
                </div>

                <Footer />
            </>
        );
    }

    if (!department) {
        return (
            <>
                <Navbar />

                <div className="mt-19 flex min-h-[60vh] flex-col items-center justify-center bg-gray-50 px-4 text-center">
                    <Layers size={36} className="mb-4 text-gray-400" />

                    <h2 className="text-xl font-bold text-gray-900">
                        Department Not Found
                    </h2>

                    <p className="mt-2 text-gray-600">
                        We couldn't find the department you're looking for.
                    </p>

                    <Link
                        to="/department"
                        className="mt-5 inline-flex items-center gap-2 font-medium text-blue-700 hover:text-blue-900"
                    >
                        <ArrowLeft size={18} />
                        All Departments
                    </Link>
                </div>

                <Footer />
            </>
        );
    }

    return (
        <>
            <Navbar />

            <div className="mt-19 min-h-screen bg-gray-50">
                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                    <Link
                        to="/department"
                        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600"
                    >
                        <ArrowLeft size={18} />
                        All Departments
                    </Link>

                    {/* Department Information */}
                    <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
                        {department.image && (
                            <img
                                src={department.image}
                                alt={department.name}
                                className="h-64 w-full object-cover sm:h-80"
                            />
                        )}

                        <div className="p-6 sm:p-10">
                            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-600">
                                Engineering Department
                            </p>

                            <h1 className="mb-5 text-3xl font-bold text-gray-900 sm:text-4xl">
                                {department.name}
                            </h1>

                            <h2 className="mb-3 text-xl font-semibold text-gray-800">
                                About the Department
                            </h2>

                            <p className="leading-8 text-gray-600">
                                {department.description}
                            </p>

                            <h2 className="mb-3 mt-8 text-xl font-semibold text-gray-800">
                                History
                            </h2>

                            <p className="whitespace-pre-line leading-8 text-gray-600">
                                {department.history}
                            </p>
                        </div>
                    </section>

                    {/* Major Areas */}
                    <section className="mt-14">
                        <div className="mb-8">
                            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
                                Explore Your Field
                            </p>

                            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                                Major Areas
                            </h2>

                            <p className="mt-3 text-gray-600">
                                Explore the different areas of{" "}
                                {department.name}.
                            </p>
                        </div>

                        {majorAreas.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
                                <Layers
                                    size={36}
                                    className="mx-auto mb-4 text-gray-400"
                                />

                                <h3 className="text-lg font-semibold text-gray-800">
                                    No Major Areas Yet
                                </h3>

                                <p className="mt-2 text-gray-500">
                                    Major areas for this department will
                                    appear here once they are added.
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {majorAreas.map((area) => (
                                    <article
                                        key={area._id}
                                        className="overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
                                    >
                                        {area.image && (
                                            <img
                                                src={area.image}
                                                alt={area.name}
                                                className="h-48 w-full object-cover"
                                            />
                                        )}

                                        <div className="p-6">
                                            <h3 className="text-xl font-bold text-gray-900">
                                                {area.name}
                                            </h3>

                                            <p className="mt-3 line-clamp-3 leading-7 text-gray-600">
                                                {area.description}
                                            </p>

                                            <Link
                                                to={`/major-areas/${area._id}`}
                                                className="mt-5 inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-800"
                                            >
                                                Explore Major Area
                                                <ArrowRight size={18} />
                                            </Link>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            </div>

            <Footer />
        </>
    );
}
