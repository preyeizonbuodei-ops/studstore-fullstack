import { create } from "zustand";
import axios from "axios";

// Already includes /api/v1, so the paths below don't repeat it
const API_URL = "https://studstore-fullstackstudstore-backend.onrender.com/api/v1/users";

// Path of the route that runs getRefreshToken (check your backend route.js)
const REFRESH_URL = `${API_URL}/refresh-token`;

// One axios instance that always sends the login cookie
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Share one refresh call if several requests fail at the same time
let refreshPromise = null;

const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(REFRESH_URL, {}, { withCredentials: true }) // use axios.get if your route is GET
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

// If the access token expired (401), refresh it once and retry the request
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        await refreshAccessToken();
        return api(original);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Pull a readable message out of an axios error
const getErrorMessage = (err, fallback) =>
  err.response?.data?.error || err.response?.data?.message || err.message || fallback;

const useAiStore = create((set, get) => ({
  conversations: [], // sidebar list: { _id, title, updatedAt }
  conversationId: null, // null means a new chat
  messages: [], // current chat: { role, content }
  loading: false,
  error: null,

  // Send a question and append the answer
  askQuestion: async (question) => {
    const { conversationId, messages } = get();
    if (!question.trim()) return;

    // Show the student's message immediately
    set({
      messages: [...messages, { role: "user", content: question }],
      loading: true,
      error: null,
    });

    try {
      const { data } = await api.post("/ask-ai", { question, conversationId });

      set((state) => ({
        messages: [...state.messages, { role: "assistant", content: data.answer }],
        conversationId: data.conversationId,
        loading: false,
      }));

      // Refresh the sidebar so new chats show up
      get().fetchConversations();
    } catch (err) {
      set({ loading: false, error: getErrorMessage(err, "Request failed") });
    }
  },

  // Load the list of saved chats
  fetchConversations: async () => {
    try {
      const { data } = await api.get("/conversations");
      set({ conversations: data });
    } catch (err) {
      console.error(getErrorMessage(err, "Could not load conversations"));
    }
  },

  // Open a saved chat
  loadConversation: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get(`/conversations/${id}`);

      set({
        conversationId: data._id,
        messages: data.messages.map((m) => ({ role: m.role, content: m.content })),
        loading: false,
      });
    } catch (err) {
      set({ loading: false, error: getErrorMessage(err, "Could not load chat") });
    }
  },

  // Start a fresh chat
  newChat: () => set({ conversationId: null, messages: [], error: null }),
}));

export default useAiStore;