
import axios from "axios";
import { create } from "zustand";

const API_URL =
    "https://api.studstore.com.ng/api/v1/users";

axios.defaults.withCredentials = true;

// Normalize topic IDs whether they are strings or populated objects.
const getTopicId = (material) => {
    const topicId = material?.topicId;
    return String(topicId?._id || topicId || "");
};

const useSavedMaterialStore = create((set, get) => ({
    savedMaterials: [],
    loading: false,
    saving: false,
    savingMaterialUrl: null,
    deleting: false,
    error: null,
    message: null,

    // Check whether a URL is already saved for a topic.
    isMaterialSaved: (url, topicId) => {
        if (!url || !topicId) return false;

        return get().savedMaterials.some(
            (material) =>
                material.url === url &&
                getTopicId(material) === String(
                    topicId?._id || topicId
                )
        );
    },

    // Save a material, video, or resource.
    saveMaterial: async (materialData) => {
        const rawTopicId = materialData?.topicId;

        const topicId = String(
            rawTopicId?._id || rawTopicId || ""
        ).trim();

        const title = String(
            materialData?.title || ""
        ).trim();

        const url = String(
            materialData?.url || ""
        ).trim();

        const allowedTypes = ["material", "video", "resource"];

        const resourceType = allowedTypes.includes(
            materialData?.resourceType
        )
            ? materialData.resourceType
            : "material";

        if (!topicId || !title || !url) {
            return {
                success: false,
                message: "Material title, URL, and topic ID are required.",
            };
        }

        if (get().isMaterialSaved(url, topicId)) {
            return {
                success: true,
                message: "This material is already saved.",
            };
        }

        set({
            saving: true,
            savingMaterialUrl: url,
            error: null,
            message: null,
        });

        try {
            const response = await axios.post(
                `${API_URL}/save-material`,
                {
                    topicId,
                    title,
                    url,
                    resourceType,
                }
            );

            const savedMaterial = response.data.savedMaterial;

            if (savedMaterial) {
                set((state) => {
                    const alreadyExists =
                        state.savedMaterials.some(
                            (material) =>
                                material.url === savedMaterial.url &&
                                getTopicId(material) ===
                                    getTopicId(savedMaterial)
                        );

                    return {
                        savedMaterials: alreadyExists
                            ? state.savedMaterials
                            : [
                                  savedMaterial,
                                  ...state.savedMaterials,
                              ],
                    };
                });
            }

            const message =
                response.data.message ||
                "Material saved successfully.";

            set({
                saving: false,
                savingMaterialUrl: null,
                message,
                error: null,
            });

            // Refresh the list while retaining the successful save result.
            const refreshResult = await get().getSavedMaterials();

            if (!refreshResult.success) {
                console.warn(
                    "Material was saved, but the saved list could not be refreshed:",
                    refreshResult.message
                );
            }

            return {
                success: true,
                data: savedMaterial,
                message,
            };
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                "Failed to save material.";

            set({
                saving: false,
                savingMaterialUrl: null,
                error: errorMessage,
            });

            return {
                success: false,
                message: errorMessage,
            };
        }
    },

    // Fetch the logged-in student's saved materials.
    getSavedMaterials: async () => {
        set({
            loading: true,
            error: null,
        });

        try {
            const response = await axios.get(
                `${API_URL}/saved-material`
            );

            const savedMaterials = Array.isArray(
                response.data.savedMaterials
            )
                ? response.data.savedMaterials
                : [];

            set({
                savedMaterials,
                loading: false,
                error: null,
            });

            return {
                success: true,
                data: savedMaterials,
            };
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                "Failed to fetch saved materials.";

            set({
                loading: false,
                error: errorMessage,
            });

            return {
                success: false,
                message: errorMessage,
            };
        }
    },

    // Delete a saved material.
    deleteSavedMaterial: async (materialId) => {
        if (!materialId) {
            return {
                success: false,
                message: "Material ID is required.",
            };
        }

        set({
            deleting: true,
            error: null,
            message: null,
        });

        try {
            const response = await axios.delete(
                `${API_URL}/saved-material/${materialId}`
            );

            set((state) => ({
                savedMaterials: state.savedMaterials.filter(
                    (material) =>
                        String(material._id) !== String(materialId)
                ),
                deleting: false,
                message:
                    response.data.message ||
                    "Material removed successfully.",
                error: null,
            }));

            return {
                success: true,
                message:
                    response.data.message ||
                    "Material removed successfully.",
            };
        } catch (error) {
            const errorMessage =
                error.response?.data?.message ||
                error.message ||
                "Failed to remove saved material.";

            set({
                deleting: false,
                error: errorMessage,
            });

            return {
                success: false,
                message: errorMessage,
            };
        }
    },

    // Clear status messages.
    clearStatus: () =>
        set({
            error: null,
            message: null,
        }),
}));

export default useSavedMaterialStore;
