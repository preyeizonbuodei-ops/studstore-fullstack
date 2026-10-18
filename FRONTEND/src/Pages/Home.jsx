
import Engineering from '../Image/BG.jpg'
import Navbar from '../Components/Navbar';
import Data from '../Components/Data';
import Call from '../Components/Call';
import { ArrowRight, Cog, RobotArm, HardHat, Zap, Fuel, FlaskConical, Bot, BrainCog, Landmark, Cpu, Factory, Wifi, Wrench, BookCheck, NotebookPen, Megaphone, CalendarDays, SearchSlash, TvMinimalPlay, FilePlus, UserRoundPen, Heart } from 'lucide-react';

import Action from '../Components/Action';
import Laboratory from '../Components/Laboratory';
import Lab1 from '../Image/lab1.jpg'
import Lab2 from '../Image/lab2.jpg'
import Lab3 from '../Image/lab3.jpg'

import Student from '../Components/Student';
import { motion } from "motion/react";
import Message from '../Components/Message';
import Foot from '../Components/Foot';
import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import DepartmentComponent from './DepartmentComponent';

const Home = () => {
    const [news, setNews] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loadingNews, setLoadingNews] = useState(true);
    const [newsError, setNewsError] = useState(false);

    const articlesPerPage = 4;

    const indexOfLastArticle = currentPage * articlesPerPage;
    const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;

    const currentArticles = news.slice(
        indexOfFirstArticle,
        indexOfLastArticle
    );

    const getNews = async () => {
        setLoadingNews(true);
        setNewsError(false);

        try {
            const response = await axios.get(
                'https://studstore-fullstackstudstore-backend.onrender.com/api/v1/users/get-news'
            );

            if (response.data.success && Array.isArray(response.data.data.articles)) {
                setNews(response.data.data.articles);
                setCurrentPage(1);
            } else {
                setNewsError(true);
            }
        } catch (error) {
            console.error("Failed to fetch news:", error);
            setNewsError(true);
        } finally {
            setLoadingNews(false);
        }
    };

    useEffect(() => {
        getNews();
    }, []);

    return (
        <>
            <div className="relative h-screen w-full overflow-hidden">
                {/* Background image */}
                <img
                    src={Engineering}
                    alt="engineering faculty"
                    className="absolute inset-0 h-full w-full object-cover"
                />

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-linear-to-r from-black via-black/50 to-transparent"></div>

                {/* Navbar */}
                <div className="relative z-30">
                    <Navbar />
                </div>

                {/* Hero content */}
                <div className="relative z-20 flex h-[calc(100vh-80px)] items-center">
                    <motion.div
                        className="mx-5 max-w-xl text-white sm:mx-8 md:ml-16 lg:ml-20"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ amount: 0.0 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                    >
                        <h1 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
                            Building the Future
                            <br />
                            <span className="text-amber-500">
                                Through Innovation
                            </span>
                        </h1>

                        <p className="mt-4 text-base text-gray-200 sm:mt-5 sm:text-lg">
                            Pioneering innovation and developing solutions for a better
                            tomorrow through excellence in engineering education and
                            research.
                        </p>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-3"
                        >
                            <NavLink
                                to="/department"
                                className="flex items-center justify-center rounded-lg bg-amber-500 px-5 py-3 font-semibold text-white transition duration-500 hover:bg-blue-700 sm:px-6"
                            >
                                Explore Programs
                            </NavLink>

                            <NavLink
                                to="/register"
                                className="flex items-center justify-center gap-3 rounded-lg border px-5 py-3 font-semibold text-white transition duration-300 hover:translate-x-2 sm:px-6"
                            >
                                Register Now
                                <ArrowRight className="size-5" />
                            </NavLink>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            <Data />
            <Call />

            <h2 className="relative mx-auto mt-12 mb-6 w-fit text-center font-bold after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-full after:bg-amber-500">
                OUR DEPARTMENTS
            </h2>

            <DepartmentComponent />

            <div className="mb-13 mr-10 ml-10 bg-blue-950">
                <div>
                    <h1 className="relative mx-auto mt-12 mb-4 w-fit pt-4 pb-4 text-center font-bold text-white after:absolute after:-bottom-0 after:left-15 after:h-[2px] after:w-22 after:bg-amber-500">
                        RESEARCH AND INNOVATION
                    </h1>
                </div>

                <div className="mx-6 flex flex-wrap items-start justify-center gap-6">
                    <div className="flex w-[140px] justify-center">
                        <Action image={Bot} description="Robotics and Automation" />
                    </div>

                    <div className="flex w-[140px] justify-center">
                        <Action image={Zap} description="Renewable Energy" />
                    </div>

                    <div className="flex w-[140px] justify-center">
                        <Action image={BrainCog} description="Artificial Intelligence" />
                    </div>

                    <div className="flex w-[140px] justify-center">
                        <Action image={Landmark} description="Structural Engineering" />
                    </div>

                    <div className="flex w-[140px] justify-center">
                        <Action image={Cpu} description="Embeded Systems" />
                    </div>

                    <div className="flex w-[140px] justify-center">
                        <Action image={Factory} description="Manufacturing Technology" />
                    </div>

                    <div className="flex w-[140px] justify-center">
                        <Action image={Wifi} description="Telecommunication" />
                    </div>

                    <div className="flex w-[140px] justify-center">
                        <Action image={Wrench} description="Substainable Engineering" />
                    </div>
                </div>

                <div className="mb-2 mt-2 flex justify-center">
                    <NavLink
                        to="/research"
                        className="mb-4 flex cursor-pointer gap-3 rounded-sm bg-amber-500 pt-2 pb-2 pr-6 pl-6 text-center text-white transition duration-300 hover:bg-blue-700"
                    >
                        Explore And Research Today <ArrowRight />
                    </NavLink>
                </div>
            </div>

            <div className="mr-2 ml-2 grid grid-cols-1 gap-3 md:mr-14 md:ml-14 md:grid-cols-3 lg:grid-cols-3">
                <div>
                    <h2 className="relative mx-auto mt-12 mb-6 w-fit text-center font-bold after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-full after:bg-amber-500">
                        LABORATORIES AND FACILITIES
                    </h2>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                        <div className="cursor-pointer shadow-[0_2px_12px_rgba(0,0,0,0.12)] transition duration-500 hover:translate-1.5">
                            <Laboratory
                                image={Lab1}
                                heading="Chemical Laboratory"
                                description="Advanced Chemical And Chemistry Lab"
                            />
                        </div>

                        <div className="cursor-pointer shadow-[0_2px_12px_rgba(0,0,0,0.12)] transition duration-500 hover:translate-1.5">
                            <Laboratory
                                image={Lab2}
                                heading="Research Lab"
                                description="Modern Research energy lab"
                            />
                        </div>

                        <div className="cursor-pointer shadow-[0_2px_12px_rgba(0,0,0,0.12)] transition duration-500 hover:translate-1.5">
                            <Laboratory
                                image={Lab3}
                                heading="Mechatronics Lab"
                                description="High Performance and indutrial automation Lab"
                            />
                        </div>
                    </div>

                    <div className="text-blue-500">
                        <NavLink
                            className="flex items-center justify-center gap-6 bg-white p-22 pt-7 pb-7 pr-6 pl-6 shadow-[0_2px_12px_rgba(0,0,0,0.12)]"
                            to="#"
                        >
                            view all Facilitie <ArrowRight />
                        </NavLink>
                    </div>
                </div>

                {/* News */}
                <div>
                    <h1 className="relative mx-auto mt-12 mb-6 w-fit text-center font-bold after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-full after:bg-amber-500">
                        News And Latest Events
                    </h1>

                    <div className="mt-5 flex flex-col gap-6">
                        {loadingNews ? (
                            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-center">
                                <p className="text-sm text-gray-500">
                                    Fetching latest news...
                                </p>
                            </div>
                        ) : newsError ? (
                            <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-8 text-center">
                                <p className="text-sm font-semibold text-red-600">
                                    News fetching failed. Try again.
                                </p>

                                <button
                                    type="button"
                                    onClick={getNews}
                                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : currentArticles.length === 0 ? (
                            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-8 text-center">
                                <p className="text-sm text-gray-500">
                                    No news articles available right now.
                                </p>

                                <button
                                    type="button"
                                    onClick={getNews}
                                    className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                                >
                                    Refresh News
                                </button>
                            </div>
                        ) : (
                            currentArticles.map((article) => (
                                <div
                                    className="flex flex-col gap-3 sm:flex-row sm:items-start"
                                    key={article.url}
                                >
                                    <div className="shrink-0">
                                        {article.urlToImage ? (
                                            <img
                                                className="h-20 w-full rounded-lg object-cover sm:w-32"
                                                src={article.urlToImage}
                                                alt={article.title || "News article"}
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="flex h-20 w-full items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400 sm:w-32">
                                                No image
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h2 className="font-bold">
                                            {article.title}
                                        </h2>

                                        <p className="text-[12px] text-gray-500">
                                            {article.description
                                                ? article.description.slice(0, 90) +
                                                  (article.description.length > 90 ? "..." : "")
                                                : "No description available"}
                                        </p>

                                        <a
                                            href={article.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-2 inline-block text-[12px] text-blue-500 hover:underline"
                                        >
                                            See More
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Students */}
                <div>
                    <div>
                        <h1 className="mt-12 mb-6 text-center font-bold">
                            STUDENT RESOURCES
                        </h1>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
                        <div className="p-6 shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
                            <div className="flex cursor-pointer flex-col items-center justify-center transition duration-500 hover:translate-1.5">
                                <Student image={BookCheck} text="Course Materials" />
                            </div>
                        </div>

                        <div className="p-6 shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
                            <div className="flex cursor-pointer flex-col items-center justify-center transition duration-500 hover:translate-1.5">
                                <Student image={NotebookPen} text="Assignment" />
                            </div>
                        </div>

                        <div className="p-6 shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
                            <div className="flex cursor-pointer flex-col items-center justify-center transition duration-500 hover:translate-1.5">
                                <Student image={Megaphone} text="Announcements" />
                            </div>
                        </div>

                        <div className="p-6 shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
                            <div className="flex cursor-pointer flex-col items-center justify-center transition duration-500 hover:translate-1.5">
                                <Student image={CalendarDays} text="Academic Calender" />
                            </div>
                        </div>

                        <div className="p-6 shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
                            <div className="flex cursor-pointer flex-col items-center justify-center transition duration-500 hover:translate-1.5">
                                <Student image={SearchSlash} text="venue Booking" />
                            </div>
                        </div>

                        <div className="p-6 shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
                            <div className="flex cursor-pointer flex-col items-center justify-center transition duration-500 hover:translate-1.5">
                                <Student image={TvMinimalPlay} text="Learning Videos" />
                            </div>
                        </div>

                        <div className="p-6 shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
                            <div className="flex cursor-pointer flex-col items-center justify-center transition duration-500 hover:translate-1.5">
                                <Student image={Heart} text="Documents" />
                            </div>
                        </div>

                        <div className="p-6 shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
                            <div className="flex cursor-pointer flex-col items-center justify-center transition duration-500 hover:translate-1.5">
                                <Student image={UserRoundPen} text="Lecturer Directory" />
                            </div>
                        </div>
                    </div>

                    <NavLink
                        className="mt-3 flex w-full cursor-pointer justify-center gap-6 rounded-sm bg-blue-950 py-3 text-white transition duration-500 hover:bg-blue-700 md:mt-5 md:mb-5 md:w-fit md:justify-start md:pt-2 md:pb-2 md:pr-12 md:pl-12"
                        to="/me"
                    >
                        Go to student Portal <ArrowRight />
                    </NavLink>
                </div>
            </div>

            <Message />
            <Foot />
        </>
    );
};

export default Home;
