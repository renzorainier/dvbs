import React, { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "./firebase.js"; // Import your Firebase config

function StudentOutTime() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const uploadTime = new Date().toLocaleString();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "dvbs"));
        const studentData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const currentDayLetter = getCurrentDayLetter();
        const presentStudents = studentData.filter((student) =>
          Object.keys(student).some((key) => key.endsWith(currentDayLetter) && student[key])
        );
        setStudents(presentStudents);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching students: ", error);
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const getCurrentDayLetter = () => {
    const days = ["A", "B", "C", "D", "E"];
    const dayIndex = new Date().getDay();
    return days[dayIndex === 0 ? 6 : dayIndex - 1];
  };

  const handleClick = async (studentId, fieldName) => {
    const docRef = doc(db, "dvbs", studentId);
    const newValue = uploadTime;

    try {
      await updateDoc(docRef, {
        [fieldName]: newValue,
      });

      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.id === studentId
            ? { ...student, [fieldName]: newValue }
            : student
        )
      );
    } catch (error) {
      console.error("Error updating Firebase: ", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-xl font-bold mb-4">Present Students</h1>
      <div className="w-full max-w-md text-gray-700 bg-white p-5 border rounded-lg shadow-lg mx-auto">
        {students.map((student) => {
          const currentDayLetter = getCurrentDayLetter();
          const studentField = Object.keys(student).find(
            (key) => key.endsWith(currentDayLetter) && student[key]
          );

          return (
            <div key={student.id} className="flex items-center mb-4">
              <button
                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                onClick={() => handleClick(student.id, studentField)}
              >
                {student.name}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StudentOutTime;