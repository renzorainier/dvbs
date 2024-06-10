import React, { useState, useEffect, useRef } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase.js"; // Import your Firebase config
import Confetti from "react-confetti";
import { FaCheckCircle } from "react-icons/fa";
import { FaUserCheck } from "react-icons/fa";
import { ImCross } from "react-icons/im";
import { HiClipboardList } from "react-icons/hi";

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

  const [showStudentInfo, setShowStudentInfo] = useState(false);
  const [selectedStudentInfo, setSelectedStudentInfo] = useState(null);

  const uploadTime = new Date().toLocaleString();

  useEffect(() => {
    const fetchPrimary = async () => {
      try {
        const docRef = doc(
          db,
          config.dbPath.split("/")[0],
          config.dbPath.split("/")[1]
        );
        const primarySnapshot = await getDoc(docRef);
        if (primarySnapshot.exists()) {
          const data = primarySnapshot.data();
          console.log("Fetched data:", data); // Log the fetched data
          setPrimaryData(data);
        } else {
          console.error("No such document!");
        }
      } catch (error) {
        console.error("Error fetching document:", error);
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
    // Return 0 if today is "A" and we need to backtrack
    if (dayLetter === "A") {
      return 0;
    }

    let pointsField = `${fieldName.slice(0, 2)}${dayLetter}points`;
    let points = primaryData[pointsField] || 0;

    while (points === 0 && dayLetter !== "A") {
      dayLetter = getPreviousDayLetter(dayLetter);

      // If the new dayLetter is "A", return 0
      if (dayLetter === "A") {
        return 0;
      }

      pointsField = `${fieldName.slice(0, 2)}${dayLetter}points`;
      points = primaryData[pointsField] || 0;

      const attendanceField = `${fieldName.slice(0, 2)}${dayLetter}`;
      if (points === 0 && primaryData[attendanceField]) {
        return 0; // Return 0 if the student was present but had 0 points
      }
    }

    return points;
  };

  // const getCurrentDayLetter = () => {
  //   const days = ["A", "B", "C", "D", "E"];
  //   const dayIndex = new Date().getDay();
  //   return days[dayIndex >= 1 && dayIndex <= 5 ? dayIndex - 1 : 4];
  // };

  // const getPreviousDayLetter = (dayLetter) => {
  //   const days = ["A", "B", "C", "D", "E"];
  //   const index = days.indexOf(dayLetter);
  //   return index === 0 ? days[4] : days[index - 1];
  // };

  // const getLastValidPoints = (fieldName, dayLetter) => {
  //   let pointsField = `${fieldName.slice(0, 2)}${dayLetter}points`;
  //   let points = primaryData[pointsField] || 0;
  //   while (points === 0 && dayLetter !== "A") {
  //     dayLetter = getPreviousDayLetter(dayLetter);
  //     pointsField = `${fieldName.slice(0, 2)}${dayLetter}points`;
  //     points = primaryData[pointsField] || 0;

  //     const attendanceField = `${fieldName.slice(0, 2)}${dayLetter}`;
  //     if (points === 0 && primaryData[attendanceField]) {
  //       return 0; // Return 0 if the student was present but had 0 points
  //     }
  //   }
  //   return points;
  // };

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
      {showStudentInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black opacity-50"></div>
          <div className="bg-white rounded-lg p-8 shadow-2xl z-10 flex flex-col items-center w-11/12 max-w-lg">
            <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
              Student Information
            </h2>
            <div className="text-left space-y-4 w-full text-gray-700">
              <p className="text-lg">
                <strong>ID:</strong> {selectedStudentInfo?.id || "NA"}
              </p>
              <p className="text-lg">
                <strong>Address:</strong> {selectedStudentInfo?.loc || "NA"}
              </p>
              <p className="text-lg">
                <strong>Age:</strong> {selectedStudentInfo?.age || "NA"}
              </p>
              <p className="text-lg">
                <strong>Contact Number:</strong>{" "}
                {selectedStudentInfo?.contactNumber || "NA"}
              </p>
              <div className="text-lg bg-gray-400">
  <p className="text-xl font-semibold mb-2">Points</p>
  <div className="grid grid-cols-2 gap-4 text-lg">
    <div className="flex items-center">
      <strong className="mr-2">Mon:</strong>
      <span>{selectedStudentInfo?.Apoints || "NA"}</span>
    </div>
    <div className="flex items-center">
      <strong className="mr-2">Tue:</strong>
      <span>{selectedStudentInfo?.Bpoints || "NA"}</span>
    </div>
    <div className="flex items-center">
      <strong className="mr-2">Wed:</strong>
      <span>{selectedStudentInfo?.Cpoints || "NA"}</span>
    </div>
    <div className="flex items-center">
      <strong className="mr-2">Thu:</strong>
      <span>{selectedStudentInfo?.Dpoints || "NA"}</span>
    </div>
    <div className="flex items-center">
      <strong className="mr-2">Fri:</strong>
      <span>{selectedStudentInfo?.Epoints || "NA"}</span>
    </div>
  </div>
</div>

              <p className="text-lg">
                <strong>Invites:</strong> {selectedStudentInfo?.invites || "NA"}
              </p>
            </div>
            <button
              className="bg-blue-500 text-white font-bold py-3 px-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-6"
              onClick={() => setShowStudentInfo(false)}>
              OK
            </button>
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
          <div className="fixed inset-0 bg-black opacity-50"></div>
          <div className="bg-white rounded-lg p-5 shadow-md z-10 flex flex-col items-center">
            <p className="mb-4 text-center">
              You are in visitor view. This feature is disabled.
            </p>
            <button
              className="bg-blue-500 text-white font-bold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setShowVisitorPrompt(false)}>
              OK
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-center mb-5 font-bold">
        <div className="flex items-center bg-white border rounded-lg shadow-md p-4">
          <FaUserCheck style={{ fontSize: "1.5em" }} />
          <p className="text-gray-800 font-bold ml-2 text-lg sm:text-base md:text-lg lg:text-xl">
            {countPresentForToday()}
          </p>
        </div>
        <div className="flex items-center bg-white border rounded-lg shadow-md p-4 ml-4">
          <ImCross style={{ fontSize: "1.0em" }} />
          <p className="text-gray-800 font-bold ml-2 text-lg sm:text-base md:text-lg lg:text-xl">
            {countAbsentForToday()}
          </p>
        </div>

        <div className="flex items-center bg-white border rounded-lg shadow-md p-4 ml-4">
          <HiClipboardList style={{ fontSize: "1.5em" }} />
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
            const id = savedFieldName.slice(0, -5);
            const loc = id + "loc";
            const contactNumber = id + "contactNumber";
            const Apoints = id + "Apoints";
            const Bpoints = id + "Bpoints";
            const Cpoints = id + "Cpoints";
            const Dpoints = id + "Dpoints";
            const Epoints = id + "Epoints";
            const invites = id + "invites";
            const age = id + "age";

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
                <div
                  className="ml-2 cursor-pointer text-blue-500 underline"
                  onClick={() => {
                    setShowStudentInfo(true);
                    setSelectedStudentInfo({
                      loc: primaryData[loc],
                      contactNumber: primaryData[contactNumber],
                      Apoints: primaryData[Apoints],
                      Bpoints: primaryData[Bpoints],
                      Cpoints: primaryData[Cpoints],
                      Dpoints: primaryData[Dpoints],
                      Epoints: primaryData[Epoints],
                      invites: primaryData[invites],
                      age: primaryData[age],
                      id: id,
                    });
                  }}>
                  Info
                </div>
                <div className="flex flex-row ml-1 border-2 border-gray-400 p-1 rounded-md">
                  {["A", "B", "C", "D", "E"].map((dayLetter) => {
                    const fieldName = `${studentIndex.slice(0, 2)}${dayLetter}`;
                    return (
                      <div
                        key={dayLetter}
                        className={`w-4 h-7 rounded-lg ${
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
