
import { useEffect, useMemo, useState } from "react";
import { Building2, Plus, Image as ImageIcon, X } from "lucide-react";
import { useAdminMajorAreaStore } from "../../UserDashboard/DepartmentStore/MajorAreaStore";
import { NavLink } from "react-router-dom";

const AdminMajorArea = () => {
    const {
        majorAreas,
        departments,
        isLoading,
        error,
        getMajorAreas,
        getDepartments,
        updateMajorArea,
        deleteMajorArea,
    } = useAdminMajorAreaStore();

    const [editingArea, setEditingArea] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        department: "",
        description: "",
        history: "",
        image: "",
    });
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [actionError, setActionError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        getMajorAreas().catch(() => {});
        getDepartments().catch(() => {});
    }, [getMajorAreas, getDepartments]);

    // Group major areas by department
    const groupedAreas = useMemo(() => {
        return majorAreas.reduce((groups, area) => {
            const departmentName =
                typeof area.department === "object"
                    ? area.department?.name || "Unassigned Department"
                    : "Unassigned Department";

            if (!groups[departmentName]) {
                groups[departmentName] = [];
            }

            groups[departmentName].push(area);
            return groups;
        }, {});
    }, [majorAreas]);

    // Open edit form
    const handleEdit = (area) => {
        setActionError("");
        setSuccessMessage("");
        setEditingArea(area);

        setFormData({
            name: area.name || "",
            department:
                typeof area.department === "object"
                    ? area.department?._id || ""
                    : area.department || "",
            description: area.description || "",
            history: area.history || "",
            image: area.image || "",
        });
    };

    // Update major area
    const handleUpdate = async (event) => {
        event.preventDefault();

        if (!editingArea) return;

        setSaving(true);
        setActionError("");
        setSuccessMessage("");

        try {
            await updateMajorArea(editingArea._id, formData);

            setEditingArea(null);
            setSuccessMessage("Major area updated successfully.");
        } catch {
            setActionError(
                "Unable to update this major area. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    // Delete major area
    const handleDelete = async (area) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${area.name}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        setDeletingId(area._id);
        setActionError("");
        setSuccessMessage("");

        try {
            await deleteMajorArea(area._id);
            setSuccessMessage("Major area deleted successfully.");
        } catch {
            setActionError(
                "Unable to delete this major area. Please try again."
            );
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 p-3 sm:p-5">
            {/* Compact Header */}
            <section className="mb-5 flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-lg font-bold text-blue-950 sm:text-xl">
                        Major Areas
                    </h1>
                    <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                        Manage major areas by department.
                    </p>
                </div>

                <NavLink
                    className="flex w-fit items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-white transition hover:bg-blue-800 sm:px-5"
                    to="/admin/create-major-area"
                >
                    <Plus size={18} />
                    Add Major Area
                </NavLink>
            </section>

            {/* Action Messages */}
            {actionError && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {actionError}
                </div>
            )}

            {successMessage && (
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                    {successMessage}
                </div>
            )}

            {/* Compact Summary */}
            {!isLoading && !error && (
                <div className="mb-5 flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                        <Building2 size={19} />
                    </div>

                    <div>
                        <p className="text-xs text-gray-500">
                            Total Major Areas
                        </p>
                        <p className="text-lg font-bold leading-5 text-blue-950">
                            {majorAreas.length}
                        </p>
                    </div>
                </div>
            )}

            {/* Loading */}
            {isLoading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((item) => (
                        <div
                            key={item}
                            className="h-40 animate-pulse rounded-lg bg-gray-200"
                        />
                    ))}
                </div>
            ) : error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-semibold text-red-800">
                        Oops! Something went wrong.
                    </p>
                    <p className="mt-1 text-sm text-red-700">
                        We couldn't load the major areas. Please try again.
                    </p>
                    <button
                        type="button"
                        onClick={() => {
                            getMajorAreas().catch(() => {});
                            getDepartments().catch(() => {});
                        }}
                        className="mt-2 text-sm font-semibold text-red-800 underline"
                    >
                        Try again
                    </button>
                </div>
            ) : majorAreas.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
                    <Building2 className="mx-auto size-9 text-gray-400" />
                    <p className="mt-3 text-sm font-semibold text-gray-700">
                        No major areas available
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedAreas)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([departmentName, areas]) => (
                            <section key={departmentName}>
                                {/* Department Heading */}
                                <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-2">
                                    <h2 className="text-sm font-bold text-blue-950 sm:text-base">
                                        {departmentName}
                                    </h2>
                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                                        {areas.length}
                                    </span>
                                </div>

                                {/* Compact Cards */}
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {areas.map((area) => (
                                        <article
                                            key={area._id}
                                            className="flex min-w-0 gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                                        >
                                            {/* Small Thumbnail */}
                                            {area.image ? (
                                                <img
                                                    src={area.image}
                                                    alt={area.name}
                                                    loading="lazy"
                                                    className="size-20 shrink-0 rounded-md object-cover sm:size-24"
                                                />
                                            ) : (
                                                <div className="flex size-20 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-400 sm:size-24">
                                                    <ImageIcon size={26} />
                                                </div>
                                            )}

                                            {/* Minimal Details */}
                                            <div className="flex min-w-0 flex-1 flex-col">
                                                <h3 className="line-clamp-2 text-sm font-bold leading-5 text-blue-950">
                                                    {area.name}
                                                </h3>

                                                <p className="mt-1 line-clamp-2 text-xs leading-4 text-gray-500">
                                                    {area.description}
                                                </p>

                                                <div className="mt-auto flex gap-2 pt-3">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEdit(area)
                                                        }
                                                        className="rounded bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDelete(area)
                                                        }
                                                        disabled={
                                                            deletingId ===
                                                            area._id
                                                        }
                                                        className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {deletingId === area._id
                                                            ? "Deleting..."
                                                            : "Delete"}
                                                    </button>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        ))}
                </div>
            )}

            {/* Edit Modal */}
            {editingArea && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3">
                    <div className="my-auto max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-blue-950">
                                Edit Major Area
                            </h2>

                            <button
                                type="button"
                                onClick={() => setEditingArea(null)}
                                className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                aria-label="Close edit form"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Major Area Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(event) =>
                                        setFormData({
                                            ...formData,
                                            name: event.target.value,
                                        })
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Department
                                </label>
                                <select
                                    required
                                    value={formData.department}
                                    onChange={(event) =>
                                        setFormData({
                                            ...formData,
                                            department: event.target.value,
                                        })
                                    }
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                                >
                                    <option value="">
                                        Select a department
                                    </option>
                                    {departments.map((department) => (
                                        <option
                                            key={department._id}
                                            value={department._id}
                                        >
                                            {department.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={formData.description}
                                    onChange={(event) =>
                                        setFormData({
                                            ...formData,
                                            description: event.target.value,
                                        })
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    History
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.history}
                                    onChange={(event) =>
                                        setFormData({
                                            ...formData,
                                            history: event.target.value,
                                        })
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
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
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingArea(null)}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
};

export default AdminMajorArea;
