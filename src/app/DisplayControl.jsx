import React, { useState } from "react";
import AttendanceChart from "./AttendanceChart";
import PointingSystemGraph from "./PointingSystemGraph";
import Password from "./Password.jsx";
import StudentPointsRanking from "./StudentPointsRanking";

import { FaListCheck } from "react-icons/fa6";
import { BsGraphUpArrow } from "react-icons/bs";

function DisplayControl() {
  const [currentComponent, setCurrentComponent] = useState(null);
  const [isVisitorView, setIsVisitorView] = useState(false);

  const handleButtonClick = (componentName) => {
    setCurrentComponent(componentName);
  };

  const renderCurrentComponent = () => {
    switch (currentComponent) {
      case "Point":
        return (
          <Password
            isVisitorView={isVisitorView}
            setIsVisitorView={setIsVisitorView}
            correctPassword="0000">
            <PointingSystemGraph isVisitorView={isVisitorView} />
          </Password>
        );
      case "Attendance":
        return <AttendanceChart />;
      case "Rank":
        return <StudentPointsRanking />;
      default:
        return (
          <div className="flex flex-col justify-center items-center h-screen">
            <div className="container mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                <button
                  className="focus:outline-none bg-white/5 backdrop-blur-5xl  text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
                  onClick={() => handleButtonClick("Tab")}
                  style={{ animation: "slide-from-left 1s ease forwards" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}>
                    <FaListCheck style={{ fontSize: "3.5em" }} />
                    <span style={{ marginTop: "0.5em" }}>Attendance</span>
                  </div>
                </button>

                <button
                  className="focus:outline-none bg-white/5 backdrop-blur-5xl text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
                  onClick={() => handleButtonClick("Attendance")}
                  style={{ animation: "slide-from-left 1s ease forwards" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}>
                    <BsGraphUpArrow style={{ fontSize: "3.5em" }} />
                    <span style={{ marginTop: "0.5em" }}>List</span>
                  </div>
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
