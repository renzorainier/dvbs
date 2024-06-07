import React, { useState, useEffect, Fragment, useRef } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "./firebase.js"; // Import your Firebase config
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { FaCheckCircle } from "react-icons/fa";
import { FaUserCheck } from "react-icons/fa";
import { ImCross } from "react-icons/im";

function StudentOutTime({ isVisitorView }) {
  const [students, setStudents] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [studentToMarkOut, setStudentToMarkOut] = useState(null);
  const audioRef = useRef(null);
  const [showVisitorPrompt, setShowVisitorPrompt] = useState(false); // New state for visitor prompt

  const uploadTime = new Date().toLocaleString();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "dvbs"));
        const studentData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("Fetched Student Data:", studentData);

        const currentDayLetter = getCurrentDayLetter();
        const presentStudents = studentData
          .map((group) => {
            const groupStudents = [];
            for (const key in group) {
              if (key.endsWith(currentDayLetter)) {
                const prefix = key.slice(0, 2);
                const inTimeField = `${prefix}${currentDayLetter}`;
                const outTimeField = `${prefix}${currentDayLetter}out`;
                if (group[inTimeField]) {
                  groupStudents.push({
                    id: group.id,
                    prefix,
                    inTimeField,
                    outTimeField,
                    name: group[`${prefix}name`],
                    location: group[`${prefix}loc`],
                    outTime: group[outTimeField],
                  });
                }
              }
            }
            return groupStudents;
          })
          .flat();

        // Sort students alphabetically by name
        presentStudents.sort((a, b) => a.name.localeCompare(b.name));

        const uniqueLocations = [
          ...new Set(presentStudents.map((student) => student.location)),
        ];

        setStudents(presentStudents);
        setLocations(uniqueLocations);
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
    return days[dayIndex >= 1 && dayIndex <= 5 ? dayIndex - 1 : 4];
  };

  // const getCurrentDayLetter = () => {
  //   const days = ["A", "B", "C", "D", "E", "F", "G"];
  //   const dayIndex = new Date().getDay();
  //   return days[dayIndex === 0 ? 6 : dayIndex - 1];
  // };

  const handleClick = (groupId, prefix, inTimeField, outTimeField, outTime) => {
    if (outTime) {
      setStudentToMarkOut({ groupId, prefix, inTimeField, outTimeField });
      setShowConfirmation(true);
    } else {
      updateStudentOutTime(
        groupId,
        prefix,
        inTimeField,
        outTimeField,
        uploadTime
      );
    }
  };

  const updateStudentOutTime = async (
    groupId,
    prefix,
    inTimeField,
    outTimeField,
    newValue
  ) => {
    const docRef = doc(db, "dvbs", groupId);

    try {
      await updateDoc(docRef, {
        [outTimeField]: newValue,
      });

      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.id === groupId && student.prefix === prefix
            ? { ...student, outTime: newValue }
            : student
        )
      );
    } catch (error) {
      console.error("Error updating Firebase: ", error);
    }

    setShowConfirmation(false);
    setStudentToMarkOut(null);
    playEnterSound();
  };

  const handleLocationChange = (location) => {
    setSelectedLocation(location);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const getBackgroundColor = (prefix) => {
    switch (prefix) {
      case "primary": // Assuming 'pr' stands for primary
        return "#FFC100";
      case "middlers": // Assuming 'mi' stands for middlers
        return "#04d924";
      case "juniors": // Assuming 'ju' stands for juniors
        return "#027df7";
      case "youth": // Assuming 'yo' stands for youth
        return "#f70233";
      default:
        return "#FFFFFF"; // Default color if no match
    }
  };

  const filteredStudents = students
    .filter((student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((student) =>
      selectedLocation ? student.location === selectedLocation : true
    );

  // Count the number of marked and not marked students
  const markedCount = filteredStudents.filter(
    (student) => student.outTime
  ).length;
  const notMarkedCount = filteredStudents.length - markedCount;

  const playEnterSound = () => {
    const audio = new Audio("/point.wav");
    audio.play();
  };

  return (
    <div className="bg-[#9ca3af] h-screen overflow-auto ">
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
      <div className="flex justify-center items-center overflow-auto">
        <div className="w-full rounded-lg mx-auto" style={{ maxWidth: "90%" }}>
          <Menu as="div" className="relative inline-block mt-5 mb-5">
            <div>
              <Menu.Button className="inline-flex rounded-md bg-black/20 px-4 py-2 text-sm font-bold text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
                <h2 className="text-4xl font-bold">
                  {selectedLocation || "All Locations"}
                </h2>
                <ChevronDownIcon
                  className="ml-2 -mr-1 h-10 w-10"
                  aria-hidden="true"
                />
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95">
              <Menu.Items className="absolute z-10 mt-2 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                        } block px-4 py-2 text-2xl font-semibold text-left`}
                        onClick={() => handleLocationChange("")}>
                        All Locations
                      </button>
                    )}
                  </Menu.Item>
                  {locations.map((location) => (
                    <Menu.Item key={location}>
                      {({ active }) => (
                        <button
                          className={`${
                            active
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-700"
                          } block px-4 py-2 text-2xl font-semibold text-left`}
                          onClick={() => handleLocationChange(location)}>
                          {location}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          <div className="flex  justify-center mb-5 font-bold">
            <div className="flex items-center bg-white border rounded-lg shadow-md p-4">
            <FaUserCheck style={{ fontSize: "1.5em" }}/>

              <p className="text-gray-800 font-bold  ml-2 text-lg sm:text-base md:text-lg lg:text-xl">
                {markedCount}
              </p>
            </div>
            <div className="flex items-center bg-white border rounded-lg shadow-md p-4 ml-4">
            <ImCross style={{ fontSize: "1.0em" }}/>
              <p className="text-gray-800 font-bold  ml-2 text-lg sm:text-base md:text-lg lg:text-xl">
                {notMarkedCount}
              </p>
            </div>
          </div>

          <div className="w-ful max-w-md  text-gray-700 bg-white mt-5 p-5 border rounded-lg shadow-lg mx-auto">
            <input
              type="text"
              className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
              placeholder="Search by name"
              value={searchQuery}
              onChange={handleSearchChange}
            />

            {filteredStudents.map((student) => (
              <div
                key={`${student.id}-${student.prefix}`}
                className="flex items-center mb-4">
                <button
                  className={`flex-1 text-white font-bold py-2 px-4 rounded-lg ${
                    student.outTime
                      ? "bg-green-500 hover:bg-green-700"
                      : "bg-gray-400 hover:bg-gray-700"
                  }`}
                  onClick={() => {
                    if (!isVisitorView) {
                      handleClick(
                        student.id,
                        student.prefix,
                        student.inTimeField,
                        student.outTimeField,
                        student.outTime
                      );
                    } else {
                      setShowVisitorPrompt(true); // Show visitor prompt if in visitor view
                    }
                  }}>
                  {student.name}
                  {student.saved && (
                    <FaCheckCircle className="text-black ml-2" />
                  )}
                </button>
                <div
                  className="ml-4 h-10 p-2 rounded-lg"
                  style={{
                    backgroundColor: getBackgroundColor(student.id),
                  }}></div>
              </div>
            ))}
          </div>

          {showConfirmation && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="fixed inset-0 bg-black opacity-50" />
              <div className="bg-white rounded-lg p-5 shadow-md z-10 flex flex-col items-center">
                <p className="mb-2">Unmark student as out?</p>
                <div className="flex space-x-4">
                  <button
                    className="bg-red-500 text-white font-bold py-2 px-4 rounded"
                    onClick={() =>
                      updateStudentOutTime(
                        studentToMarkOut.groupId,
                        studentToMarkOut.prefix,
                        studentToMarkOut.inTimeField,
                        studentToMarkOut.outTimeField,
                        ""
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
        </div>
      </div>
      <audio ref={audioRef} />
    </div>
  );
}

export default StudentOutTime;
