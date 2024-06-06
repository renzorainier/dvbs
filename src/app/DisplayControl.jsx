import React, { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db2 } from "./firebaseConfig2"; // Adjust the path if necessary
import AttendanceChart from "./AttendanceChart";
import PointingSystemGraph from "./PointingSystemGraph";
import Password from "./Password.jsx";
import StudentPointsRanking from "./StudentPointsRanking";

import { FaListCheck } from "react-icons/fa6";
import { BsGraphUpArrow } from "react-icons/bs";

function DisplayControl({isVisitorView}) {
  const [currentComponent, setCurrentComponent] = useState(null);
  const [isVisitorView, setIsVisitorView] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState("");
  const [monitorData, setMonitorData] = useState(null);

  useEffect(() => {
    if (selectedMonitor) {
      const docRef = doc(db2, "points", selectedMonitor);

      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          console.log("Document data:", docSnap.data());
          setMonitorData(docSnap.data());
          setCurrentComponent(docSnap.data().component); // Set current component based on fetched data
        } else {
          console.log("No such document!");
          setMonitorData(null);
        }
      });

      return () => unsubscribe(); // Clean up the subscription on unmount
    }
  }, [selectedMonitor]);

  const handleMonitorClick = (monitor) => {
    setSelectedMonitor(monitor);
  };

  const renderCurrentComponent = () => {
    switch (currentComponent) {
      case "Point":
        return (

            <PointingSystemGraph isVisitorView={false} />

        );
      case "Attendance":
        return <AttendanceChart />;
      case "Rank":
        return <StudentPointsRanking />;
      default:
        return (
          <div className="flex flex-col justify-center items-center h-screen">
            <div className="container mx-auto">
              <div className="flex justify-center mb-4">
                <button
                  onClick={() => handleMonitorClick("monitor1")}
                  className={`m-2 p-2 rounded ${
                    selectedMonitor === "monitor1"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Monitor 1
                </button>
                <button
                  onClick={() => handleMonitorClick("monitor2")}
                  className={`m-2 p-2 rounded ${
                    selectedMonitor === "monitor2"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Monitor 2
                </button>
                <button
                  onClick={() => handleMonitorClick("monitor3")}
                  className={`m-2 p-2 rounded ${
                    selectedMonitor === "monitor3"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Monitor 3
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fade-in">
      <div className="fade-in">

        <div>{renderCurrentComponent()}</div>
      </div>
    </div>
  );
}

export default DisplayControl;
