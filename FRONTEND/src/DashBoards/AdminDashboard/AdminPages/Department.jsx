
import { useEffect, useState } from "react";
import {
    Building2,
    AlertCircle,
    X,
    Pencil,
    Trash2,
} from "lucide-react";
import AdminDataArea from "./AdminDataArea";
import { useDepartmentStore } from "../../UserDashboard/DepartmentStore/DepartmentStore";

const Department = () => {
    const {
        departments,
        isLoading,
        error,
        getDepartments,
        updateDepartment,
        deleteDepartment,
    } = useDepartmentStore();

    const [editingDepartment, setEditingDepartment] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        history: "",
        image: "",
    });
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [actionError, setActionError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        getDepartments().catch(() => {});
    }, [getDepartments]);

    const handleEdit = (department) => {
        setEditingDepartment(department);
        setFormData({
            name: department.name || "",
            description: department.description || "",
            history: department.history || "",
            image: department.image || "",
        });
        setActionError("");
        setSuccessMessage("");
    };

    const handleUpdate = async (event) => {
        event.preventDefault();

        if (!editingDepartment) return;

        setSaving(true);
        setActionError("");
        setSuccessMessage("");

        try {
            await updateDepartment(editingDepartment._id, formData);
            setEditingDepartment(null);
            setSuccessMessage("Department updated successfully.");
        } catch {
            setActionError("We couldn't update this department. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (department) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${department.name}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        setDeletingId(department._id);
        setActionError("");
        setSuccessMessage("");

        try {
            await deleteDepartment(department._id);
            setSuccessMessage("Department deleted successfully.");
        } catch {
            setActionError("We couldn't delete this department. Please try again.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            <AdminDataArea />

            <section className="m-2 overflow-x-auto rounded-lg bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="font-semibold text-blue-950">
                            Departments
                        </h2>
                        <p className="text-sm text-gray-500">
                            View and manage engineering departments.
                        </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
                        {departments.length} total
                    </span>
                </div>

                {actionError && (
                    <div
                        role="alert"
                        className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                    >
                        {actionError}
                    </div>
                )}

                {successMessage && (
                    <div
                        role="status"
                        className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
                    >
                        {successMessage}
                    </div>
                )}

                {isLoading ? (
                    <div className="py-10 text-center text-sm text-gray-500">
                        Loading departments...
                    </div>
                ) : error ? (
                    <div className="flex justify-center py-8">
                        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                                <AlertCircle
                                    size={25}
                                    className="text-amber-600"
                                />
                            </div>

                            <h3 className="mt-3 font-semibold text-gray-900">
                                Oops! Something went wrong
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-gray-600">
                                We couldn't load the departments right now.
                                Please try again in a moment.
                            </p>

                            <button
                                type="button"
                                onClick={() => getDepartments().catch(() => {})}
                                className="mt-4 rounded-lg bg-blue-950 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-900"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                ) : departments.length === 0 ? (
                    <div className="py-10 text-center">
                        <Building2
                            className="mx-auto mb-2 text-gray-400"
                            size={32}
                        />
                        <p className="text-sm text-gray-500">
                            No departments found.
                        </p>
                    </div>
                ) : (
                    <table className="w-full min-w-[700px]">
                        <thead>
                            <tr className="border-b text-left text-sm text-gray-500">
                                <th className="p-3">#</th>
                                <th className="p-3">Department Name</th>
                                <th className="p-3">Description</th>
                                <th className="p-3">Major Areas</th>
                                <th className="p-3">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {departments.map((department, index) => (
                                <tr
                                    key={department._id}
                                    className="border-b hover:bg-gray-50"
                                >
                                    <td className="p-3">{index + 1}</td>

                                    <td className="p-3 font-medium text-blue-950">
                                        {department.name}
                                    </td>

                                    <td className="max-w-xs p-3 text-sm text-gray-500">
                                        <p className="line-clamp-2">
                                            {department.description}
                                        </p>
                                    </td>

                                    <td className="p-3">
                                        {department.majorAreaCount ?? 0}
                                    </td>

                                    <td className="p-3">
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(department)}
                                                className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                                            >
                                                <Pencil size={14} />
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleDelete(department)}
                                                disabled={deletingId === department._id}
                                                className="inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <Trash2 size={14} />
                                                {deletingId === department._id
                                                    ? "Deleting..."
                                                    : "Delete"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            {editingDepartment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
                    <div className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-blue-950">
                                Edit Department
                            </h2>

                            <button
                                type="button"
                                onClick={() => {
                                    setEditingDepartment(null);
                                    setActionError("");
                                }}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                aria-label="Close edit form"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {actionError && (
                            <div
                                role="alert"
                                className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                            >
                                {actionError}
                            </div>
                        )}

                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Department Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(event) =>
                                        setFormData({
                                            ...formData,
                                            name: event.target.value,
                                        })
                                    }
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(event) =>
                                        setFormData({
                                            ...formData,
                                            description: event.target.value,
                                        })
                                    }
                                    required
                                    rows={4}
                                    className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    History
                                </label>
                                <textarea
                                    value={formData.history}
                                    onChange={(event) =>
                                        setFormData({
                                            ...formData,
                                            history: event.target.value,
                                        })
                                    }
                                    rows={3}
                                    className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Image URL
                                </label>
                                <input
                                    type="url"
                                    value={formData.image}
                                    onChange={(event) =>
                                        setFormData({
                                            ...formData,
                                            image: event.target.value,
                                        })
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingDepartment(null);
                                        setActionError("");
                                    }}
                                    disabled={saving}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-lg bg-blue-950 px-5 py-2 text-sm font-medium text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default Department;
