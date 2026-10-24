
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    BookText,
    CheckCircle2,
    CircleAlert,
    Clock3,
    ExternalLink,
    FileText,
    GraduationCap,
    Lightbulb,
    LoaderCircle,
    PlayCircle,
    Video,
    BookMarked,
    Layers3,
    RefreshCw,
    Target,
} from "lucide-react";

import LessonStore from "../../CourseStore/LessonStore";
import useSavedMaterialStore from "../../CourseStore/SaveMaterialStore";

// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function getText(value, fallback = "") {
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
    return fallback;
}

function getResourceTitle(resource, fallback = "Resource") {
    if (typeof resource === "string") return resource;

    return (
        resource?.title ||
        resource?.name ||
        resource?.label ||
        fallback
    );
}

function getResourceUrl(resource) {
    if (typeof resource === "string") return resource;

    return (
        resource?.url ||
        resource?.link ||
        resource?.videoUrl ||
        resource?.fileUrl ||
        ""
    );
}

function getParentTopicId(lesson) {
    const topicId = lesson?.TopicId ?? lesson?.topicId;

    return String(topicId?._id || topicId || "");
}

function getYouTubeEmbedUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== "string") return "";

    try {
        const url = new URL(rawUrl);
        const hostname = url.hostname.toLowerCase();
        let videoId = "";

        if (
            hostname === "youtu.be" ||
            hostname === "www.youtu.be"
        ) {
            videoId = url.pathname.split("/").filter(Boolean)[0] || "";
        } else if (
            [
                "youtube.com",
                "www.youtube.com",
                "m.youtube.com",
                "youtube-nocookie.com",
                "www.youtube-nocookie.com",
            ].includes(hostname)
        ) {
            if (url.pathname === "/watch") {
                videoId = url.searchParams.get("v") || "";
            } else if (
                url.pathname.startsWith("/embed/") ||
                url.pathname.startsWith("/shorts/") ||
                url.pathname.startsWith("/live/")
            ) {
                videoId =
                    url.pathname.split("/").filter(Boolean)[1] || "";
            }
        }

        if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) return "";

        return `https://www.youtube-nocookie.com/embed/${videoId}`;
    } catch {
        return "";
    }
}

function isDirectVideoUrl(url) {
    return /\.(mp4|webm|ogg|m4v)(\?.*)?(#.*)?$/i.test(url || "");
}

function getSavedTopicId(material) {
    const topicId = material?.topicId;
    return String(topicId?._id || topicId || "");
}

// --------------------------------------------------
// RESOURCE CARD
// --------------------------------------------------

function ResourceCard({
    resource,
    index,
    type,
    onSave,
    isSaving = false,
    isSaved = false,
}) {
    const title = getResourceTitle(
        resource,
        type === "video" ? "Video resource" : "Study material"
    );

    const url = getResourceUrl(resource);
    const embedUrl = type === "video" ? getYouTubeEmbedUrl(url) : "";
    const directVideo = type === "video" && isDirectVideoUrl(url);

    return (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
            {type === "video" && embedUrl && (
                <div className="aspect-video w-full bg-slate-950">
                    <iframe
                        src={embedUrl}
                        title={title}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        loading="lazy"
                    />
                </div>
            )}

            {directVideo && url && (
                <video
                    controls
                    preload="metadata"
                    className="aspect-video w-full bg-slate-950"
                    src={url}
                >
                    Your browser does not support video playback.
                </video>
            )}

            <div className="p-5">
                <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        {type === "video" ? (
                            <Video size={21} />
                        ) : (
                            <FileText size={21} />
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            {type === "video"
                                ? `Video ${index + 1}`
                                : `Material ${index + 1}`}
                        </p>

                        <h3 className="mt-1 break-words font-semibold text-slate-900">
                            {title}
                        </h3>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                    {url && !embedUrl && !directVideo && (
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
                        >
                            {type === "video" ? (
                                <PlayCircle size={16} />
                            ) : (
                                <ExternalLink size={16} />
                            )}

                            {type === "video"
                                ? "Watch Video"
                                : "Open Material"}
                        </a>
                    )}

                    {type === "material" && url && (
                        <button
                            type="button"
                            disabled={isSaving || isSaved}
                            onClick={() => onSave?.(resource)}
                            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                                isSaved
                                    ? "cursor-default border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-blue-200 text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                            }`}
                        >
                            {isSaving ? (
                                <>
                                    <LoaderCircle
                                        size={16}
                                        className="animate-spin"
                                    />
                                    Saving...
                                </>
                            ) : isSaved ? (
                                <>
                                    <CheckCircle2 size={16} />
                                    Saved
                                </>
                            ) : (
                                <>
                                    <BookMarked size={16} />
                                    Save Material
                                </>
                            )}
                        </button>
                    )}
                </div>

                {!url && (
                    <p className="mt-3 text-sm text-amber-700">
                        A link has not been added to this resource yet.
                    </p>
                )}
            </div>
        </article>
    );
}

// --------------------------------------------------
// CONTENT BLOCK
// --------------------------------------------------

function ContentBlock({ content }) {
    const text = getText(content);

    if (!text.trim()) {
        return (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                No teaching content has been added to this lesson yet.
            </div>
        );
    }

    return (
        <div className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 sm:text-base">
            {text}
        </div>
    );
}

// --------------------------------------------------
// WORKED EXAMPLE
// --------------------------------------------------

function ExampleCard({ example, index }) {
    const title =
        typeof example === "object" && example !== null
            ? example.title ||
              example.question ||
              `Worked Example ${index + 1}`
            : `Worked Example ${index + 1}`;

    const question =
        typeof example === "object" && example !== null
            ? example.question || example.problem || ""
            : example;

    const solution =
        typeof example === "object" && example !== null
            ? example.solution ||
              example.answer ||
              example.explanation ||
              ""
            : "";

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <Lightbulb size={20} />
                </div>

                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                        Worked Example {index + 1}
                    </p>

                    <h3 className="mt-1 font-semibold text-slate-900">
                        {getText(title)}
                    </h3>
                </div>
            </div>

            {question && (
                <div className="mb-4">
                    <p className="mb-2 text-sm font-semibold text-slate-800">
                        Question
                    </p>
                    <ContentBlock content={question} />
                </div>
            )}

            {solution && (
                <div className="rounded-xl bg-slate-50 p-4">
                    <p className="mb-2 text-sm font-semibold text-slate-800">
                        Solution
                    </p>
                    <ContentBlock content={solution} />
                </div>
            )}
        </article>
    );
}

// --------------------------------------------------
// LESSON DETAILS PAGE
// --------------------------------------------------

export default function LessonDetails() {
    const { lessonId } = useParams();
    const navigate = useNavigate();

    const getLessonById = LessonStore(
        (state) => state.getLessonById
    );

    const saveMaterial = useSavedMaterialStore(
        (state) => state.saveMaterial
    );

    const getSavedMaterials = useSavedMaterialStore(
        (state) => state.getSavedMaterials
    );

    const savedMaterials = useSavedMaterialStore(
        (state) => state.savedMaterials
    );

    const savingMaterialUrl = useSavedMaterialStore(
        (state) => state.savingMaterialUrl
    );

    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("content");
    const [saveNotice, setSaveNotice] = useState("");
    const [saveNoticeType, setSaveNoticeType] = useState("success");

    // Fetch the selected lesson by lessonId.
    useEffect(() => {
        let cancelled = false;

        async function fetchLesson() {
            if (!lessonId) {
                setError("Lesson ID is missing.");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError("");
            setLesson(null);
            setSaveNotice("");

            try {
                if (typeof getLessonById !== "function") {
                    throw new Error(
                        "LessonStore is missing getLessonById."
                    );
                }

                const response = await getLessonById(lessonId);

                const fetchedLesson =
                    response?.lesson ??
                    response?.data?.lesson ??
                    response?.data?.data?.lesson ??
                    null;

                if (!fetchedLesson) {
                    throw new Error("The lesson could not be found.");
                }

                if (!cancelled) {
                    setLesson(fetchedLesson);
                }
            } catch (err) {
                console.error(
                    "FAILED TO LOAD LESSON:",
                    err.response?.data || err
                );

                if (!cancelled) {
                    setError(
                        err?.response?.data?.message ||
                        err?.message ||
                        "Unable to load this lesson. Please try again."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchLesson();

        return () => {
            cancelled = true;
        };
    }, [lessonId, getLessonById]);

    // Preserve the existing saved-material feature.
    useEffect(() => {
        getSavedMaterials();
    }, [getSavedMaterials]);

    const parentTopicId = getParentTopicId(lesson);

    const handleSaveMaterial = async (material) => {
        const title = getResourceTitle(material, "Study material");
        const url = getResourceUrl(material);

        if (!parentTopicId || !url) {
            setSaveNoticeType("error");
            setSaveNotice(
                "The lesson's parent topic or material URL is missing."
            );
            return;
        }

        const alreadySaved = savedMaterials.some(
            (saved) =>
                saved.url === url &&
                getSavedTopicId(saved) === parentTopicId
        );

        if (alreadySaved) {
            setSaveNoticeType("success");
            setSaveNotice("This material is already saved.");
            return;
        }

        setSaveNotice("");

        try {
            // The current saved-material API uses topicId.
            // Keep that contract until its backend is changed.
            const result = await saveMaterial({
                topicId: parentTopicId,
                title,
                url,
                resourceType: "material",
            });

            if (result?.success) {
                await getSavedMaterials();

                setSaveNoticeType("success");
                setSaveNotice(
                    result.message || `${title} saved successfully!`
                );
            } else {
                setSaveNoticeType("error");
                setSaveNotice(
                    result?.message ||
                    "Failed to save material. Please try again."
                );
            }
        } catch (err) {
            console.error("FAILED TO SAVE MATERIAL:", err);

            setSaveNoticeType("error");
            setSaveNotice(
                err?.response?.data?.message ||
                err?.message ||
                "Failed to save material. Please try again."
            );
        }
    };

    // These now come from the lesson document, not the topic document.
    const content = lesson?.content || "";

    const examples =
        lesson?.examples ||
        lesson?.workedExamples ||
        lesson?.workedExample ||
        "";

    const videos = useMemo(() => {
        const value = lesson?.videos || lesson?.videoResources || [];
        return Array.isArray(value) ? value : [value];
    }, [lesson]);

    const materials = useMemo(() => {
        const normalize = (value) => {
            if (!value) return [];
            return Array.isArray(value) ? value : [value];
        };

        return [
            ...normalize(lesson?.materials),
            ...normalize(lesson?.studyMaterials),
            ...normalize(lesson?.externalMaterials),
            ...normalize(lesson?.resources),
        ];
    }, [lesson]);

    const tabs = [
        { id: "content", label: "Lesson Notes", icon: BookOpen },
        { id: "examples", label: "Worked Examples", icon: BookText },
        { id: "videos", label: "Videos", icon: Video },
        { id: "materials", label: "Study Materials", icon: FileText },
    ];

    const exampleCount = Array.isArray(examples)
        ? examples.length
        : typeof examples === "string" && examples.trim()
          ? 1
          : 0;

    const counts = {
        content: content ? 1 : 0,
        examples: exampleCount,
        videos: videos.filter(Boolean).length,
        materials: materials.filter(Boolean).length,
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center">
                    <LoaderCircle
                        size={38}
                        className="mx-auto animate-spin text-blue-700"
                    />
                    <p className="mt-4 text-sm font-medium text-slate-600">
                        Loading lesson content...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto max-w-3xl p-6">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                    <div className="flex items-start gap-3">
                        <CircleAlert
                            size={24}
                            className="shrink-0 text-red-600"
                        />
                        <div>
                            <h2 className="font-bold text-red-900">
                                Unable to load lesson
                            </h2>
                            <p className="mt-2 text-sm text-red-800">
                                {error}
                            </p>
                        </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
                        >
                            <RefreshCw size={16} />
                            Try Again
                        </button>

                        {parentTopicId && (
                            <Link
                                to={`/topics/${parentTopicId}/lessons`}
                                className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100"
                            >
                                <ArrowLeft size={16} />
                                Back to Lessons
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {parentTopicId ? (
                    <Link
                        to={`/topics/${parentTopicId}/lessons`}
                        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-700"
                    >
                        <ArrowLeft size={17} />
                        Back to Topic Lessons
                    </Link>
                ) : (
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-700"
                    >
                        <ArrowLeft size={17} />
                        Back
                    </button>
                )}

                {/* Lesson header */}
                <header className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-blue-700 p-6 text-white shadow-lg sm:p-9">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                            <GraduationCap
                                size={14}
                                className="mr-1 inline"
                            />
                            Learning Lesson
                        </span>

                        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                            Lesson{" "}
                            {lesson?.LessonNumber ??
                                lesson?.lessonNumber ??
                                "—"}
                        </span>
                    </div>

                    <h1 className="mt-5 break-words text-3xl font-bold tracking-tight sm:text-4xl">
                        {lesson?.title || "Untitled Lesson"}
                    </h1>

                    <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-100 sm:text-base">
                        Read the lesson notes, review worked examples,
                        watch videos, and explore recommended study materials.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-4 text-sm text-blue-100">
                        <span className="inline-flex items-center gap-2">
                            <BookOpen size={17} />
                            Lesson notes
                        </span>
                        <span className="inline-flex items-center gap-2">
                            <Lightbulb size={17} />
                            {exampleCount} example section
                            {exampleCount === 1 ? "" : "s"}
                        </span>
                        <span className="inline-flex items-center gap-2">
                            <Clock3 size={17} />
                            Learn at your own pace
                        </span>
                    </div>
                </header>

                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                    <main className="min-w-0">
                        {/* Tabs */}
                        <div className="mb-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                            <div className="flex min-w-max gap-2">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;

                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => {
                                                setActiveTab(tab.id);
                                                setSaveNotice("");
                                            }}
                                            className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                                                isActive
                                                    ? "bg-blue-700 text-white shadow-sm"
                                                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                            }`}
                                        >
                                            <Icon size={17} />
                                            {tab.label}
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-xs ${
                                                    isActive
                                                        ? "bg-white/20 text-white"
                                                        : "bg-slate-100 text-slate-600"
                                                }`}
                                            >
                                                {counts[tab.id]}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Notes */}
                        {activeTab === "content" && (
                            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                                <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                        <BookOpen size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">
                                            Lesson Notes
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Learn the concepts in this lesson.
                                        </p>
                                    </div>
                                </div>

                                <ContentBlock content={content} />

                                <div className="mt-8 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("examples")}
                                        className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
                                    >
                                        Review Examples
                                        <ArrowRight size={17} />
                                    </button>
                                </div>
                            </section>
                        )}

                        {/* Examples */}
                        {activeTab === "examples" && (
                            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                                        <Target size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">
                                            Worked Examples
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Review the explanations and solutions.
                                        </p>
                                    </div>
                                </div>

                                {typeof examples === "string" &&
                                examples.trim() ? (
                                    <ContentBlock content={examples} />
                                ) : Array.isArray(examples) &&
                                  examples.length > 0 ? (
                                    <div className="space-y-5">
                                        {examples.map((example, index) => (
                                            <ExampleCard
                                                key={example?._id || index}
                                                example={example}
                                                index={index}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                                        No worked examples have been added to this lesson yet.
                                    </p>
                                )}
                            </section>
                        )}

                        {/* Videos */}
                        {activeTab === "videos" && (
                            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                                <div className="mb-6 flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                                        <PlayCircle size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">
                                            Video Lessons
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Reinforce your understanding with videos.
                                        </p>
                                    </div>
                                </div>

                                {videos.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                                        {videos.map((video, index) => (
                                            <ResourceCard
                                                key={`${getResourceUrl(video)}-${index}`}
                                                resource={video}
                                                index={index}
                                                type="video"
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                                        No videos have been added to this lesson yet.
                                    </p>
                                )}
                            </section>
                        )}

                        {/* Materials */}
                        {activeTab === "materials" && (
                            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                                <div className="mb-6 flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                        <Layers3 size={22} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">
                                            Study Materials
                                        </h2>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Open materials and save them for later.
                                        </p>
                                    </div>
                                </div>

                                {saveNotice && (
                                    <div
                                        role="status"
                                        aria-live="polite"
                                        className={`mb-5 rounded-xl border p-4 text-sm leading-6 ${
                                            saveNoticeType === "error"
                                                ? "border-red-200 bg-red-50 text-red-800"
                                                : "border-emerald-200 bg-emerald-50 text-emerald-800"
                                        }`}
                                    >
                                        <div className="flex items-start gap-2">
                                            {saveNoticeType === "error" ? (
                                                <CircleAlert
                                                    size={18}
                                                    className="mt-0.5 shrink-0"
                                                />
                                            ) : (
                                                <CheckCircle2
                                                    size={18}
                                                    className="mt-0.5 shrink-0"
                                                />
                                            )}
                                            <p>{saveNotice}</p>
                                        </div>
                                    </div>
                                )}

                                {materials.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                                        {materials.map((material, index) => {
                                            const url = getResourceUrl(material);

                                            const isSaving = Boolean(
                                                url && savingMaterialUrl === url
                                            );

                                            const isSaved = savedMaterials.some(
                                                (saved) =>
                                                    saved.url === url &&
                                                    getSavedTopicId(saved) ===
                                                        parentTopicId
                                            );

                                            return (
                                                <ResourceCard
                                                    key={`${url}-${index}`}
                                                    resource={material}
                                                    index={index}
                                                    type="material"
                                                    onSave={handleSaveMaterial}
                                                    isSaving={isSaving}
                                                    isSaved={isSaved}
                                                />
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                                        No study materials have been added to this lesson yet.
                                    </p>
                                )}
                            </section>
                        )}
                    </main>

                    {/* Sidebar */}
                    <aside className="space-y-5">
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="font-bold text-slate-900">
                                Lesson Overview
                            </h2>

                            <p className="mt-1 break-words text-sm text-slate-500">
                                {lesson?.title || "Selected lesson"}
                            </p>

                            <div className="mt-5 space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-2 text-sm text-slate-600">
                                        <BookOpen size={17} className="text-blue-700" />
                                        Lesson notes
                                    </span>
                                    <CheckCircle2
                                        size={18}
                                        className={content ? "text-emerald-600" : "text-slate-300"}
                                    />
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-2 text-sm text-slate-600">
                                        <Lightbulb size={17} className="text-amber-600" />
                                        Worked examples
                                    </span>
                                    <span className="text-sm font-semibold text-slate-700">
                                        {exampleCount}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-2 text-sm text-slate-600">
                                        <Video size={17} className="text-red-600" />
                                        Videos
                                    </span>
                                    <span className="text-sm font-semibold text-slate-700">
                                        {videos.length}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-2 text-sm text-slate-600">
                                        <FileText size={17} className="text-emerald-600" />
                                        Materials
                                    </span>
                                    <span className="text-sm font-semibold text-slate-700">
                                        {materials.length}
                                    </span>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="font-bold text-slate-900">
                                Quick Navigation
                            </h2>

                            <div className="mt-4 space-y-2">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;

                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => {
                                                setActiveTab(tab.id);
                                                setSaveNotice("");
                                            }}
                                            className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                                                activeTab === tab.id
                                                    ? "bg-blue-50 text-blue-800"
                                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            }`}
                                        >
                                            <span className="flex items-center gap-3">
                                                <Icon size={17} />
                                                {tab.label}
                                            </span>
                                            <ArrowRight size={15} />
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                            <div className="flex items-center gap-2 text-blue-800">
                                <Lightbulb size={19} />
                                <h2 className="font-bold">Study Tip</h2>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-blue-900">
                                Read the lesson notes first, work through the
                                examples, then use the videos and study materials
                                to strengthen your understanding.
                            </p>
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    );
}
