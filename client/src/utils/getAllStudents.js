const getAllStudents = async () => {
    const hostelData = JSON.parse(localStorage.getItem("hostel"));
    if (!hostelData || !hostelData._id) {
        console.log("No hostel data available for getAllStudents");
        return { success: false, students: [] };
    }
    const result = await fetch(window.API_BASE_URL + "/api/student/get-all-students", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ hostel: hostelData._id }),
    });
    const data = await result.json();
    return data;
};

export default getAllStudents;