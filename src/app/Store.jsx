import React, { useState, useEffect, Fragment } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "./firebase.js"; // Import your Firebase config
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

function Store() {
  const [students, setStudents] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPoints, setCurrentPoints] = useState(null);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [showPoints, setShowPoints] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "dvbs"));
        const studentData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const currentDayLetter = getCurrentDayLetter();
        const presentStudents = studentData
          .map((group) => {
            const groupStudents = [];
            for (const key in group) {
              if (key.endsWith(currentDayLetter)) {
                const prefix = key.slice(0, 2);
                const inTimeField = `${prefix}${currentDayLetter}`;
                const pointsField = `${prefix}${currentDayLetter}points`;
                if (group[inTimeField]) {
                  groupStudents.push({
                    id: group.id,
                    prefix,
                    inTimeField,
                    pointsField,
                    name: group[`${prefix}name`],
                    location: group[`${prefix}loc`],
                    points: group[pointsField],
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
    return days[dayIndex === 0 ? 6 : dayIndex - 1];
  };

  const handleClick = (student) => {
    setCurrentPoints(student.points);
    setCurrentStudent(student);
    setShowPoints(true);
    setPaymentStatus(null); // Reset payment status when showing points
  };

  const handleLocationChange = (location) => {
    setSelectedLocation(location);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handlePayment = async () => {
    const amount = parseFloat(paymentAmount);
    if (currentStudent && !isNaN(amount) && amount > 0) {
      const newPoints = currentPoints - amount;
      if (newPoints < 0) {
        setPaymentStatus("Insufficient points"); // Show warning text
        return;
      }
      const docRef = doc(db, "dvbs", currentStudent.id);
      const pointsField = currentStudent.pointsField;

      try {
        await updateDoc(docRef, {
          [pointsField]: newPoints,
        });

        setCurrentPoints(newPoints);
        setStudents((prevStudents) =>
          prevStudents.map((student) =>
            student.id === currentStudent.id &&
            student.prefix === currentStudent.prefix
              ? { ...student, points: newPoints }
              : student
          )
        );
        setPaymentAmount("");
        setPaymentStatus("Payment complete"); // Show payment complete text
      } catch (error) {
        console.error("Error updating points: ", error);
      }
    } else {
      setPaymentStatus("Please enter a valid amount"); // Show warning text
    }
  };

  const filteredStudents = students
    .filter((student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((student) =>
      selectedLocation ? student.location === selectedLocation : true
    );

  return (
    <div className="bg-[#9ca3af] h-screen overflow-auto">
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

          <div className="w-full max-w-md text-gray-700 bg-white mt-5 p-5 border rounded-lg shadow-lg mx-auto">
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
                  className="flex-1 text-white font-bold py-2 px-4 rounded-lg bg-gray-400 hover:bg-gray-700"
                  onClick={() => handleClick(student)}>
                  {student.name}
                </button>
              </div>
            ))}
          </div>

          {showPoints && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="fixed inset-0 bg-black opacity-50"
                onClick={() => setShowPoints(false)}
              />
              <div className="bg-white rounded-lg p-5 shadow-md z-10 flex flex-col items-center">
                <p className="text-xl font-bold mb-2">
                  Points: {currentPoints}
                </p>
                {paymentStatus && (
                  <p className={`mb-2 ${paymentStatus === "Payment complete" ? "text-green-500" : "text-red-500"}`}>{paymentStatus}</p>
                )} {/* Show payment status */}
                <input
                  type="number"
                  className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
                  placeholder="Enter points to pay"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
                <button
                  className="bg-green-500 text-white font-bold py-2 px-4 rounded mb-4"
                  onClick={handlePayment}>
                  Confirm Payment
                </button>
                <button
                  className="bg-blue-500 text-white font-bold py-2 px-4 rounded"
                  onClick={() => {
                    setShowPoints(false);
                    setPaymentStatus(null);
                  }}>
                  OK
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Store;
