import React, { useState, useEffect, useRef } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase.js"; // Import your Firebase config
import Confetti from "react-confetti";
import { FaCheckCircle } from "react-icons/fa";
import { FaUserCheck } from "react-icons/fa";
import { ImCross } from "react-icons/im";
import { HiClipboardList } from "react-icons/hi";
import { MdOutlineMoreHoriz } from "react-icons/md";

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
  const [showStudentInfo, setShowStudentInfo] = useState(false);
  const [selectedStudentInfo, setSelectedStudentInfo] = useState(null);
  const [editableStudentInfo, setEditableStudentInfo] = useState({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const audioRef = useRef(null);
  const uploadTime = new Date().toLocaleString();

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

  useEffect(() => {
    fetchPrimary();
  }, [config.dbPath]);

  const handleFetchClick = () => {
    fetchPrimary();
  };

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

  // const getLastValidPoints = (fieldName, dayLetter) => {
  //   // Return 0 if today is "A" and we need to backtrack
  //   if (dayLetter === "A") {
  //     return 0;
  //   }

  //   let pointsField = `${fieldName.slice(0, 2)}${dayLetter}points`;
  //   let points = primaryData[pointsField] || 0;

  //   while (points === 0 && dayLetter !== "A") {
  //     dayLetter = getPreviousDayLetter(dayLetter);

  //     // If the new dayLetter is "A", return 0
  //     if (dayLetter === "A") {
  //       return 0;
  //     }

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

  const prepareUpdateData = (data, studentId) => {
    const updatedData = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        updatedData[`${studentId}${key}`] = data[key];
      }
    }
    return updatedData;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Name: ${name}`); // Log the name to the console
    setEditableStudentInfo((prevState) => ({
      ...prevState,
      [name]: Number(value),
    }));
  };

  const handleSubmit = async (e) => {
    try {
      const docRef = doc(
        db,
        config.dbPath.split("/")[0],
        config.dbPath.split("/")[1]
      );

      // Use the background function to prepare the update data
      const updateData = prepareUpdateData(
        editableStudentInfo,
        selectedStudentInfo.id
      );

      await updateDoc(docRef, updateData);
      setSelectedStudentInfo((prevState) => ({
        ...prevState,
        ...editableStudentInfo,
      }));
      setEditableStudentInfo({});
      playEnterSound();
      console.log("Document successfully updated!");
      setShowSuccessMessage(true);
    } catch (error) {
      console.error("Error updating document: ", error);
    }
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

      {showStudentInfo && !showSuccessMessage && (
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
                <strong>Invited By:</strong>{" "}
                <span>{selectedStudentInfo.invitedBy || "NA"}</span>
              </p>
              <p className="text-lg">
                <strong>Address:</strong>{" "}
                <span>{selectedStudentInfo.loc || "NA"}</span>
              </p>
              <p className="text-lg">
                <strong>Age:</strong>{" "}
                <span>{selectedStudentInfo.age || "NA"}</span>
              </p>
              <p className="text-lg">
                <strong>Contact Number:</strong>{" "}
                <span>{selectedStudentInfo.contactNumber || "NA"}</span>
              </p>

              <div
                className={`bg-[${config.color}] text-lg rounded-lg shadow-md p-6 w-full`}>
                <h3 className="text-2xl font-semibold mb-4 text-gray-800">
                  Points
                </h3>
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <label className="mb-2 text-gray-700">Monday:</label>
                    <input
                      type="number"
                      name="Apoints"
                      value={
                        editableStudentInfo.Apoints !== undefined
                          ? editableStudentInfo.Apoints
                          : selectedStudentInfo.Apoints || ""
                      }
                      onChange={handleInputChange}
                      className="text-lg border rounded-md px-4 py-2 w-full"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 text-gray-700">Tuesday:</label>
                    <input
                      type="number"
                      name="Bpoints"
                      value={
                        editableStudentInfo.Bpoints !== undefined
                          ? editableStudentInfo.Bpoints
                          : selectedStudentInfo.Bpoints || ""
                      }
                      onChange={handleInputChange}
                      className="text-lg border rounded-md px-4 py-2 w-full"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 text-gray-700">Wednesday:</label>
                    <input
                      type="number"
                      name="Cpoints"
                      value={
                        editableStudentInfo.Cpoints !== undefined
                          ? editableStudentInfo.Cpoints
                          : selectedStudentInfo.Cpoints || ""
                      }
                      onChange={handleInputChange}
                      className="text-lg border rounded-md px-4 py-2 w-full"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 text-gray-700">Thursday:</label>
                    <input
                      type="number"
                      name="Dpoints"
                      value={
                        editableStudentInfo.Dpoints !== undefined
                          ? editableStudentInfo.Dpoints
                          : selectedStudentInfo.Dpoints || ""
                      }
                      onChange={handleInputChange}
                      className="text-lg border rounded-md px-4 py-2 w-full"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="mb-2 text-gray-700">Friday:</label>
                    <input
                      type="number"
                      name="Epoints"
                      value={
                        editableStudentInfo.Epoints !== undefined
                          ? editableStudentInfo.Epoints
                          : selectedStudentInfo.Epoints || ""
                      }
                      onChange={handleInputChange}
                      className="text-lg border rounded-md px-4 py-2 w-full"
                    />
                  </div>
                </div>
              </div>
              <p className="text-lg">
                <strong>Invites:</strong>{" "}
                <span>{selectedStudentInfo.invites || "NA"}</span>
              </p>import React, { useState, useEffect, Fragment, useCallback } from "react";
import { Combobox, Transition, Menu } from "@headlessui/react";
import TeacherCombobox from "./TeacherCombobox";
import { getDoc, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase.js"; // Import your Firebase config
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { FaExchangeAlt } from "react-icons/fa";

function InvitedByField({
  invitedBy,
  handleInputChange,
  config,
  clearInvitedBy,
  addVisitorClicked,
  paddedIndex,
  visitorName,
}) {
  const [isStudent, setIsStudent] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState("");
  const [entries, setEntries] = useState([]);
  const [selectedName, setSelectedName] = useState(invitedBy);
  const [query, setQuery] = useState("");

  const handleToggle = () => {
    setIsStudent(!isStudent);
    handleInputChange({ target: { value: "" } }, "invitedBy");
  };

  const documentPaths = ["primary", "middlers", "juniors", "youth"];

  const getCurrentDayLetter = () => {
    const days = ["A", "B", "C", "D", "E"];
    const dayIndex = new Date().getDay();
    return days[dayIndex === 0 ? 6 : dayIndex - 1];
  };

  const getVisitorId = useCallback(() => {
    const path = config.dbPath.replace("dvbs/", "");
    const documentInitial = path.charAt(0).toUpperCase();
    const visitorId = `${documentInitial}${paddedIndex}-${visitorName}`;
    console.log("Visitor ID:", visitorId); // Log the visitor ID
    return visitorId;
  }, [config.dbPath, paddedIndex, visitorName]);

  const handleDocumentChange = async (documentPath) => {
    setSelectedDocument(documentPath);
    const docRef = doc(db, "dvbs", documentPath);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const extractedEntries = Object.keys(data)
          .filter((key) => key.endsWith("name"))
          .map((key) => ({ id: key.substring(0, 2), name: data[key] }))
          .filter((entry) => entry.name);
        setEntries(extractedEntries);
        console.log("Fetched entries:", extractedEntries); // Log the entries
      } else {
        console.log("No such document!");
        setEntries([]);
      }
    } catch (error) {
      console.error("Error fetching document:", error);
      setEntries([]);
    }
  };

  const filteredEntries =
    query === ""
      ? entries
      : entries.filter(
          (entry) =>
            entry.name.toLowerCase().includes(query.toLowerCase()) ||
            entry.id.includes(query)
        );

  const handleSelectionChange = (selected) => {
    const selectedEntry = entries.find((entry) => entry.name === selected);
    if (selectedEntry) {
      const documentInitial = selectedDocument.charAt(0).toUpperCase();
      const formattedValue = `${documentInitial}${selectedEntry.id}-${selectedEntry.name}`;
      setSelectedName(formattedValue);
      handleInputChange({ target: { value: formattedValue } }, "invitedBy");
    }
  };

  const updateInviterPoints = useCallback(async (documentPath) => {
    const dayLetter = getCurrentDayLetter();
    const inviterId = invitedBy.split("-")[0].slice(1); // Extract inviter ID
    const pointsField = `${inviterId}${dayLetter}points`;
    const invitesField = `${inviterId}invites`; // Create invites field specific to inviter ID
    const inviterDocRef = doc(db, "dvbs", documentPath);
    const visitorId = getVisitorId();

    try {
      const inviterDocSnap = await getDoc(inviterDocRef);
      if (inviterDocSnap.exists()) {
        const inviterData = inviterDocSnap.data();
        const currentPoints = inviterData[pointsField] || 0;
        const updatedPoints = currentPoints + 5;

        console.log(`Field name to update: ${pointsField}`); // Log the field name

        await updateDoc(inviterDocRef, {
          [pointsField]: updatedPoints,
          [invitesField]: arrayUnion(visitorId), // Update the specific invites array
        });
        console.log(`Updated ${pointsField} to ${updatedPoints}`);
        console.log(`Added ${visitorId} to ${invitesField} array`);
      } else {
        console.log("No such document for the inviter!");
      }
    } catch (error) {
      console.error("Error updating inviter points:", error);
    }
  }, [invitedBy, getVisitorId]);

  const handleAddButtonClick = useCallback(() => {
    if (isStudent) {
      updateInviterPoints(selectedDocument);
    }
  }, [isStudent, selectedDocument, updateInviterPoints]);

  useEffect(() => {
    if (invitedBy === "") {
      setSelectedName("");
    }
  }, [invitedBy]);

  useEffect(() => {
    if (addVisitorClicked) {
      // Function to run when the button is clicked
      handleAddButtonClick();
      console.log("Add Visitor button was clicked!");
      console.log(paddedIndex);
      console.log(visitorName);
      getVisitorId();
    }
  }, [addVisitorClicked, getVisitorId, handleAddButtonClick, paddedIndex, visitorName]);

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <h2 className="text-xl font-semibold text-white ">
          Invited by:
        </h2>
        <button
          className={`bg-[${config.color}] text-white  font-semibold py-1 px-6 rounded-lg  gap-3 flex items-center justify-center transition duration-300 ease-in-out`}
          onClick={handleToggle}
        >
          <FaExchangeAlt /> {isStudent ? "Student" : "Member"}
        </button>
      </div>

      {!isStudent ? (
        <TeacherCombobox
          invitedBy={invitedBy}
          handleInputChange={handleInputChange}
          config={config}
        />
      ) : (
        <div>
          <Menu as="div" className="relative inline-block text-center ">
            <div>
              <Menu.Button className="inline-flex justify-center w-full rounded-md bg-black/20 px-4 py-2 text-sm font-bold text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
                {selectedDocument ? selectedDocument.charAt(0).toUpperCase() + selectedDocument.slice(1) : "Select Group"}
                <ChevronDownIcon className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute mt-1 w-full rounded-md bg-gradient-to-b from-gray-100 to-white shadow-lg ring-1 ring-black/5 focus:outline-none flex flex-col items-center z-50">
                {documentPaths.map((documentPath) => (
                  <Menu.Item key={documentPath}>
                    {({ active }) => (
                      <button
                        onClick={() => handleDocumentChange(documentPath)}
                        className={`${
                          active ? "bg-blue-500 text-white" : "text-gray-900"
                        } flex w-full items-center rounded-lg px-4 py-2 text-lg font-semibold hover:bg-blue-100 transition-colors duration-200`}
                      >
                        {documentPath.charAt(0).toUpperCase() + documentPath.slice(1)}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Transition>
          </Menu>
          <Combobox value={selectedName} onChange={handleSelectionChange}>
            <div className="relative mt-4">
              <Combobox.Input
                className={`border border-gray-300 rounded-lg px-4 py-2 w-full focus:outline-none focus:border-${config.color}`}
                onChange={(event) => setQuery(event.target.value)}
                displayValue={(name) => name}
                placeholder="Select a Student"
              />
              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                afterLeave={() => setQuery("")}
              >
                <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {filteredEntries.length === 0 && query !== "" ? (
                    <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                      Nothing found.
                    </div>
                  ) : (
                    filteredEntries.map((entry) => (
                      <Combobox.Option
                        key={entry.id}
                        className={({ active }) =>
                          `relative cursor-default select-none py-2 pl-10 pr-4 ${
                            active ? "bg-blue-600 text-white" : "text-gray-900"
                          }`
                        }
                        value={entry.name}
                      >
                        {({ selected, active }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected ? "font-medium" : "font-normal"
                              }`}
                            >
                              {entry.id} - {entry.name}
                            </span>
                            {selected ? (
                              <span
                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                                  active ? "text-white" : "text-blue-600"
                                }`}
                              ></span>
                            ) : null}
                          </>
                        )}
                      </Combobox.Option>
                    ))
                  )}
                </Combobox.Options>
              </Transition>
            </div>
          </Combobox>
        </div>
      )}
    </div>
  );
}

export default InvitedByField;








            </div>
            <div className="flex justify-center mt-6 w-full">
              <button
                type="submit"
                onClick={() => {
                  handleSubmit();
                  handleFetchClick();
                }}
                className="bg-blue-500 text-white font-bold py-3 px-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full">
                Update
              </button>
              <button
                className="bg-red-500 text-white font-bold py-3 px-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ml-4 w-full"
                onClick={() => {
                  setShowStudentInfo(false);
                  setEditableStudentInfo({});
                }}>
                Cancel{" "}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black opacity-50"></div>
          <div className="bg-white rounded-lg p-8 shadow-2xl z-10 flex flex-col items-center w-11/12 max-w-lg">
            <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
              Success!
            </h2>
            <p className="text-lg mb-4 text-center text-gray-700">
              Document successfully updated!
            </p>
            <div className="flex justify-center mt-6 w-full">
              <button
                className="bg-green-500 text-white font-bold py-3 px-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full"
                onClick={() => {
                  setShowStudentInfo(false);
                  setShowSuccessMessage(false);
                }}>
                Okay
              </button>
            </div>
          </div>
        </div>
      )}

      {showBiblePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black opacity-50"></div>
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
            const invitedBy = id + "invitedBy"

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
                </div>{" "}
                <div
                  className="ml-2 cursor-pointer border border-gray-400 border-4 rounded-lg  text-gray-400"
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
                      invitedBy: primaryData[invitedBy]
                    });
                  }}>
                  <MdOutlineMoreHoriz />
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

// //working version 2nd day, no point editing yet 3:12

// import React, { useState, useEffect, useRef } from "react";
// import { doc, updateDoc, getDoc } from "firebase/firestore";
// import { db } from "./firebase.js"; // Import your Firebase config
// import Confetti from "react-confetti";
// import { FaCheckCircle } from "react-icons/fa";
// import { FaUserCheck } from "react-icons/fa";
// import { ImCross } from "react-icons/im";
// import { HiClipboardList } from "react-icons/hi";
// import { MdOutlineMoreHoriz } from "react-icons/md";

// function Primary({
//   config,
//   currentConfigIndex,
//   setCurrentConfigIndex,
//   isVisitorView,
// }) {
//   const [primaryData, setPrimaryData] = useState({});
//   const [searchQuery, setSearchQuery] = useState("");
//   const [showConfirmation, setShowConfirmation] = useState(false);
//   const [studentToMarkAbsent, setStudentToMarkAbsent] = useState(null);
//   const [showBiblePopup, setShowBiblePopup] = useState(false);
//   const [studentToUpdateBible, setStudentToUpdateBible] = useState(null);
//   const [showVisitorPrompt, setShowVisitorPrompt] = useState(false); // New state for visitor prompt
//   const audioRef = useRef(null);

//   const [showStudentInfo, setShowStudentInfo] = useState(false);
//   const [selectedStudentInfo, setSelectedStudentInfo] = useState(null);

//   const uploadTime = new Date().toLocaleString();

//   useEffect(() => {
//     const fetchPrimary = async () => {
//       try {
//         const docRef = doc(
//           db,
//           config.dbPath.split("/")[0],
//           config.dbPath.split("/")[1]
//         );
//         const primarySnapshot = await getDoc(docRef);
//         if (primarySnapshot.exists()) {
//           const data = primarySnapshot.data();
//           console.log("Fetched data:", data); // Log the fetched data
//           setPrimaryData(data);
//         } else {
//           console.error("No such document!");
//         }
//       } catch (error) {
//         console.error("Error fetching document:", error);
//       }
//     };

//     fetchPrimary();
//   }, [config.dbPath]);

//   const getCurrentDayLetter = () => {
//     const days = ["A", "B", "C", "D", "E"];
//     const dayIndex = new Date().getDay();
//     return days[dayIndex >= 1 && dayIndex <= 5 ? dayIndex - 1 : 4];
//   };

//   const getPreviousDayLetter = (dayLetter) => {
//     const days = ["A", "B", "C", "D", "E"];
//     const index = days.indexOf(dayLetter);
//     return index === 0 ? days[4] : days[index - 1];
//   };

//   const getLastValidPoints = (fieldName, dayLetter) => {
//     // Return 0 if today is "A" and we need to backtrack
//     if (dayLetter === "A") {
//       return 0;
//     }

//     let pointsField = `${fieldName.slice(0, 2)}${dayLetter}points`;
//     let points = primaryData[pointsField] || 0;

//     while (points === 0 && dayLetter !== "A") {
//       dayLetter = getPreviousDayLetter(dayLetter);

//       // If the new dayLetter is "A", return 0
//       if (dayLetter === "A") {
//         return 0;
//       }

//       pointsField = `${fieldName.slice(0, 2)}${dayLetter}points`;
//       points = primaryData[pointsField] || 0;

//       const attendanceField = `${fieldName.slice(0, 2)}${dayLetter}`;
//       if (points === 0 && primaryData[attendanceField]) {
//         return 0; // Return 0 if the student was present but had 0 points
//       }
//     }

//     return points;
//   };

//   // const getCurrentDayLetter = () => {
//   //   const days = ["A", "B", "C", "D", "E"];
//   //   const dayIndex = new Date().getDay();
//   //   return days[dayIndex >= 1 && dayIndex <= 5 ? dayIndex - 1 : 4];
//   // };

//   // const getPreviousDayLetter = (dayLetter) => {
//   //   const days = ["A", "B", "C", "D", "E"];
//   //   const index = days.indexOf(dayLetter);
//   //   return index === 0 ? days[4] : days[index - 1];
//   // };

//   // const getLastValidPoints = (fieldName, dayLetter) => {
//   //   let pointsField = `${fieldName.slice(0, 2)}${dayLetter}points`;
//   //   let points = primaryData[pointsField] || 0;
//   //   while (points === 0 && dayLetter !== "A") {
//   //     dayLetter = getPreviousDayLetter(dayLetter);
//   //     pointsField = `${fieldName.slice(0, 2)}${dayLetter}points`;
//   //     points = primaryData[pointsField] || 0;

//   //     const attendanceField = `${fieldName.slice(0, 2)}${dayLetter}`;
//   //     if (points === 0 && primaryData[attendanceField]) {
//   //       return 0; // Return 0 if the student was present but had 0 points
//   //     }
//   //   }
//   //   return points;
//   // };

//   const handleClick = (fieldName) => {
//     if (isVisitorView) {
//       setShowVisitorPrompt(true);
//       return;
//     }

//     const prefix = fieldName.slice(0, 2);
//     const dayLetter = getCurrentDayLetter();
//     const fieldToUpdate = `${prefix}${dayLetter}`;

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

//       // Calculate the new points value
//       const pointsField = `${fieldName.slice(
//         0,
//         2
//       )}${getCurrentDayLetter()}points`;
//       const previousDayLetter = getPreviousDayLetter(getCurrentDayLetter());
//       const previousPoints = getLastValidPoints(fieldName, previousDayLetter);
//       const newPoints = newValue ? previousPoints + 1 : previousPoints;

//       await updateDoc(docRef, {
//         [fieldToUpdate]: newValue,
//         [bibleField]: newValue ? "" : false, // Reset Bible status to false instead of null
//         [pointsField]: newValue ? newPoints : previousPoints, // Update points field or reset to previous points
//       });

//       setPrimaryData((prevData) => ({
//         ...prevData,
//         [fieldToUpdate]: newValue,
//         [bibleField]: newValue ? "" : false, // Reset Bible status to false instead of null
//         [pointsField]: newValue ? newPoints : previousPoints, // Update local state with the new points value
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
//       const bibleField = `${fieldName.slice(0, 2)}${dayLetter}bible`;
//       const pointsField = `${fieldName.slice(0, 2)}${dayLetter}points`;

//       // Update Bible status and points
//       const currentPoints = primaryData[pointsField] || 0;
//       const newPoints = broughtBible ? currentPoints + 3 : currentPoints;

//       await updateDoc(docRef, {
//         [bibleField]: broughtBible ? true : false,
//         [pointsField]: newPoints, // Update points with Bible bonus
//       });

//       setPrimaryData((prevData) => ({
//         ...prevData,
//         [bibleField]: broughtBible ? true : false,
//         [pointsField]: newPoints, // Update local state with the new points value
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
//           <div className="fixed inset-0 bg-black opacity-50"></div>
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
//       {showStudentInfo && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center">
//           <div className="fixed inset-0 bg-black opacity-50"></div>
//           <div className="bg-white rounded-lg p-8 shadow-2xl z-10 flex flex-col items-center w-11/12 max-w-lg">
//             <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
//               Student Information
//             </h2>
//             <div className="text-left space-y-4 w-full text-gray-700">
//               <p className="text-lg">
//                 <strong>ID:</strong> {selectedStudentInfo?.id || "NA"}
//               </p>
//               <p className="text-lg">
//                 <strong>Address:</strong> {selectedStudentInfo?.loc || "NA"}
//               </p>
//               <p className="text-lg">
//                 <strong>Age:</strong> {selectedStudentInfo?.age || "NA"}
//               </p>
//               <p className="text-lg">
//                 <strong>Contact Number:</strong>{" "}
//                 {selectedStudentInfo?.contactNumber || "NA"}
//               </p>
//               <div className={`bg-[${config.color}] text-lg  rounded-lg shadow-md p-6`}>
//   <h3 className="text-2xl font-semibold mb-4 text-gray-800">Points</h3>
//   <div className="grid grid-cols-2 gap-4 text-lg">
//     <div className="flex items-center pb-3">
//       <strong className="mr-2 text-gray-700">Monday:</strong>
//       <span className="text-gray-900">{selectedStudentInfo?.Apoints}</span>
//     </div>
//     <div className="flex items-center pb-3">
//       <strong className="mr-2 text-gray-700">Tuesday:</strong>
//       <span className="text-gray-900">{selectedStudentInfo?.Bpoints}</span>
//     </div>
//     <div className="flex items-center pb-3">
//       <strong className="mr-2 text-gray-700">Wednesday:</strong>
//       <span className="text-gray-900">{selectedStudentInfo?.Cpoints }</span>
//     </div>
//     <div className="flex items-center pb-3">
//       <strong className="mr-2 text-gray-700">Thursday:</strong>
//       <span className="text-gray-900">{selectedStudentInfo?.Dpoints}</span>
//     </div>
//     <div className="flex items-center">
//       <strong className="mr-2 text-gray-700">Friday:</strong>
//       <span className="text-gray-900">{selectedStudentInfo?.Epoints }</span>
//     </div>
//   </div>
// </div>

//               <p className="text-lg">
//                 <strong>Invites:</strong> {selectedStudentInfo?.invites || "NA"}
//               </p>
//             </div>
//             <button
//               className="bg-blue-500 text-white font-bold py-3 px-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-6"
//               onClick={() => setShowStudentInfo(false)}>
//               OK
//             </button>
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

//       {showVisitorPrompt && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center">
//           <div className="fixed inset-0 bg-black opacity-50"></div>
//           <div className="bg-white rounded-lg p-5 shadow-md z-10 flex flex-col items-center">
//             <p className="mb-4 text-center">
//               You are in visitor view. This feature is disabled.
//             </p>
//             <button
//               className="bg-blue-500 text-white font-bold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
//               onClick={() => setShowVisitorPrompt(false)}>
//               OK
//             </button>
//           </div>
//         </div>
//       )}

//       <div className="flex justify-center mb-5 font-bold">
//         <div className="flex items-center bg-white border rounded-lg shadow-md p-4">
//           <FaUserCheck style={{ fontSize: "1.5em" }} />
//           <p className="text-gray-800 font-bold ml-2 text-lg sm:text-base md:text-lg lg:text-xl">
//             {countPresentForToday()}
//           </p>
//         </div>
//         <div className="flex items-center bg-white border rounded-lg shadow-md p-4 ml-4">
//           <ImCross style={{ fontSize: "1.0em" }} />
//           <p className="text-gray-800 font-bold ml-2 text-lg sm:text-base md:text-lg lg:text-xl">
//             {countAbsentForToday()}
//           </p>
//         </div>

//         <div className="flex items-center bg-white border rounded-lg shadow-md p-4 ml-4">
//           <HiClipboardList style={{ fontSize: "1.5em" }} />
//           <p className="text-gray-800 font-bold ml-2 text-lg sm:text-base md:text-lg lg:text-xl">
//             {countPresentForToday() + countAbsentForToday()}
//           </p>
//         </div>
//       </div>

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
//             const id = savedFieldName.slice(0, -5);
//             const loc = id + "loc";
//             const contactNumber = id + "contactNumber";
//             const Apoints = id + "Apoints";
//             const Bpoints = id + "Bpoints";
//             const Cpoints = id + "Cpoints";
//             const Dpoints = id + "Dpoints";
//             const Epoints = id + "Epoints";
//             const invites = id + "invites";
//             const age = id + "age";

//             return (
//               <div key={index} className="flex items-center">
//                 <button
//                   className={`w-70percent flex items-center justify-center hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg ${getButtonColor(
//                     studentIndex
//                   )}`}
//                   onClick={() => {
//                     if (!isVisitorView) {
//                       handleClick(studentIndex);
//                     } else {
//                       setShowVisitorPrompt(true); // Show visitor prompt if in visitor view
//                     }
//                   }}>
//                   <span className="mr-2">{name}</span> {/* Name */}
//                   {primaryData[savedFieldName] && <FaCheckCircle />}{" "}
//                   {/* Check if saved is true */}
//                 </button>

//                 <div className="flex flex-row ml-1 border-2 border-gray-400 p-1 rounded-md">
//                   {["A", "B", "C", "D", "E"].map((dayLetter) => {
//                     const fieldName = `${studentIndex.slice(0, 2)}${dayLetter}`;
//                     return (
//                       <div
//                         key={dayLetter}
//                         className={`w-4 h-7 rounded-lg ${
//                           primaryData[fieldName]
//                             ? config.colors.present
//                             : config.colors.absent
//                         } mr-1`}></div>
//                     );
//                   })}
//                 </div>  <div
//                   className="ml-2 cursor-pointer text-gray-400"
//                   onClick={() => {
//                     setShowStudentInfo(true);
//                     setSelectedStudentInfo({
//                       loc: primaryData[loc],
//                       contactNumber: primaryData[contactNumber],
//                       Apoints: primaryData[Apoints],
//                       Bpoints: primaryData[Bpoints],
//                       Cpoints: primaryData[Cpoints],
//                       Dpoints: primaryData[Dpoints],
//                       Epoints: primaryData[Epoints],
//                       invites: primaryData[invites],
//                       age: primaryData[age],
//                       id: id,
//                     });
//                   }}>
//               <MdOutlineMoreHoriz />
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
