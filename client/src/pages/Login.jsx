import { useContext, useRef, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Context } from "../context/Context";
import ReCAPTCHA from "react-google-recaptcha";

const Login = () => {
  const [error, setError] = useState(null);
  const { setToken, setIsAdmin, setUserId, setUsername } = useContext(Context);
  const navigate = useNavigate();
  const [formdata, setFormdata] = useState({ email: "", password: "" });
  const [captcha, setcaptcha] = useState(null);
  const recaptchaRef = useRef(null); // Reference for ReCAPTCHA

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormdata((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const onChange = (token) => {
    setcaptcha(token);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!captcha) {
      setError("Please complete the CAPTCHA.");
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_DOMAIN_URL}/user/login`,
        { ...formdata, captcha }
      );

      if (response.status === 200) {
        setToken(response.data.token);
        setIsAdmin(response.data.role === "admin");
        setUserId(response.data.userId);
        setUsername(response.data.username)
        navigate("/profile");

        // Reset form and CAPTCHA
        setFormdata({ email: "", password: "" });
        recaptchaRef.current.reset(); // Reset the CAPTCHA
        setcaptcha(null);
        setError(null);
      }
    } catch (error) {
      setError("Login failed. Please check your credentials and complete the CAPTCHA.");
      
      // Reset CAPTCHA on error
      recaptchaRef.current.reset();
      setcaptcha(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-black text-white mt-8 p-8 rounded-lg shadow-lg w-full sm:max-w-md">
          <h2 className="text-3xl font-semibold mb-4 text-center">Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium">
                Email address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formdata.email}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your email address"
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formdata.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-black border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your password"
                required
              />
            </div>
            <div className="text-center">
              <p>
                Do not have an account?{" "}
                <Link to="/signup" className="text-blue-800">
                  Create Account
                </Link>
              </p>
              <br />
              <div className="flex justify-center mb-4">
                <ReCAPTCHA
                  sitekey="6LfbWyQqAAAAAO-wxpIGYePTgjBqBIJOiaU_VRig"
                  onChange={onChange}
                  ref={recaptchaRef} // Assign ref to ReCAPTCHA
                />
              </div>
              <button
                type="submit"
                className="bg-purple-900 hover:bg-purple-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                Login
              </button>
            </div>
          </form>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default Login;