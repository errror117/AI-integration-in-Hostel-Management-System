import { Input } from "./Input";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { verifysession } from "../../../utils/";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Loader } from "../../Dashboards/Common/Loader";

export default function SignIn() {
  let navigate = useNavigate();

  // Clear any old tokens on component mount for student login
  useEffect(() => {
    // Always clear tokens when visiting student login page
    localStorage.removeItem('token');
    localStorage.removeItem('student');
    localStorage.removeItem('user');
    localStorage.removeItem('hostel');
    sessionStorage.removeItem('justCleared');
  }, []);

  let login = async (event) => {
    event.preventDefault();
    setLoader(true);
    let data = {
      email: email,
      password: pass,
    };

    let response = await fetch(window.API_BASE_URL + "/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data)
    });

    let result = await response.json();

    if (result.success) {
      localStorage.setItem("token", result.data.token);
      let student = await fetch(window.API_BASE_URL + "/api/student/get-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isAdmin: result.data.user.isAdmin,
          token: result.data.token
        })
      });

      let studentResult = await student.json();
      if (studentResult.success) {
        localStorage.setItem("student", JSON.stringify(studentResult.student));
        navigate("/student-dashboard");
      } else {
        // console.log(studentResult.errors)
      }
    } else {
      // alert(result.errors[0].msg);
      toast.error(
        result.errors[0].msg, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      })
    }
    setLoader(false);
  };

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loader, setLoader] = useState(false)

  const changeEmail = (event) => {
    setEmail(event.target.value);
  };
  const changePass = (event) => {
    setPass(event.target.value);
  };

  const iemail = {
    name: "email",
    type: "email",
    placeholder: "abc@gmail.com",
    req: true,
    onChange: changeEmail,
  };
  const password = {
    name: "password",
    type: "password",
    placeholder: "••••••••",
    req: true,
    onChange: changePass,
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      {/* Animated gradient orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      {/* Login Card */}
      <div className="w-full max-w-md mx-4 relative z-10">
        <div className="bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-gray-700/50">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome <span className="text-blue-400">Back</span>
            </h1>
            <p className="text-gray-300">Sign in to your hostel account</p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={login}>
            <Input field={iemail} />
            <Input field={password} />

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="remember"
                    aria-describedby="remember"
                    type="checkbox"
                    className="w-4 h-4 border rounded focus:ring-3 bg-gray-700 border-gray-600 focus:ring-blue-600 ring-offset-gray-800"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="remember" className="text-gray-300">
                    Remember me
                  </label>
                </div>
              </div>
              <Link to="/auth/forgot-password" className="text-blue-500 hover:text-blue-400 transition">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105 focus:ring-4 focus:ring-blue-500/50 flex items-center justify-center"
              disabled={loader}
            >
              {loader ? (
                <>
                  <Loader /> <span className="ml-2">Verifying...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
            />

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-800 text-gray-400">OR</span>
              </div>
            </div>

            <p className="text-sm text-center text-gray-400">
              Don't have an account yet?{" "}
              <Link
                to="/auth/request"
                className="font-medium text-blue-500 hover:text-blue-400 transition"
              >
                Request an account
              </Link>
            </p>
          </form>

          {/* Footer badges */}
          <div className="mt-8 pt-6 border-t border-gray-700/50">
            <div className="flex justify-center gap-3 flex-wrap">
              <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">
                🤖 AI Powered
              </span>
              <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">
                🔒 Secure
              </span>
              <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-xs rounded-full border border-purple-500/20">
                ⚡ Fast
              </span>
            </div>
          </div>
        </div>

        {/* Back to home link */}
        <div className="text-center mt-6">
          <Link to="/" className="text-gray-400 hover:text-white transition text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* Add blob animation to App.css if not already there */}
      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
