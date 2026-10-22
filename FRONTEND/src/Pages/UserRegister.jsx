import { motion } from "motion/react";
import Input from "../Components/Register/InputConponents";
import {
    Book,
    FlaskConical,
    GraduationCap,
    Loader,
    Lock,
    Mail,
    Rocket,
    User
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import faculty from "../Image/robot1.jpg";
import logo from '../Image/FBLOGO.jpg';
import { useAuthStore } from "../Store/AuthStore";

const UserRegister = () => {

    const navigate = useNavigate();

    const initialValues = {
        username: "",
        email: "",
        matricNumber: "",
        password: "",
        confirmPassword: "",
        level: "",
        department: ""
    };

    const [formValues, setFormvalues] = useState(initialValues);
    const [formErrors, setFormErrors] = useState({});
    const [isSubmit, setIsSubmit] = useState(false);
    const [ serverError, setServerError ] = useState();

    const { signup, isLoading, error } = useAuthStore();


    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormvalues({...formValues, [name]: value});
    };


    // Validation
    const validate = (values) => {

        const errors = {};

        if (!values.username) {
            errors.username = "Username is required";
        }

        if (!values.email) {
            errors.email = "Email is required";
        }

        if (!values.password) {
            errors.password = "Password is required";
        }

        if (!values.confirmPassword) {
            errors.confirmPassword = "Please confirm your password";
        }

        if (
            values.password &&
            values.confirmPassword &&
            values.password !== values.confirmPassword
        ) {
            errors.confirmPassword = "Passwords do not match";
        }

        if (!values.matricNumber) {
            errors.matricNumber = "Matric Number is required";
        }

        if (!values.department) {
            errors.department = "Department is required";
        }

        if (!values.level) {
            errors.level = "Level is required";
        }

        return errors;
    };


    // Handle form submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        

        if (isLoading) {
            return;
        }

        const errors = validate(formValues);

        setFormErrors(errors);
        setIsSubmit(true);

        if (Object.keys(errors).length > 0) {
            return;
        }
        

        try {
            await signup(
                formValues.email,
                formValues.password,
                formValues.confirmPassword,
                formValues.username,
                formValues.department,
                formValues.matricNumber,
                formValues.level
            );

            console.log("Registration successful");

            navigate("/verify-email", {
                state: { email: formValues.email }
            })

            

        } catch (error) {
            console.log("STATUS:", error.response?.status);
            console.log("DATA:", error.response?.data);
            console.log("MESSAGE:", error.response?.data?.message);

            setServerError(error.response?.data?.message || "Something went wrong");
            console.log(error)
            
        }
    };


    return (

        <div className="relative min-h-screen w-full bg-gray-100 flex items-center justify-center p-5">

            <motion.div
                initial={{ opacity: 0, y: 33 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.88 }}
                className="flex w-full max-w-5xl overflow-hidden mt-15 rounded-lg bg-white c"
            >

                <div className="relative hidden md:block w-1/2 min-h-[700px] overflow-hidden">

                    <img
                        src={faculty}
                        alt="Faculty of Engineering"
                        className="absolute inset-0 h-full w-full object-cover"
                    />

                    {/* Dark overlay */}

                    <div className="absolute inset-0 bg-linear-to-t from-blue-950 via-black/30 to-blue-600"></div>


                    <div className="absolute inset-0 px-10 text-white flex flex-col justify-between">

                        <div className="flex flex-col mt-5">

                            <div>

                                <img
                                    className="size-19 rounded-full mr-3"
                                    src={logo}
                                    alt="Faculty Logo"
                                />

                            </div>


                            <div className="mb-8">

                                <h1 className="font-bold leading-6">
                                    FACULTY OF <br /><span className="text-[22px]">ENGINEERING</span>
                                </h1>

                                <p className="text-amber-500 text-[13px] font-bold">
                                    Excellence. Innovation. Impact
                                </p>

                            </div>


                            <div>

                                <h1 className="font-bold text-[20px]">
                                    Join a Community <br />of Innovators and <br /> problem solvers.
                                </h1>

                                <p>
                                    Register with us for free and get <br /><span className="text-amber-500 text-[22px] font-bold">STARTED</span>
                                </p>

                            </div>

                        </div>


                        <div className="mb-3 flex flex-col gap-3">

                            <div className="flex items-center gap-3">

                                <div>

                                    <GraduationCap className="size-15 border rounded-lg border-amber-500 text-amber-500" />

                                </div>

                                <div>

                                    <h2 className="font-bold">
                                        Quality Education
                                    </h2>

                                    <p className="text-[13px]">
                                        Learn form experience <br />lecturers and indutry experts
                                    </p>

                                </div>

                            </div>


                            <div className="flex items-center gap-3">

                                <div>

                                    <FlaskConical className="size-15 border rounded-lg border-amber-500 text-amber-500" />

                                </div>

                                <div>

                                    <h2 className="font-bold">
                                        Modern Facilities
                                    </h2>

                                    <p className="text-[13px]">
                                        Access State-of-the-art-labes<br />and learning resources
                                    </p>

                                </div>

                            </div>


                            <div className="flex items-center gap-3">

                                <div>

                                    <Rocket className="size-15 border rounded-lg border-amber-500 text-amber-500" />

                                </div>

                                <div>

                                    <h2 className="font-bold">
                                        Innovative Research
                                    </h2>

                                    <p className="text-[13px]">
                                        Be part of cutting-edge research<br />and real-world solutions
                                    </p>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                <div className="w-full md:w-1/2 p-6 md:p-8">

                    <form onSubmit={handleSubmit}>
                        <fieldset
                            disabled={isLoading}
                            className="min-w-0"
                        >
                            {/* Heading */}

                            <h1
                                className="text-blue-950 text-center text-[23px] font-bold relative after:absolute after:bg-amber-500 after:top-9 after:left-1/2 after:-translate-x-1/2 after:rounded-lg after:w-15 after:h-1 mb-6"
                            >
                                Register
                            </h1>


                            {/* Username */}

                            <Input
                                inputLabel="Username"
                                icon={User}
                                type="text"
                                name="username"
                                value={formValues.username}
                                onChange={handleChange}
                                placeholder="Enter your Username"
                            />

                            <p className="text-red-500 text-[12px] mt-0">
                                {formErrors.username}
                            </p>


                            {/* Email */}

                            <Input
                                inputLabel="Email"
                                icon={Mail}
                                type="email"
                                placeholder="example@gmail.com"
                                name="email"
                                value={formValues.email}
                                onChange={handleChange}
                            />

                            <p className="text-red-500 text-[12px] mt-0">
                                {formErrors.email}
                            </p>


                            {/* Matric Number */}

                            <Input
                                inputLabel="Matric Number"
                                icon={GraduationCap}
                                type="text"
                                placeholder="FUO/xx/xxx/xxxxx"
                                name="matricNumber"
                                value={formValues.matricNumber}
                                onChange={handleChange}
                            />

                            <p className="text-red-500 text-[12px] mt-0">
                                {formErrors.matricNumber}
                            </p>


                            {/* Password */}

                            <Input
                                inputLabel="Password"
                                icon={Lock}
                                type="password"
                                placeholder="Enter password"
                                name="password"
                                value={formValues.password}
                                onChange={handleChange}
                            />

                            <p className="text-red-500 text-[12px] mt-0">
                                {formErrors.password}
                            </p>


                            {/* Confirm Password */}

                            <Input
                                inputLabel="Confirm Password"
                                icon={Lock}
                                type="password"
                                placeholder="Confirm password"
                                name="confirmPassword"
                                value={formValues.confirmPassword}
                                onChange={handleChange}
                            />

                            <p className="text-red-500 text-[12px] mt-0">
                                {formErrors.confirmPassword}
                            </p>


                            {/* Department */}

                            <div className="mb-4">

                                <label className="block pl-3 mb-1 text-blue-950">
                                    Select Department
                                </label>


                                <select
                                    className="w-full rounded-lg py-2 pl-3 pr-3 bg-gray-50 border border-gray-200 outline-none transition duration-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
                                    name="department"
                                    onChange={handleChange}
                                    value={formValues.department}
                                >

                                    <option value="">
                                        Select Department
                                    </option>

                                    <option value="Mechatronics Engineering">
                                        Mechatronics Engineering
                                    </option>

                                    <option value="Mechanical">
                                        Mechanical Engineering
                                    </option>

                                    <option value="Electrical Electronics Engineering">
                                        Electrical Electronics Engineering
                                    </option>

                                    <option value="Civil Engineering">
                                        Civil Engineering
                                    </option>

                                    <option value="Chemical Engineering">
                                        Chemical Engineering
                                    </option>

                                    <option value="Petroleum and Gas Engineering"   >
                                        Petroleum and Gas Engineering
                                    </option>

                                </select>

                                <p className="text-red-500 text-[12px] mt-0">
                                    {formErrors.department}
                                </p>

                            </div>


                            {/* Level */}

                            <label className="block pl-3 mb-1 text-blue-950">
                                Select Level
                            </label>


                            <div className="w-full rounded-lg py-2 pr-3 mb-3 bg-gray-50">

                                <select
                                    className="w-full rounded-lg py-2 pl-3 pr-3 bg-gray-50 border border-gray-200 outline-none transition duration-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500"
                                    name="level"
                                    onChange={handleChange}
                                    value={formValues.level}
                                >

                                    <option value="">
                                        Select level
                                    </option>

                                    <option value="100">
                                        100
                                    </option>

                                    <option value="200">
                                        200
                                    </option>

                                    <option value="300">
                                        300
                                    </option>

                                    <option value="400">
                                        400
                                    </option>

                                    <option value="500">
                                        500
                                    </option>

                                </select>

                                <p className="text-red-500 text-[12px] mt-0">
                                    {formErrors.level}
                                </p>

                            </div>


                            {/* Register Button */}

                            <motion.button
                                type="submit"
                                disabled={isLoading}
                                whileHover={isLoading ? undefined : { scale: 1.02 }}
                                className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 bg-blue-900 text-white ${isLoading ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:bg-blue-950 hover:scale-[1.02] hover:shadow-lg"}`}
                            >

                                {isLoading ? (
                                    <>
                                        <Loader className="animate-spin inline-block mr-2" size={20} />
                                        Registering...
                                    </>
                                ) : (
                                    "Register"
                                )}

                            </motion.button>

                            <p>{serverError}</p>


                            {/* Backend Error */}

                            {error && (
                                <p className="text-red-500 text-[12px] text-center mt-2">
                                    {error}
                                </p>
                            )}


                            {/* Login */}

                            <div className="flex items-center justify-space-around">

                                <p className="mb-2">
                                    Already Have an account?
                                </p>

                                
                                <NavLink className="text-blue-500">
                                    to="/login"
                                    Login
                                </NavLink>

                            </div>
                        </fieldset>         
                    </form>

                </div>

            </motion.div>

        </div>
    );
};

export default UserRegister;