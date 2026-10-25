import { useEffect, useState } from "react";
import axios from "axios";
import { useAdminMajorAreaTopicStore } from "../../UserDashboard/DepartmentStore/MajorTopicStore";


const API_URL = "https://api.studstore.com.ng/api/v1/admin";

const CreateMajorAreaTopic = () => {
    const {
        createMajorAreaTopic,
        loading,
        error,
    } = useAdminMajorAreaTopicStore();

    const [majorAreas, setMajorAreas] = useState([]);
    const [message, setMessage] = useState("");
    const [formData, setFormData] = useState({
        majorArea: "",
        title: "",
        description: "",
        content: "",
        examples: "",
        videos: [{ title: "", url: "" }],
        materials: [{ title: "", url: "" }],
    });

    useEffect(() => {
        const getMajorAreas = async () => {
            try {
                const response = await axios.get(
                    `${API_URL}/get-major-area`,
                    { withCredentials: true }
                );

                setMajorAreas(response.data.majorAreas || []);
            } catch (error) {
                setMessage(
                    error.response?.data?.message ||
                    "Failed to retrieve major areas"
                );
            }
        };

        getMajorAreas();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleResourceChange = (resourceType, index, field, value) => {
        setFormData((prev) => ({
            ...prev,
            [resourceType]: prev[resourceType].map((resource, i) =>
                i === index ? { ...resource, [field]: value } : resource
            ),
        }));
    };

    const addResource = (resourceType) => {
        setFormData((prev) => ({
            ...prev,
            [resourceType]: [
                ...prev[resourceType],
                { title: "", url: "" },
            ],
        }));
    };

    const removeResource = (resourceType, index) => {
        setFormData((prev) => ({
            ...prev,
            [resourceType]: prev[resourceType].filter(
                (_, i) => i !== index
            ),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");

        const topicData = {
            ...formData,
            videos: formData.videos.filter(
                (video) => video.title.trim() && video.url.trim()
            ),
            materials: formData.materials.filter(
                (material) => material.title.trim() && material.url.trim()
            ),
        };

        try {
            const response = await createMajorAreaTopic(topicData);

            setMessage(response.message || "Topic created successfully");

            setFormData({
                majorArea: "",
                title: "",
                description: "",
                content: "",
                examples: "",
                videos: [{ title: "", url: "" }],
                materials: [{ title: "", url: "" }],
            });
        } catch (error) {
            setMessage(
                error.response?.data?.message || "Failed to create topic"
            );
        }
    };

    const renderResources = (resourceType, heading) => (
        <div className="space-y-4 border-t border-gray-200 pt-5">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-blue-950">
                    {heading}
                </h2>

                <button
                    type="button"
                    onClick={() => addResource(resourceType)}
                    className="rounded-lg bg-blue-100 px-3 py-2 text-sm font-medium text-blue-950 hover:bg-blue-200"
                >
                    + Add another
                </button>
            </div>

            {formData[resourceType].map((resource, index) => (
                <div
                    key={index}
                    className="space-y-3 rounded-lg border border-gray-200 p-4"
                >
                    <input
                        type="text"
                        value={resource.title}
                        onChange={(e) =>
                            handleResourceChange(
                                resourceType,
                                index,
                                "title",
                                e.target.value
                            )
                        }
                        placeholder="Resource title"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-700"
                    />

                    <input
                        type="url"
                        value={resource.url}
                        onChange={(e) =>
                            handleResourceChange(
                                resourceType,
                                index,
                                "url",
                                e.target.value
                            )
                        }
                        placeholder="https://example.com/resource"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-700"
                    />

                    {formData[resourceType].length > 1 && (
                        <button
                            type="button"
                            onClick={() => removeResource(resourceType, index)}
                            className="text-sm font-medium text-red-600 hover:text-red-800"
                        >
                            Remove
                        </button>
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 px-4 py-10 sm:px-8">
            <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-lg sm:p-8">
                <h1 className="mb-2 text-2xl font-bold text-blue-950">
                    Create Major Area Topic
                </h1>

                <p className="mb-6 text-sm text-gray-500">
                    Select a major area and add its learning content and resources.
                </p>

                {(message || error) && (
                    <p className="mb-5 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                        {message || error}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="mb-2 block font-medium text-gray-700">
                            Major Area
                        </label>

                        <select
                            name="majorArea"
                            value={formData.majorArea}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-700"
                        >
                            <option value="">Select Major Area</option>

                            {majorAreas.map((area) => (
                                <option key={area._id} value={area._id}>
                                    {area.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block font-medium text-gray-700">
                            Topic Title
                        </label>

                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g. Introduction to Robotics"
                            required
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-700"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block font-medium text-gray-700">
                            Description
                        </label>

                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Brief description of the topic"
                            required
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-700"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block font-medium text-gray-700">
                            Topic Content
                        </label>

                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            placeholder="Enter the full learning content"
                            required
                            rows={8}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-700"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block font-medium text-gray-700">
                            Examples
                        </label>

                        <textarea
                            name="examples"
                            value={formData.examples}
                            onChange={handleChange}
                            placeholder="Add worked examples (optional)"
                            rows={5}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-700"
                        />
                    </div>

                    {renderResources("videos", "Video Resources (Optional)")}

                    {renderResources("materials", "Learning Materials (Optional)")}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-950 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Creating Topic..." : "Create Topic"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateMajorAreaTopic;