
import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
    ArrowRight,
    ExternalLink,
    FileText,
    AlertCircle,
} from "lucide-react";
import { motion } from "motion/react";

import image1 from "../../Image/lab1.jpg";
import image2 from "../../Image/lab2.jpg";
import image3 from "../../Image/lab3.jpg";
import image4 from "../../Image/work4.jpg";
import { useResearchPaperStore } from "../../DashBoards/UserDashboard/CourseStore/UserResearchPaperStore";

const images = [image1, image2, image3, image4];

const ResearchHero = () => {
    const [search, setSearch] = useState("");
    const [selectedMajorArea, setSelectedMajorArea] = useState("all");

    const {
        researchPapers,
        loading,
        error,
        getAllResearchPapers,
    } = useResearchPaperStore();

    useEffect(() => {
        getAllResearchPapers().catch(() => {});
    }, [getAllResearchPapers]);

    const majorAreas = useMemo(() => {
        const areas = new Map();

        researchPapers.forEach((paper) => {
            const area = paper.majorAreaId;

            if (
                area &&
                typeof area === "object" &&
                area._id
            ) {
                areas.set(area._id, area.name || "Major Area");
            }
        });

        return Array.from(areas, ([id, name]) => ({ id, name }));
    }, [researchPapers]);

    const filteredPapers = useMemo(() => {
        return researchPapers.filter((paper) => {
            const areaId =
                typeof paper.majorAreaId === "object"
                    ? paper.majorAreaId?._id
                    : paper.majorAreaId;

            const matchesArea =
                selectedMajorArea === "all" ||
                String(areaId) === String(selectedMajorArea);

            const searchText = search.trim().toLowerCase();

            const authors = Array.isArray(paper.authors)
                ? paper.authors.join(" ")
                : paper.authors || "";

            const matchesSearch =
                !searchText ||
                paper.title?.toLowerCase().includes(searchText) ||
                authors.toLowerCase().includes(searchText) ||
                paper.abstract?.toLowerCase().includes(searchText);

            return matchesArea && matchesSearch;
        });
    }, [researchPapers, selectedMajorArea, search]);

    const recentPapers = filteredPapers.slice(0, 4);

    const handleRetry = () => {
        getAllResearchPapers().catch(() => {});
    };

    return (
        <section className="w-full px-4 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-7xl">
                {/* Heading */}
                <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                    <div>
                        <p className="mb-2 text-sm font-bold uppercase tracking-widest text-amber-600">
                            Research and Innovation
                        </p>

                        <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                            Recent Key Research Publications
                        </h2>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                            Discover engineering research, explore new ideas,
                            and learn from academic publications.
                        </p>
                    </div>

                    <NavLink
                        to="/research-papers"
                        className="inline-flex w-fit shrink-0 items-center gap-2 rounded-lg bg-blue-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                    >
                        See More Research
                        <ArrowRight className="size-4" />
                    </NavLink>
                </div>

                {/* Search and major area filter */}
                <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search titles, authors, or abstracts..."
                        aria-label="Search research papers"
                        className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    <select
                        value={selectedMajorArea}
                        onChange={(event) =>
                            setSelectedMajorArea(event.target.value)
                        }
                        aria-label="Filter by major area"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                        <option value="all">All Major Areas</option>

                        {majorAreas.map((area) => (
                            <option key={area.id} value={area.id}>
                                {area.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Research paper cards */}
                {loading ? (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((item) => (
                            <div
                                key={item}
                                className="h-80 animate-pulse rounded-xl bg-slate-100"
                            />
                        ))}
                    </div>
                ) : error ? (
                    <div className="flex justify-center py-8">
                        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                                <AlertCircle
                                    size={28}
                                    className="text-amber-600"
                                />
                            </div>

                            <h3 className="mt-4 text-xl font-bold text-slate-900">
                                Oops! Something went wrong
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-slate-600">
                                We couldn't load the research papers right
                                now. Please try again in a moment.
                            </p>

                            <button
                                onClick={handleRetry}
                                className="mt-5 rounded-lg bg-blue-950 px-6 py-2.5 font-semibold text-white transition hover:bg-blue-800"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                ) : recentPapers.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
                        <FileText className="mx-auto size-10 text-slate-400" />

                        <h3 className="mt-3 font-semibold text-slate-800">
                            No research papers found
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                            Try another search or select a different major area.
                        </p>
                    </div>
                ) : (
                    <motion.div
                        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    >
                        {recentPapers.map((paper, index) => {
                            const area =
                                typeof paper.majorAreaId === "object"
                                    ? paper.majorAreaId?.name
                                    : null;

                            const authors = Array.isArray(paper.authors)
                                ? paper.authors.join(", ")
                                : paper.authors;

                            return (
                                <article
                                    key={paper._id}
                                    className="flex min-w-0 flex-col overflow-hidden rounded-xl bg-blue-950 text-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                                >
                                    <img
                                        className="h-40 w-full object-cover"
                                        src={images[index % images.length]}
                                        alt={area || "Engineering research"}
                                        loading="lazy"
                                    />

                                    <p className="bg-amber-500 px-4 py-2 text-center text-sm font-bold text-slate-950">
                                        {area || "Engineering Research"}
                                    </p>

                                    <div className="flex flex-1 flex-col p-5">
                                        <h3 className="line-clamp-3 font-bold leading-6">
                                            {paper.title}
                                        </h3>

                                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-gray-300">
                                            {authors}
                                        </p>

                                        <p className="mt-2 text-sm text-amber-300">
                                            {paper.publicationYear}
                                        </p>

                                        <div className="mt-auto flex flex-wrap gap-3 pt-5">
                                            {paper.sourceUrl && (
                                                <a
                                                    href={paper.sourceUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold transition hover:bg-blue-500"
                                                >
                                                    View Paper
                                                    <ExternalLink className="size-4" />
                                                </a>
                                            )}

                                            {paper.pdfUrl && (
                                                <a
                                                    href={paper.pdfUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold transition hover:bg-white/10"
                                                >
                                                    PDF
                                                    <ExternalLink className="size-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </motion.div>
                )}

                {/* See more below the cards */}
                {!loading && !error && filteredPapers.length > 4 && (
                    <div className="mt-8 text-center">
                        <NavLink
                            to="/research-papers"
                            className="inline-flex items-center gap-2 rounded-lg border border-blue-950 px-6 py-3 font-semibold text-blue-950 transition hover:bg-blue-950 hover:text-white"
                        >
                            Explore All {filteredPapers.length} Results
                            <ArrowRight className="size-4" />
                        </NavLink>
                    </div>
                )}
            </div>
        </section>
    );
};

export default ResearchHero;
