import { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { useSocket } from "../../../context/SocketContext";
import { toast } from "react-toastify";

const List = ({ invoiceList }) => {
  return (
    <div className="w-full max-w-md p-4 rounded-lg shadow sm:p-8 bg-neutral-950 drop-shadow-xl overflow-y-auto max-h-70">
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-xl font-bold leading-none text-white">
          Unpaid Invoices
        </h5>
      </div>
      <div className="flow-root">
        <ul role="list" className="divide-y divide-gray-700">
          {invoiceList.length === 0 ? (
            <p className="text-gray-400">No pending invoices</p>
          ) : (
            invoiceList.map((invoice, index) => (
              <li className="py-3 sm:py-4" key={index}>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 text-white">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-8 h-8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={
                          invoice.status?.toLowerCase() === "pending"
                            ? "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                            : "M4.5 12.75l6 6 9-13.5"
                        }
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-white">
                      {invoice.title}
                    </p>
                    <p className="text-sm truncate text-gray-400">
                      {invoice.date}
                    </p>
                  </div>
                  <div className="flex flex-col items-center text-base font-semibold text-white">
                    {invoice.amount}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

function Home() {
  const socket = useSocket();
  const [student, setStudent] = useState(null);
  const [daysOff, setDaysOff] = useState(0);
  const [invoiceList, setInvoiceList] = useState([]);

  useEffect(() => {
    const localStudent = JSON.parse(localStorage.getItem("student"));
    setStudent(localStudent);

    if (!localStudent?._id) return;

    // Fetch attendance
    const fetchAttendance = async () => {
      const res = await fetch(window.API_BASE_URL + "/api/attendance/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student: localStudent._id }),
      });
      const data = await res.json();
      if (data.success) {
        const offCount = data.attendance.filter(
          (day) => day.status === "absent"
        ).length;
        setDaysOff(offCount);
      }
    };

    fetchAttendance();

    // Fetch invoices
    fetch(window.API_BASE_URL + "/api/invoice/student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ student: localStudent._id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const list = data.invoices
            .filter((invoice) => invoice.status.toLowerCase() === "pending")
            .map((invoice) => ({
              _id: invoice._id,
              title: invoice.title || "Mess Bill",
              amount: "Rs. " + invoice.amount,
              status: invoice.status,
              date: new Date(invoice.date).toLocaleDateString("en-US", {
                day: "numeric",
                month: "long",
                year: "numeric",
              }),
            }));
          setInvoiceList(list);
        }
      });
  }, []);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket || !student) return;

    // Invoice updated
    socket.on('invoice:updated', (updated) => {
      if (updated.student === student._id) {
        if (updated.status !== 'pending') {
          setInvoiceList(prev => prev.filter(i => i._id !== updated._id));
        }
        toast.info('💳 Invoice status updated!', { autoClose: 2000 });
      }
    });

    // Attendance marked
    socket.on('attendance:marked', (marked) => {
      if (marked.student === student._id && marked.status === 'absent') {
        setDaysOff(prev => prev + 1);
      }
    });

    return () => {
      socket.off('invoice:updated');
      socket.off('attendance:marked');
    };
  }, [socket, student]);

  const labels = ["Days off", "Days present"];
  const totalDays = new Date().getDate();

  return (
    <div className="w-full h-screen flex items-center justify-center flex-col gap-5 max-h-screen overflow-y-auto pt-64 lg:pt-0 md:pt-64 sm:pt-96">
      <h1 className="text-white font-bold text-5xl text-center">
        Welcome{" "}
        <span className="text-blue-500">{student?.name || "Student"}!</span>
      </h1>
      <div className="flex gap-5 w-full justify-center flex-wrap">
        <List invoiceList={invoiceList} />
        <div className="flex flex-col items-center bg-neutral-950 rounded-xl shadow-xl p-5">
          <span className="text-white text-xl">Attendance</span>
          <Doughnut
            datasetIdKey="id"
            data={{
              labels,
              datasets: [
                {
                  label: "days",
                  data: [daysOff, totalDays - daysOff],
                  backgroundColor: ["#F26916", "#1D4ED8"],
                  borderColor: "rgba(0,0,0,0)",
                  hoverOffset: 10,
                },
              ],
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default Home;
