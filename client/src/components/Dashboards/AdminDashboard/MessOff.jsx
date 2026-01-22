import { useState, useEffect, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingBar from 'react-top-loading-bar'
import { useSocket } from "../../../context/SocketContext";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function MessOff() {
  const socket = useSocket();
  const [progress, setProgress] = useState(0);
  const [pendingReqs, setPendingReqs] = useState([]);
  const [approved, setApproved] = useState(0);
  const [rejected, setRejected] = useState(0);

  const fetchData = useCallback(async () => {
    setProgress(30);
    const hostel = JSON.parse(localStorage.getItem("hostel"));
    if (!hostel) return;

    try {
      const res = await fetch(`${API_URL}/api/messoff/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostel: hostel._id }),
      });
      setProgress(60);
      const data = await res.json();

      if (data.success) {
        const formattedList = data.list.map((req) => ({
          ...req,
          id: req._id,
          from: new Date(req.leaving_date).toDateString().slice(4, 10),
          to: new Date(req.return_date).toDateString().slice(4, 10),
        }));

        setPendingReqs(formattedList);
        setApproved(data.approved || 0);
        setRejected(data.rejected || 0);
      }
    } catch (err) {
      console.error("Error fetching mess-off requests:", err);
    }
    setProgress(100);
  }, []);

  const handleAction = async (id, action) => {
    // Find student name before removing
    const studentName = pendingReqs.find((req) => req.id === id)?.student?.name || 'Student';

    // Optimistic UI update - update immediately
    setPendingReqs(prev => prev.filter(req => req.id !== id));
    if (action === 'approved') {
      setApproved(prev => prev + 1);
    } else {
      setRejected(prev => prev + 1);
    }

    try {
      const res = await fetch(`${API_URL}/api/messoff/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: action }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Request from ${studentName} has been ${action}!`, { autoClose: 2000 });
      } else {
        toast.error("Something went wrong - refreshing...");
        fetchData(); // Refresh on error
      }
    } catch (err) {
      toast.error("Failed to update request - refreshing...");
      fetchData(); // Refresh on error
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!socket) return;

    socket.on('messoff:new', (newReq) => {
      const formatted = {
        ...newReq,
        id: newReq._id,
        from: new Date(newReq.leaving_date).toDateString().slice(4, 10),
        to: new Date(newReq.return_date).toDateString().slice(4, 10),
      };
      setPendingReqs(prev => [formatted, ...prev]);
      toast.info(`🍽️ New mess-off request from ${newReq.student?.name}!`, { autoClose: 2000 });
    });

    socket.on('messoff:updated', () => fetchData());

    return () => {
      socket.off('messoff:new');
      socket.off('messoff:updated');
    };
  }, [socket, fetchData]);

  // Calculate percentages
  const pending = pendingReqs.length;
  const total = approved + rejected + pending;
  const approvedPct = total > 0 ? Math.round((approved / total) * 100) : 0;
  const rejectedPct = total > 0 ? Math.round((rejected / total) * 100) : 0;
  const pendingPct = total > 0 ? Math.round((pending / total) * 100) : 0;

  return (
    <div className="w-full min-h-screen flex flex-col gap-6 items-center justify-center py-10 bg-neutral-950">
      <LoadingBar color="#3b82f6" progress={progress} onLoaderFinished={() => setProgress(0)} />

      <h1 className="text-white font-bold text-4xl md:text-5xl">🍽️ Manage Mess-Off</h1>

      {/* Stats Cards - Using direct state values */}
      <div className="flex flex-wrap gap-4 justify-center">
        <div className="bg-gradient-to-br from-green-600 to-green-700 px-8 py-6 rounded-2xl shadow-xl text-center min-w-[150px]">
          <div className="text-4xl font-bold text-white">{approved}</div>
          <div className="text-green-100 mt-1">✅ Approved</div>
          <div className="text-green-200 text-sm">{approvedPct}%</div>
        </div>
        <div className="bg-gradient-to-br from-red-600 to-red-700 px-8 py-6 rounded-2xl shadow-xl text-center min-w-[150px]">
          <div className="text-4xl font-bold text-white">{rejected}</div>
          <div className="text-red-100 mt-1">❌ Rejected</div>
          <div className="text-red-200 text-sm">{rejectedPct}%</div>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-8 py-6 rounded-2xl shadow-xl text-center min-w-[150px]">
          <div className="text-4xl font-bold text-white">{pending}</div>
          <div className="text-blue-100 mt-1">⏳ Pending</div>
          <div className="text-blue-200 text-sm">{pendingPct}%</div>
        </div>
      </div>

      {/* Visual Progress Bar */}
      <div className="w-full max-w-xl px-4">
        <div className="bg-neutral-800 rounded-full h-8 flex overflow-hidden">
          {approvedPct > 0 && (
            <div
              className="bg-green-500 h-full transition-all duration-500 flex items-center justify-center text-xs font-bold text-white"
              style={{ width: `${approvedPct}%` }}
            >
              {approvedPct}%
            </div>
          )}
          {rejectedPct > 0 && (
            <div
              className="bg-red-500 h-full transition-all duration-500 flex items-center justify-center text-xs font-bold text-white"
              style={{ width: `${rejectedPct}%` }}
            >
              {rejectedPct}%
            </div>
          )}
          {pendingPct > 0 && (
            <div
              className="bg-blue-500 h-full transition-all duration-500 flex items-center justify-center text-xs font-bold text-white"
              style={{ width: `${pendingPct}%` }}
            >
              {pendingPct}%
            </div>
          )}
        </div>
        <div className="flex justify-center gap-6 text-xs text-gray-400 mt-2">
          <span className="flex items-center gap-1">🟢 Approved ({approved})</span>
          <span className="flex items-center gap-1">🔴 Rejected ({rejected})</span>
          <span className="flex items-center gap-1">🔵 Pending ({pending})</span>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-neutral-900 px-6 py-5 rounded-2xl shadow-xl w-full max-w-2xl mt-4 max-h-[400px] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <span className="text-white font-bold text-xl">Pending Requests ({pending})</span>
          <button
            onClick={fetchData}
            className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 px-3 py-1 bg-blue-900/30 rounded-lg"
          >
            🔄 Refresh
          </button>
        </div>

        {pending === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">🎉</div>
            <div>No pending requests! All caught up.</div>
          </div>
        ) : (
          <ul className="space-y-3">
            {pendingReqs.map((req) => (
              <li
                key={req.id}
                className="bg-neutral-800 p-4 rounded-xl hover:bg-neutral-700 transition-all"
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-white font-medium">
                      {req.student?.name || 'Student'}
                      <span className="text-gray-400 ml-2 text-sm">
                        Room {req.student?.room_no || 'N/A'}
                      </span>
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      📅 {req.from} → {req.to}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(req.id, "approved")}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-all font-medium"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleAction(req.id, "rejected")}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all font-medium"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick={true}
        rtl={false}
        pauseOnFocusLoss={false}
        draggable={true}
        pauseOnHover={false}
        theme="dark"
      />
    </div>
  );
}

export default MessOff;
