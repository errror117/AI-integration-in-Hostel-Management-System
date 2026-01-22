// import { useEffect, useState } from "react";
// import { Input } from "../../LandingSite/AuthPage/Input";
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// function Complaints() {

//   const [loading, setLoading] = useState(false);

//   const registerComplaint = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     let student = JSON.parse(localStorage.getItem("student"));
//     const complaint = {
//       student: student._id,
//       hostel: student.hostel,
//       title: title,
//       description: desc,
//       type: type,
//     };

//     const res = await fetch(`${API_URL}/api/complaint/register", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(complaint),
//     });

//     const data = await res.json();

//     if (data.success) {
//       setRegComplaints([]);
//       toast.success(
//         "Complaint Registered Successfully!", {
//         position: "top-right",
//         autoClose: 3000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//         progress: undefined,
//         theme: "dark",
//       })
//       setTitle("");
//       setDesc("");
//       setType("Electric");
//     } else {
//       toast.error(
//         data.errors, {
//         position: "top-right",
//         autoClose: 3000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//         progress: undefined,
//         theme: "dark",
//       })
//     }
//     setLoading(false);
//   };

//   const [title, setTitle] = useState("");
//   const [desc, setDesc] = useState("");
//   const [type, setType] = useState("Electric");

//   const types = ["Electric", "Furniture", "Cleaning", "Others"];

//   function chngType(e) {
//     setType(e.target.value);
//   }

//   function titleChange(e) {
//     setTitle(e.target.value);
//   }
//   function descChange(e) {
//     setDesc(e.target.value);
//   }

//   const complaintTitle = {
//     name: "complaint title",
//     placeholder: "Title",
//     req: true,
//     type: "text",
//     value: title,
//     onChange: titleChange,
//   };
//   const complaintType = {
//     name: "complaint type",
//     placeholder: "Type...",
//     req: true,
//     type: "text",
//     value: type,
//     onChange: chngType,
//   };

//   const [regComplaints, setRegComplaints] = useState([]);

//   useEffect(()=> {
//     const student = JSON.parse(localStorage.getItem("student"));
//     const cmpln = { student: student._id };
//     const fetchComplaints = async () => {
//       const res = await fetch(`${API_URL}/api/complaint/student", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify(cmpln),
//       });
//       const data = await res.json();
//       let complaints = data.complaints;
//       complaints = complaints.map((complaint) => {
//         var date = new Date(complaint.date);
//         complaint.date = date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
//         return {
//           title: complaint.title,
//           status: complaint.status,
//           date: complaint.date,
//           type: complaint.type,
//         };
//       });
//       setRegComplaints(data.complaints);
//     }
//     fetchComplaints();
//   }, [regComplaints.length])

//   return (
//     <div className="w-full h-screen flex flex-col gap-10 items-center justify-center md:p-0 px-10 max-h-screen overflow-y-auto pt-80 md:pt-80 lg:p-0">
//       <h1 className="text-white font-bold text-5xl mt-10">Complaints</h1>
//       <div className="flex gap-5 flex-wrap items-center justify-center">
//         <form
//           method="POST"
//           onSubmit={registerComplaint}
//           className="md:w-96 w-full py-5 pb-7 px-10 bg-neutral-950 rounded-lg shadow-xl flex flex-col gap-5"
//         >
//           <div>
//             <label
//               htmlFor="description"
//               className="block mb-2 text-sm font-medium text-white"
//             >
//               Your complaint type
//             </label>
//             <select
//               className="border sm:text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500 outline-none"
//               onChange={chngType}
//             >
//               {types.map((type) => (
//                 <option key={type}>{type}</option>
//               ))}
//             </select>
//             {type.toLowerCase() === "electric" ||
//             type.toLowerCase() === "furniture" ||
//             type.toLowerCase() === "cleaning" ? (
//               <></>
//             ) : (
//               <div className="mt-5">
//                 <Input field={complaintType} />
//               </div>
//             )}
//           </div>
//           <Input field={complaintTitle} />
//           <div>
//             <label
//               htmlFor="description"
//               className="block mb-2 text-sm font-medium text-white"
//             >
//               Your complaint description
//             </label>
//             <textarea
//               name="description"
//               placeholder="Details of complaint"
//               className="border sm:text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500 outline-none"
//               onChange={descChange}
//               value={desc}
//             ></textarea>
//             <button
//               type="submit"
//               className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-800 text-lg rounded-lg px-5 py-2.5 mt-5 text-center"
//               disabled={loading}
//             >
//               {loading ? 'Registering Complaint...':'Register Complaint'}
//             </button>
//             <ToastContainer
//               position="top-right"
//               autoClose={5000}
//               hideProgressBar={false}
//               newestOnTop={false}
//               closeOnClick
//               rtl={false}
//               pauseOnFocusLoss
//               draggable
//               pauseOnHover
//               theme="dark"
//             />
//           </div>
//         </form>
//         <div className="w-full md:w-80 max-w-md max-h-96 p-4 border rounded-lg shadow sm:p-8 bg-neutral-950 border-neutral-900 drop-shadow-xl overflow-y-auto">
//           <div className="flex items-center justify-between mb-4">
//             <h5 className="text-xl font-bold leading-none text-white">
//               Registered Complaints
//             </h5>
//           </div>
//           <div className="flow-root">
//             <ul role="list" className="divide-y divide-gray-700 text-white ">
//               {regComplaints.length === 0
//                 ? "No complaints registered"
//                 : regComplaints.map((complain) => (
//                     <li className="py-3 sm:py-4" key={complain.title}>
//                       <div className="flex items-center space-x-4">
//                         <div className="flex-shrink-0 text-white">
//                           {complain.status.toLowerCase() === "pending" ? (
//                             <svg
//                               xmlns="http://www.w3.org/2000/svg"
//                               fill="none"
//                               viewBox="0 0 24 24"
//                               strokeWidth={2}
//                               stroke="currentColor"
//                               className="w-7 h-7"
//                             >
//                               <path
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                                 d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
//                               />
//                             </svg>
//                           ) : (
//                             <svg
//                               xmlns="http://www.w3.org/2000/svg"
//                               fill="none"
//                               viewBox="0 0 24 24"
//                               strokeWidth={1.5}
//                               stroke="currentColor"
//                               className="w-6 h-6"
//                             >
//                               <path
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                                 d="M4.5 12.75l6 6 9-13.5"
//                               />
//                             </svg>
//                           )}
//                         </div>
//                         <div className="flex-1 min-w-0">
//                           <p className="text-sm font-medium truncate text-white">
//                             {complain.title}
//                           </p>
//                           <p className="text-sm truncate text-gray-400">
//                             {complain.date}
//                           </p>
//                         </div>
//                         <div className="flex flex-col items-center text-base font-semibold text-white">
//                           {complain.type}
//                         </div>
//                       </div>
//                     </li>
//                   ))}
//             </ul>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Complaints;
import { useEffect, useState, useRef } from "react";
import { Input } from "../../LandingSite/AuthPage/Input";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { useSocket } from "../../../context/SocketContext";
import { uploadComplaintAttachments } from "../../../utils/uploadService";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function Complaints() {
  const socket = useSocket();
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState(null);
  const [regComplaints, setRegComplaints] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [type, setType] = useState("Electric");

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const fileInputRef = useRef(null);

  const types = ["Electric", "Furniture", "Cleaning", "Others"];

  useEffect(() => {
    const studentData = JSON.parse(localStorage.getItem("student"));
    if (!studentData || !studentData._id) {
      setStudent(null);
      return;
    }

    setStudent(studentData);
    fetchComplaints(studentData._id);
  }, []);

  useEffect(() => {
    if (!socket || !student) return;

    socket.on('complaint:updated', (updatedComplaint) => {
      // Update local state if the complaint belongs to this student
      setRegComplaints(prev => prev.map(c =>
        c._id === updatedComplaint._id ? { ...c, status: updatedComplaint.status } : c
      ));
      toast.info(`Complaint status updated: ${updatedComplaint.status}`, { theme: "dark" });
    });

    return () => {
      socket.off('complaint:updated');
    };
  }, [socket, student]);

  const fetchComplaints = async (studentId) => {
    try {
      const res = await fetch(`${API_URL}/api/complaint/student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ student: studentId }),
      });
      const data = await res.json();
      if (data.success) {
        let complaints = data.complaints.map((c) => ({
          ...c,
          date: new Date(c.date).toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
        }));
        setRegComplaints(complaints);
      }
    } catch (error) {
      console.error("Error fetching complaints", error);
    }
  };

  const registerComplaint = async (e) => {
    e.preventDefault();
    if (!student || !student._id) return;

    setLoading(true);

    try {
      // Step 1: Upload files if any are selected
      let attachmentUrls = [];
      if (selectedFiles.length > 0) {
        toast.info('Uploading attachments...', { theme: 'dark', autoClose: 1000 });
        const uploadResponse = await uploadComplaintAttachments(selectedFiles);
        attachmentUrls = uploadResponse.files || [];
      }

      // Step 2: Register complaint with file URLs
      const complaint = {
        student: student._id,
        hostel: student.hostel,
        title,
        description: desc,
        type,
        attachments: attachmentUrls // Include uploaded file URLs
      };

      const res = await fetch(`${API_URL}/api/complaint/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(complaint),
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Complaint Registered Successfully!", { theme: "dark" });
        setTitle("");
        setDesc("");
        setType("Electric");
        setSelectedFiles([]);
        setFilePreviews([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchComplaints(student._id);  // refresh list
      } else {
        toast.error(data.errors || "Something went wrong.", { theme: "dark" });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.message || "Error registering complaint", { theme: "dark" });
    }

    setLoading(false);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    // Validate number of files (max 5)
    if (files.length > 5) {
      toast.error('Maximum 5 files allowed', { theme: 'dark' });
      return;
    }

    // Validate file sizes (max 5MB each)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = files.filter(file => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      toast.error('Each file must be less than 5MB', { theme: 'dark' });
      return;
    }

    setSelectedFiles(files);

    // Generate previews for images
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setFilePreviews(newPreviews);
  };

  // Remove a file from selection
  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = filePreviews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setFilePreviews(newPreviews);
  };

  const complaintTitle = {
    name: "complaint title",
    placeholder: "Title",
    req: true,
    type: "text",
    value: title,
    onChange: (e) => setTitle(e.target.value),
  };
  const complaintType = {
    name: "complaint type",
    placeholder: "Type...",
    req: true,
    type: "text",
    value: type,
    onChange: (e) => setType(e.target.value),
  };

  if (!student) {
    return (
      <div className="text-white p-10 text-center">
        No student data found. Please login again.
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col gap-10 items-center justify-center md:p-0 px-10 max-h-screen overflow-y-auto pt-80 md:pt-80 lg:p-0">
      <h1 className="text-white font-bold text-5xl mt-10">Complaints</h1>
      <div className="flex gap-5 flex-wrap items-center justify-center">
        <form
          method="POST"
          onSubmit={registerComplaint}
          className="md:w-96 w-full py-5 pb-7 px-10 bg-neutral-950 rounded-lg shadow-xl flex flex-col gap-5"
        >
          <div>
            <label className="block mb-2 text-sm font-medium text-white">
              Your complaint type
            </label>
            <select
              className="border sm:text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500 outline-none"
              onChange={(e) => setType(e.target.value)}
              value={type}
            >
              {types.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>

            {["electric", "furniture", "cleaning"].includes(
              type.toLowerCase()
            ) ? null : (
              <div className="mt-5">
                <Input field={complaintType} />
              </div>
            )}
          </div>

          <Input field={complaintTitle} />
          <div>
            <label className="block mb-2 text-sm font-medium text-white">
              Your complaint description
            </label>
            <textarea
              name="description"
              placeholder="Details of complaint"
              className="border sm:text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500 outline-none"
              onChange={(e) => setDesc(e.target.value)}
              value={desc}
            ></textarea>

            {/* File Upload Section */}
            <div className="mt-4">
              <label className="block mb-2 text-sm font-medium text-white">
                📎 Attach Images (Optional)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-400 border border-gray-600 rounded-lg cursor-pointer bg-gray-700 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-400">
                Max 5 images, 5MB each
              </p>

              {/* File Previews */}
              {selectedFiles.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {filePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded border-2 border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {selectedFiles[index].name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-800 text-lg rounded-lg px-5 py-2.5 mt-5 text-center"
              disabled={loading}
            >
              {loading ? "Registering Complaint..." : "Register Complaint"}
            </button>
            <ToastContainer theme="dark" />
          </div>
        </form>

        <div className="w-full md:w-80 max-w-md max-h-96 p-4 border rounded-lg shadow sm:p-8 bg-neutral-950 border-neutral-900 drop-shadow-xl overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-xl font-bold leading-none text-white">
              Registered Complaints
            </h5>
          </div>
          <ul role="list" className="divide-y divide-gray-700 text-white">
            {regComplaints.length === 0 ? (
              <p className="text-gray-500 text-sm">No complaints registered</p>
            ) : (
              regComplaints.map((c, i) => (
                <li className="py-3 sm:py-4" key={i}>
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 text-white">
                      {c.status.toLowerCase() === "pending" ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                          className="w-7 h-7"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-white">
                        {c.title}
                      </p>
                      <p className="text-sm truncate text-gray-400">{c.date}</p>
                    </div>
                    <div className="text-sm text-white font-semibold">
                      {c.type}
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Complaints;
