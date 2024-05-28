import React, { useState, useEffect, useRef, Fragment } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase.js"; // Import your Firebase config
import Confetti from "react-confetti";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

function DailyRewards() {
  const [primaryData, setPrimaryData] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedField, setSelectedField] = useState("memoryVerse");
  const audioRef = useRef(null);
  const [currentConfigIndex, setCurrentConfigIndex] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [studentToUnmark, setStudentToUnmark] = useState(null);

  const configurations = [
    {
      name: "Primary",
      dbPath: "dvbs/primary",
      color: "#FFC100",
      fields: ["memoryVerse", "bestInCraft", "bestInActivitySheet", "bible"],
    },
    {
      name: "Middlers",
      dbPath: "dvbs/middlers",
      color: "#04d924",
      fields: ["memoryVerse", "bestInCraft", "bestInActivitySheet", "bible"],
    },
    {
      name: "Juniors",
      dbPath: "dvbs/juniors",
      color: "#027df7",
      fields: ["memoryVerse", "bestInCraft", "bestInActivitySheet", "bible"],
    },
    {
      name: "Youth",
      dbPath: "dvbs/youth",
      color: "#f70233",
      fields: ["memoryVerse", "bestInCraft", "bestInActivitySheet", "bible"],
    },
  ];

  const currentConfig = configurations[currentConfigIndex];

  useEffect(() => {
    const fetchPrimary = async () => {
      const docRef = doc(
        db,
        currentConfig.dbPath.split("/")[0],
        currentConfig.dbPath.split("/")[1]
      );
      const primarySnapshot = await getDoc(docRef);
      if (primarySnapshot.exists()) {
        setPrimaryData(primarySnapshot.data());
      } else {
        console.error("No such document!");
      }
    };

    fetchPrimary();
  }, [currentConfig.dbPath]);

  const getCurrentDayLetter = () => {
    const days = ["A", "B", "C", "D", "E"];
    const dayIndex = new Date().getDay();
    return days[dayIndex === 0 ? 6 : dayIndex - 1];
  };

  const handleClick = (fieldName) => {
    const prefix = fieldName.slice(0, 2);
    const dayLetter = getCurrentDayLetter();
    const fieldToUpdate = `${prefix}${dayLetter}${selectedField}`;

    if (primaryData[fieldToUpdate]) {
      setStudentToUnmark({ fieldName, fieldToUpdate });
      setShowConfirmation(true);
    } else {
      updateStudentAttendance(fieldToUpdate, true);
    }
  };

  const updateStudentAttendance = async (fieldToUpdate, markAs) => {
    try {
      const docRef = doc(
        db,
        currentConfig.dbPath.split("/")[0],
        currentConfig.dbPath.split("/")[1]
      );

      await updateDoc(docRef, { [fieldToUpdate]: markAs });

      setPrimaryData((prevData) => ({
        ...prevData,
        [fieldToUpdate]: markAs,
      }));
    } catch (error) {
      console.error("Error updating document: ", error);
    }

    setShowConfirmation(false);
    setStudentToUnmark(null);
  };

  const getButtonColor = (fieldName) => {
    const prefix = fieldName.slice(0, 2);
    const dayLetter = getCurrentDayLetter();
    const fieldToCheck = `${prefix}${dayLetter}${selectedField}`;
    return primaryData[fieldToCheck];
  };

  const sortedNames = Object.keys(primaryData)
    .filter((fieldName) => fieldName.endsWith("name"))
    .map((fieldName) => {
      const prefix = fieldName.slice(0, 2);
      const dayLetter = getCurrentDayLetter();
      const fieldToCheck = `${prefix}${dayLetter}${selectedField}`;
      return {
        name: primaryData[fieldName],
        isMarked: primaryData[fieldToCheck],
      };
    })
    .sort((a, b) => (a.isMarked === b.isMarked ? 0 : a.isMarked ? -1 : 1))
    .map((student) => student.name);

  const filteredNames = sortedNames.filter((name) =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="h-screen overflow-auto"
      style={{ backgroundColor: currentConfig.color }}>
      <div className="flex justify-center items-center overflow-auto">
        <div className="w-full rounded-lg mx-auto" style={{ maxWidth: "90%" }}>
          <div className="flex flex-col gap-4">
            <div className="w-full">
              <Menu as="div" className="relative inline-block mt-4">
                <div>
                  <Menu.Button className="inline-flex justify-center w-full rounded-md bg-black/20 px-4 py-2 text-sm font-bold text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
                    <h2 className="text-4xl font-bold">
                      {configurations[currentConfigIndex].name}
                    </h2>
                    <ChevronDownIcon
                      className="ml-2 -mr-1 h-10 w-10"
                      aria-hidden="true"
                    />
                  </Menu.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95">
                  <Menu.Items className="absolute mt-2 origin-top divide-y divide-gray-100 rounded-lg bg-gradient-to-b from-gray-100 to-white shadow-xl ring-1 ring-black/5 focus:outline-none flex flex-col items-center z-50">
                    {configurations.map((config, index) => (
                      <Menu.Item key={index}>
                        {({ active }) => (
                          <button
                            onClick={() => setCurrentConfigIndex(index)}
                            className={`${
                              active
                                ? "bg-blue-500 text-white"
                                : "text-gray-900"
                            } flex w-full items-center rounded-lg px-4 py-4 text-2xl font-semibold hover:bg-blue-100 transition-colors duration-200`}>
                            {config.name}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>

            <div className="w-full">
              <Menu as="div" className="relative inline-block mb-4">
                <div>
                  <Menu.Button className="inline-flex justify-center w-full rounded-md bg-black/20 px-4 py-2 text-sm font-bold text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75">
                    <h2 className="text-2xl font-bold">
                      {selectedField
                        ? selectedField
                            .replace(/([A-Z])/g, " $1")
                            .trim()
                            .replace(/\b\w/g, (char) => char.toUpperCase())
                        : "Select Field to Modify"}
                    </h2>
                    <ChevronDownIcon
                      className="ml-2 -mr-1 h-8 w-10"
                      aria-hidden="true"
                    />
                  </Menu.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95">
                  <Menu.Items className="absolute mt-2 origin-top divide-y divide-gray-100 rounded-lg bg-gradient-to-b from-gray-100 to-white shadow-xl ring-1 ring-black/5 focus:outline-none flex flex-col items-center z-50">
                    {currentConfig.fields.map((field, index) => (
                      <Menu.Item key={index}>
                        {({ active }) => (
                          <button
                            onClick={() => setSelectedField(field)}
                            className={`${
                              active
                                ? "bg-blue-500 text-white"
                                : "text-gray-900"
                            } flex w-full items-center rounded-lg px-4 py-4 text-2xl font-semibold hover:bg-blue-100 transition-colors duration-200`}>
                            {field
                              .replace(/([A-Z])/g, " $1")
                              .trim()
                              .replace(/\b\w/g, (char) => char.toUpperCase())}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>

          <div className="w-full max-w-md text-gray-700 bg-white p-5 border rounded-lg shadow-lg mx-auto">
            <input
              type="text"
              placeholder="Search names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 mb-4"
            />
            <div className="flex flex-col gap-4 w-full max-w-md">
              {filteredNames.map((name, index) => {
                const studentIndex = Object.keys(primaryData).find(
                  (key) => primaryData[key] === name
                );

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between">
                    <button
                      className="flex-grow hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg"
                      style={{
                        backgroundColor: primaryData[
                          `${studentIndex.slice(
                            0,
                            2
                          )}${getCurrentDayLetter()}${selectedField}`
                        ]
                          ? currentConfig.color
                          : "#E5E7EB",
                      }}
                      onClick={() => {
                        handleClick(studentIndex);
                      }}>
                      {name}
                    </button>
                    <div className="flex ml-1">
                      {["A", "B", "C", "D", "E"].map((dayLetter) => {
                        const fieldName = `${studentIndex.slice(
                          0,
                          2
                        )}${dayLetter}${selectedField}`;
                        const indicatorColor = primaryData[fieldName]
                          ? currentConfig.color
                          : "#E5E7EB";
                        return (
                          <div
                            key={dayLetter}
                            className="w-4 h-9 rounded-lg mr-1"
                            style={{ backgroundColor: indicatorColor }}></div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      {showConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Unmark Confirmation</h2>
            <p className="mb-4">
              Are you sure you want to unmark this student?
            </p>
            <div className="flex justify-end">
              <button
                class
                Name="bg-red-500 text-white px-4 py-2 rounded mr-2"
                onClick={() =>
                  updateStudentAttendance(studentToUnmark.fieldToUpdate, false)
                }>
                Yes
              </button>
              <button
                className="bg-gray-300 text-black px-4 py-2 rounded"
                onClick={() => setShowConfirmation(false)}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
      <audio ref={audioRef} />
    </div>
  );
}

export default DailyRewards;
