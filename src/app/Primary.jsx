import React, { useState, useEffect, useRef } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase.js"; // Import your Firebase config
import Confetti from "react-confetti";
import { FaCheckCircle } from "react-icons/fa";

function Primary({
  config,
  currentConfigIndex,
  setCurrentConfigIndex,
  isVisitorView,
}) {
  const [primaryData, setPrimaryData] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [studentToMarkAbsent, setStudentToMarkAbsent] = useState(null);
  const [showBiblePopup, setShowBiblePopup] = useState(false);
  const [studentToUpdateBible, setStudentToUpdateBible] = useState(null);
  const [showVisitorPrompt, setShowVisitorPrompt] = useState(false); // New state for visitor prompt
  const audioRef = useRef(null);

  const uploadTime = new Date().toLocaleString();

  useEffect(() => {
    const fetchPrimary = async () => {
      const docRef = doc(
        db,
        config.dbPath.split("/")[0],
        config.dbPath.split("/")[1]
      );
      const primarySnapshot = await getDoc(docRef);
      if (primarySnapshot.exists()) {
        setPrimaryData(primarySnapshot.data());
      } else {
        console.error("No such document!");
      }
    };

    fetchPrimary();
  }, [config.dbPath]);

  const getCurrentDayLetter = () => {
    const days = ["A", "B", "C", "D", "E"];
    const dayIndex = new Date().getDay();
    return days[dayIndex >= 1 && dayIndex <= 5 ? dayIndex - 1 : 4];
  };

  const getPreviousDayLetter = (dayLetter) => {
    const days = ["A", "B", "C", "D", "E"];
    const index = days.indexOf(dayLetter);
    return index === 0 ? days[4] : days[index - 1];
  };

  const getLastValidPoints = (fieldName, dayLetter) => {
    let pointsField = `${fieldName.slice(0, 2)}${dayLetter}points`;
    let points = primaryData[pointsField] || 0;
    while (points === 0 && dayLetter !== "A") {
      dayLetter = getPreviousDayLetter(dayLetter);
      pointsField = `${fieldName.slice(0, 2)}${dayLetter}points`;
      points = primaryData[pointsField] || 0;

      const attendanceField = `${fieldName.slice(0, 2)}${dayLetter}`;
      if (points === 0 && primaryData[attendanceField]) {
        return 0; // Return 0 if the student was present but had 0 points
      }
    }
    return points;
  };

  const handleClick = (fieldName) => {
    if (isVisitorView) {
      setShowVisitorPrompt(true);
      return;
    }

    const prefix = fieldName.slice(0, 2);
    const dayLetter = getCurrentDayLetter();
    const fieldToUpdate = `${prefix}${dayLetter}`;

    if (primaryData[fieldToUpdate]) {
      // Show confirmation prompt
      setStudentToMarkAbsent({ fieldName, fieldToUpdate });
      setShowConfirmation(true);
    } else {
      updateStudentAttendance(fieldName, fieldToUpdate);
    }
  };

  const updateStudentAttendance = async (fieldName, fieldToUpdate) => {
    try {
      const docRef = doc(
        db,
        config.dbPath.split("/")[0],
        config.dbPath.split("/")[1]
      );
      const newValue = primaryData[fieldToUpdate] ? "" : uploadTime;
      const bibleField = `${fieldToUpdate}bible`;

      // Calculate the new points value
      const pointsField = `${fieldName.slice(
        0,
        2
      )}${getCurrentDayLetter()}points`;
      const previousDayLetter = getPreviousDayLetter(getCurrentDayLetter());
      const previousPoints = getLastValidPoints(fieldName, previousDayLetter);
      const newPoints = newValue ? previousPoints + 1 : previousPoints;

      await updateDoc(docRef, {
        [fieldToUpdate]: newValue,
        [bibleField]: newValue ? "" : false, // Reset Bible status to false instead of null
        [pointsField]: newValue ? newPoints : previousPoints, // Update points field or reset to previous points
      });

      setPrimaryData((prevData) => ({
        ...prevData,
        [fieldToUpdate]: newValue,
        [bibleField]: newValue ? "" : false, // Reset Bible status to false instead of null
        [pointsField]: newValue ? newPoints : previousPoints, // Update local state with the new points value
      }));

      // Play sound if student is marked present
      if (newValue) {
        playEnterSound();
        setStudentToUpdateBible(fieldName);
        setShowBiblePopup(true);
      }
    } catch (error) {
      console.error("Error updating Firebase: ", error);
    }

    setShowConfirmation(false);
    setStudentToMarkAbsent(null);
  };

  const updateBibleStatus = async (fieldName, broughtBible) => {
    try {
      const docRef = doc(
        db,
        config.dbPath.split("/")[0],
        config.dbPath.split("/")[1]
      );
      const dayLetter = getCurrentDayLetter();
      const bibleField = `${fieldName.slice(0, 2)}${dayLetter}bible`;
      const pointsField = `${fieldName.slice(0, 2)}${dayLetter}points`;

      // Update Bible status and points
      const currentPoints = primaryData[pointsField] || 0;
      const newPoints = broughtBible ? currentPoints + 3 : currentPoints;

      await updateDoc(docRef, {
        [bibleField]: broughtBible ? true : false,
        [pointsField]: newPoints, // Update points with Bible bonus
      });

      setPrimaryData((prevData) => ({
        ...prevData,
        [bibleField]: broughtBible ? true : false,
        [pointsField]: newPoints, // Update local state with the new points value
      }));
    } catch (error) {
      console.error("Error updating Firebase: ", error);
    }

    setShowBiblePopup(false);
    setStudentToUpdateBible(null);
  };

  const getButtonColor = (fieldName) => {
    const prefix = fieldName.slice(0, 2);
    const dayLetter = getCurrentDayLetter();
    const fieldToCheck = `${prefix}${dayLetter}`;
    return primaryData[fieldToCheck]
      ? config.colors.present
      : config.colors.absent;
  };

  const countPresentForToday = () => {
    const dayLetter = getCurrentDayLetter();
    return Object.keys(primaryData).filter(
      (key) => key.endsWith(dayLetter) && primaryData[key]
    ).length;
  };

  const countAbsentForToday = () => {
    const dayLetter = getCurrentDayLetter();
    const totalStudents = Object.keys(primaryData).filter((key) =>
      key.endsWith(dayLetter)
    ).length;
    const presentCount = countPresentForToday();
    return totalStudents - presentCount;
  };

  const sortedNames = Object.keys(primaryData)
    .filter((fieldName) => fieldName.endsWith("name"))
    .map((fieldName) => primaryData[fieldName])
    .sort();

  // Updated filteredNames to also search for field indexes
  const filteredNames = sortedNames.filter((name) => {
    const studentIndex = Object.keys(primaryData).find(
      (key) => primaryData[key] === name
    );
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (studentIndex &&
        studentIndex.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const playEnterSound = () => {
    const audio = new Audio("/point.wav");
    audio.play();
  };

  return (
    <div className="flex flex-col items-center">
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black opacity-50"></div>
          <div className="bg-white rounded-lg p-5 shadow-md z-10 flex flex-col items-center">
            <p className="mb-2">Mark student as absent?</p>
            <div className="flex space-x-4">
              <button
                className="bg-red-500 text-white font-bold py-2 px-4 rounded"
                onClick={() =>
                  updateStudentAttendance(
                    studentToMarkAbsent.fieldName,
                    studentToMarkAbsent.fieldToUpdate
                  )
                }>
                Yes
              </button>
              <button
                className="bg-gray-500 text-white font-bold py-2 px-4 rounded"
                onClick={() => setShowConfirmation(false)}>
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {showBiblePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black opacity-50" />
          <div className="bg-white rounded-lg p-5 shadow-md z-10 flex flex-col items-center">
            <p className="mb-2">Did the student bring their Bible today?</p>
            <div className="flex space-x-4">
              <button
                className="bg-green-500 text-white font-bold py-2 px-4 rounded"
                onClick={() => updateBibleStatus(studentToUpdateBible, true)}>
                Yes
              </button>
              <button
                className="bg-red-500 text-white font-bold py-2 px-4 rounded"
                onClick={() => updateBibleStatus(studentToUpdateBible, false)}>
                No
              </button>
            </div>
          </div>
        </div>
      )}

{showVisitorPrompt && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div className="fixed inset-0 bg-black opacity-50" />
    <div className="bg-white rounded-lg p-5 shadow-md z-10 flex flex-col items-center">
      <p className="mb-2">
        You are in visitor view. Button functionality is disabled.
      </p>
      <button
        className="bg-blue-500 text-white font-bold py-2 px-4 rounded mt-4"
        onClick={() => setShowVisitorPrompt(false)}>
        OK
      </button>
    </div>
  </div>
)}


      <div className="flex justify-center mb-5 font-bold">
        <div className="flex items-center bg-white border rounded-lg shadow-md p-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 sm:h-10 lg:w-12 lg:h-12">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632"
            />
          </svg>
          <p className="text-gray-800 font-bold ml-2 text-lg sm:text-base md:text-lg lg:text-xl">
            {countPresentForToday()}
          </p>
        </div>
        <div className="flex items-center bg-white border rounded-lg shadow-md p-4 ml-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <p className="text-gray-800 font-bold ml-2 text-lg sm:text-base md:text-lg lg:text-xl">
            {countAbsentForToday()}
          </p>
        </div>

        <div className="flex items-center bg-white border rounded-lg shadow-md p-4 ml-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875
"
            />
          </svg>
          <p className="text-gray-800 font-bold ml-2 text-lg sm:text-base md:text-lg lg:text-xl">
            {countPresentForToday()}
          </p>
        </div>
        <div className="flex items-center bg-white border rounded-lg shadow-md p-4 ml-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <p className="text-gray-800 font-bold ml-2 text-lg sm:text-base md:text-lg lg:text-xl">
            {countPresentForToday() + countAbsentForToday()}
          </p>
        </div>
      </div>

      <div className="w-full max-w-md text-gray-700 bg-white p-5 border rounded-lg shadow-lg mx-auto">
        <input
          type="text"
          placeholder="Search by name or ID no."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 mb-4"
        />
        <div className="flex flex-col gap-4">
          {filteredNames.map((name, index) => {
            const studentIndex = Object.keys(primaryData).find(
              (key) => primaryData[key] === name
            );
            const savedFieldName = `${studentIndex.slice(0, -4)}saved`; // Construct the saved field name

            return (
              <div key={index} className="flex items-center">
                <button
                  className={`w-70percent flex items-center justify-center hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg ${getButtonColor(
                    studentIndex
                  )}`}
                  onClick={() => {
                    if (!isVisitorView) {
                      handleClick(studentIndex);
                    } else {
                      setShowVisitorPrompt(true); // Show visitor prompt if in visitor view
                    }
                  }}>
                  <span className="mr-2">{name}</span> {/* Name */}
                  {primaryData[savedFieldName] && <FaCheckCircle />}{" "}
                  {/* Check if saved is true */}
                </button>
                <div className="flex flex-row ml-1">
                  {["A", "B", "C", "D", "E"].map((dayLetter) => {
                    const fieldName = `${studentIndex.slice(0, 2)}${dayLetter}`;
                    return (
                      <div
                        key={dayLetter}
                        className={`w-4 h-9 rounded-lg ${
                          primaryData[fieldName]
                            ? config.colors.present
                            : config.colors.absent
                        } mr-1`}></div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <audio ref={audioRef} />
    </div>
  );
}

export default Primary;

// import React, { useState, useEffect, useRef } from "react";
// import { doc, updateDoc, getDoc } from "firebase/firestore";
// import { db } from "./firebase.js"; // Import your Firebase config
// import Confetti from "react-confetti";
// import { FaCheckCircle } from "react-icons/fa";

// function Primary({ config, currentConfigIndex, setCurrentConfigIndex }) {
//   const [primaryData, setPrimaryData] = useState({});
//   const [searchQuery, setSearchQuery] = useState("");
//   const [showConfirmation, setShowConfirmation] = useState(false);
//   const [studentToMarkAbsent, setStudentToMarkAbsent] = useState(null);
//   const [showBiblePopup, setShowBiblePopup] = useState(false);
//   const [studentToUpdateBible, setStudentToUpdateBible] = useState(null);
//   const audioRef = useRef(null);

//   const uploadTime = new Date().toLocaleString();

//   useEffect(() => {
//     const fetchPrimary = async () => {
//       const docRef = doc(
//         db,
//         config.dbPath.split("/")[0],
//         config.dbPath.split("/")[1]
//       );
//       const primarySnapshot = await getDoc(docRef);
//       if (primarySnapshot.exists()) {
//         setPrimaryData(primarySnapshot.data());
//       } else {
//         console.error("No such document!");
//       }
//     };

//     fetchPrimary();
//   }, [config.dbPath]);

//   const getCurrentDayLetter = () => {
//     const days = ["A", "B", "C", "D", "E"];
//     const dayIndex = new Date().getDay();
//     return days[dayIndex === 0 ? 6 : dayIndex - 1];
//   };

//   const getPreviousDayLetter = (currentDayLetter) => {
//     const days = ["A", "B", "C", "D", "E"];
//     const currentIndex = days.indexOf(currentDayLetter);
//     const prevIndex = currentIndex === 0 ? 4 : currentIndex - 1;
//     return days[prevIndex];
//   };

//   const handleClick = (fieldName) => {
//     const prefix = fieldName.slice(0, 2);
//     const dayLetter = getCurrentDayLetter();
//     const prevDayLetter = getPreviousDayLetter(dayLetter);
//     const fieldToUpdate = `${prefix}${dayLetter}`;
//     const prevPointsField = `${prefix}${prevDayLetter}points`;

//     // Log the previous day's points value
//     const prevPoints = primaryData[prevPointsField] || 0;
//     console.log(
//       `Previous day (${prevDayLetter}) points for ${fieldName}: ${prevPoints}`
//     );

//     if (primaryData[fieldToUpdate]) {
//       // Show confirmation prompt
//       setStudentToMarkAbsent({ fieldName, fieldToUpdate });
//       setShowConfirmation(true);
//     } else {
//       updateStudentAttendance(fieldName, fieldToUpdate);
//     }
//   };

//   const updateStudentAttendance = async (fieldName, fieldToUpdate) => {
//     try {
//       const docRef = doc(
//         db,
//         config.dbPath.split("/")[0],
//         config.dbPath.split("/")[1]
//       );
//       const newValue = primaryData[fieldToUpdate] ? "" : uploadTime;
//       const bibleField = `${fieldToUpdate}bible`;

//       // Set the current day's points value back to the previous day's points value
//       const dayLetter = getCurrentDayLetter();
//       const prevDayLetter = getPreviousDayLetter(dayLetter);
//       const pointsField = `${fieldName.slice(0, 2)}${dayLetter}points`;
//       const prevPointsField = `${fieldName.slice(0, 2)}${prevDayLetter}points`;
//       const prevPoints = primaryData[prevPointsField] || 0;

//       await updateDoc(docRef, {
//         [fieldToUpdate]: newValue,
//         [bibleField]: newValue ? "" : false, // Reset Bible status to false instead of null
//         [pointsField]: prevPoints, // Set current day's points to previous day's points
//       });

//       setPrimaryData((prevData) => ({
//         ...prevData,
//         [fieldToUpdate]: newValue,
//         [bibleField]: newValue ? "" : false, // Reset Bible status to false instead of null
//         [pointsField]: prevPoints, // Update local state with the new points value
//       }));

//       // Play sound if student is marked present
//       if (newValue) {
//         playEnterSound();
//         setStudentToUpdateBible(fieldName);
//         setShowBiblePopup(true);
//       }
//     } catch (error) {
//       console.error("Error updating Firebase: ", error);
//     }

//     setShowConfirmation(false);
//     setStudentToMarkAbsent(null);
//   };

//   const updateBibleStatus = async (fieldName, broughtBible) => {
//     try {
//       const docRef = doc(
//         db,
//         config.dbPath.split("/")[0],
//         config.dbPath.split("/")[1]
//       );
//       const dayLetter = getCurrentDayLetter();
//       const prevDayLetter = getPreviousDayLetter(dayLetter);
//       const bibleField = `${fieldName.slice(0, 2)}${dayLetter}bible`;
//       const pointsField = `${fieldName.slice(0, 2)}${dayLetter}points`;
//       const prevPointsField = `${fieldName.slice(0, 2)}${prevDayLetter}points`;

//       // Get previous day's points and set as today's initial points
//       const prevPoints = primaryData[prevPointsField] || 0;
//       const newPoints = broughtBible ? prevPoints + 1 : prevPoints;

//       await updateDoc(docRef, {
//         [bibleField]: broughtBible ? true : false,
//         [pointsField]: newPoints,
//       });

//       setPrimaryData((prevData) => ({
//         ...prevData,
//         [bibleField]: broughtBible ? true : false,
//         [pointsField]: newPoints,
//       }));
//     } catch (error) {
//       console.error("Error updating Firebase: ", error);
//     }

//     setShowBiblePopup(false);
//     setStudentToUpdateBible(null);
//   };

//   const getButtonColor = (fieldName) => {
//     const prefix = fieldName.slice(0, 2);
//     const dayLetter = getCurrentDayLetter();
//     const fieldToCheck = `${prefix}${dayLetter}`;
//     return primaryData[fieldToCheck]
//       ? config.colors.present
//       : config.colors.absent;
//   };

//   const countPresentForToday = () => {
//     const dayLetter = getCurrentDayLetter();
//     return Object.keys(primaryData).filter(
//       (key) => key.endsWith(dayLetter) && primaryData[key]
//     ).length;
//   };

//   const countAbsentForToday = () => {
//     const dayLetter = getCurrentDayLetter();
//     const totalStudents = Object.keys(primaryData).filter((key) =>
//       key.endsWith(dayLetter)
//     ).length;
//     const presentCount = countPresentForToday();
//     return totalStudents - presentCount;
//   };

//   const sortedNames = Object.keys(primaryData)
//     .filter((fieldName) => fieldName.endsWith("name"))
//     .map((fieldName) => primaryData[fieldName])
//     .sort();

//   // Updated filteredNames to also search for field indexes
//   const filteredNames = sortedNames.filter((name) => {
//     const studentIndex = Object.keys(primaryData).find(
//       (key) => primaryData[key] === name
//     );
//     return (
//       name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       (studentIndex &&
//         studentIndex.toLowerCase().includes(searchQuery.toLowerCase()))
//     );
//   });

//   const playEnterSound = () => {
//     const audio = new Audio("/point.wav");
//     audio.play();
//   };

//   return (
//     <div className="flex flex-col items-center">
//       {showConfirmation && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center">
//           <div className="fixed inset-0 bg-black opacity-50" />
//           <div className="bg-white rounded-lg p-5 shadow-md z-10 flex flex-col items-center">
//             <p className="mb-2">Mark student as absent?</p>
//             <div className="flex space-x-4">
//               <button
//                 className="bg-red-500 text-white font-bold py-2 px-4 rounded"
//                 onClick={() =>
//                   updateStudentAttendance(
//                     studentToMarkAbsent.fieldName,
//                     studentToMarkAbsent.fieldToUpdate
//                   )
//                 }>
//                 Yes
//               </button>
//               <button
//                 className="bg-gray-500 text-white font-bold py-2 px-4 rounded"
//                 onClick={() => setShowConfirmation(false)}>
//                 No
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {showBiblePopup && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center">
//           <div className="fixed inset-0 bg-black opacity-50" />
//           <div className="bg-white rounded-lg p-5 shadow-md z-10 flex flex-col items-center">
//             <p className="mb-2">Did the student bring their Bible today?</p>
//             <div className="flex space-x-4">
//               <button
//                 className="bg-green-500 text-white font-bold py-2 px-4 rounded"
//                 onClick={() => updateBibleStatus(studentToUpdateBible, true)}>
//                 Yes
//               </button>
//               <button
//                 className="bg-red-500 text-white font-bold py-2 px-4 rounded"
//                 onClick={() => updateBibleStatus(studentToUpdateBible, false)}>
//                 No
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="w-full max-w-md text-gray-700 bg-white p-5 border rounded-lg shadow-lg mx-auto">
//         <input
//           type="text"
//           placeholder="Search by name or ID no."
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//           className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 mb-4"
//         />
//         <div className="flex flex-col gap-4">
//           {filteredNames.map((name, index) => {
//             const studentIndex = Object.keys(primaryData).find(
//               (key) => primaryData[key] === name
//             );
//             const savedFieldName = `${studentIndex.slice(0, -4)}saved`; // Construct the saved field name

//             return (
//               <div key={index} className="flex items-center">
//                 <button
//                   className={`w-70percent flex items-center justify-center hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg ${getButtonColor(
//                     studentIndex
//                   )}`}
//                   onClick={() => {
//                     handleClick(studentIndex);
//                   }}>
//                   <span className="mr-2">{name}</span> {/* Name */}
//                   {primaryData[savedFieldName] && <FaCheckCircle />}{" "}
//                   {/* Check if saved is true */}
//                 </button>
//                 <div className="flex flex-row ml-1">
//                   {["A", "B", "C", "D", "E"].map((dayLetter) => {
//                     const fieldName = `${studentIndex.slice(0, 2)}${dayLetter}`;
//                     return (
//                       <div
//                         key={dayLetter}
//                         className={`w-4 h-9 rounded-lg ${
//                           primaryData[fieldName]
//                             ? config.colors.present
//                             : config.colors.absent
//                         } mr-1`}></div>
//                     );
//                   })}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>
//       <audio ref={audioRef} />
//     </div>
//   );
// }

// export default Primary;
