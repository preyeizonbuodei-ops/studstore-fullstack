
import { useEffect, useState } from "react";
import axios from "axios";

import {
    Newspaper,
    Search,
    ExternalLink,
    CalendarDays,
    LoaderCircle,
    RefreshCw
} from "lucide-react";


const News = () => {
    const [news, setNews] = useState([]);
    const [visibleCount, setVisibleCount] = useState(9);
    const [search, setSearch] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const getNews = async () => {
        try {
            setIsLoading(true);
            setError("");

            const response = await axios.get(
                "https://api.studstore.com.ng/api/v1/users/get-news"
            );

            if (response.data.success) {
                setNews(response.data.data.articles || []);
            } else {
                setError("Unable to retrieve news.");
            }
        } catch (error) {
            console.log(error);
            setError("Could not load news. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        getNews();
    }, []);

    const filteredNews = news.filter((article) => {
        const searchText = search.toLowerCase();

        return (
            article.title?.toLowerCase().includes(searchText) ||
            article.description?.toLowerCase().includes(searchText) ||
            article.source?.name?.toLowerCase().includes(searchText)
        );
    });

    const visibleNews = filteredNews.slice(0, visibleCount);

    const formatDate = (date) => {
        if (!date) return "Date unavailable";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "Date unavailable";
        }

        return parsedDate.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    return (
      <>

        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-7xl">

                {/* Header */}
                <div className="mb-8">
                    <div className="mb-3 flex items-center gap-3">
                        <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
                            <Newspaper size={25} />
                        </div>

                        <span className="font-semibold text-blue-700">
                            StudStore News
                        </span>
                    </div>

                    <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                        Engineering News & Updates
                    </h1>

                    <p className="mt-3 max-w-2xl text-slate-600">
                        Explore the latest engineering developments,
                        technology discoveries, research, and industry news.
                    </p>
                </div>

                {/* Search */}
                <div className="mb-8 flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <Search
                            size={20}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setVisibleCount(9);
                            }}
                            placeholder="Search news, topics, or sources..."
                            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <button
                        onClick={getNews}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                    >
                        <RefreshCw size={18} />
                        Refresh
                    </button>
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="flex min-h-60 flex-col items-center justify-center gap-3">
                        <LoaderCircle
                            size={35}
                            className="animate-spin text-blue-600"
                        />
                        <p className="text-slate-500">Loading news...</p>
                    </div>
                )}

                {/* Error */}
                {!isLoading && error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
                        <p className="font-medium text-red-700">{error}</p>

                        <button
                            onClick={getNews}
                            className="mt-4 rounded-lg bg-red-600 px-5 py-2 text-white hover:bg-red-700"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* News Grid */}
                {!isLoading && !error && (
                    <>
                        <div className="mb-5 flex items-center justify-between gap-3">
                            <h2 className="text-xl font-bold text-slate-900">
                                Latest Stories
                            </h2>

                            <span className="text-sm text-slate-500">
                                {filteredNews.length} articles
                            </span>
                        </div>

                        {visibleNews.length > 0 ? (
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {visibleNews.map((article, index) => (
                                    <article
                                        key={article.url || index}
                                        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                                    >
                                        <div className="aspect-[16/9] overflow-hidden bg-slate-100">
                                            {article.urlToImage ? (
                                                <img
                                                    src={article.urlToImage}
                                                    alt={article.title || "News"}
                                                    loading="lazy"
                                                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = "none";
                                                    }}
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-slate-400">
                                                    <Newspaper size={42} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-1 flex-col p-5">
                                            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                                <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                                                    {article.source?.name || "News"}
                                                </span>

                                                <span className="flex items-center gap-1">
                                                    <CalendarDays size={13} />
                                                    {formatDate(article.publishedAt)}
                                                </span>
                                            </div>

                                            <h3 className="mb-3 line-clamp-2 text-lg font-bold leading-snug text-slate-900">
                                                {article.title || "Untitled article"}
                                            </h3>

                                            <p className="mb-5 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">
                                                {article.description ||
                                                    "Read the full article for more information."}
                                            </p>

                                            {article.url && (
                                                <a
                                                    href={article.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 border-t border-slate-100 pt-4 font-semibold text-blue-700 hover:text-blue-900"
                                                >
                                                    Read Full Story
                                                    <ExternalLink size={16} />
                                                </a>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center">
                                <Newspaper
                                    size={40}
                                    className="mx-auto mb-4 text-slate-400"
                                />
                                <h3 className="text-lg font-semibold text-slate-800">
                                    No news found
                                </h3>
                                <p className="mt-2 text-slate-500">
                                    Try another search term.
                                </p>
                            </div>
                        )}

                        {/* Load More */}
                        {visibleCount < filteredNews.length && (
                            <div className="mt-10 flex justify-center">
                                <button
                                    onClick={() =>
                                        setVisibleCount((count) => count + 9)
                                    }
                                    className="rounded-xl bg-blue-700 px-8 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-800"
                                >
                                    Load More News
                                </button>
                            </div>
                        )}

                        {filteredNews.length > 0 &&
                            visibleCount >= filteredNews.length && (
                                <p className="mt-10 text-center text-sm text-slate-500">
                                    You've reached the end of the available news.
                                </p>
                            )}
                    </>
                )}
            </div>
        </div>
        </>
    );
};

export default News;
