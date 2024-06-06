import React, { useState } from "react";
import Visitors from "./Visitors";
import Tab from "./Tab";
import Primary from "./Primary";
import InitializeData from "./InitializeData";
import AttendanceChart from "./AttendanceChart";
import StudentOutTime from "./StudentOutTime";
import PointingSystemGraph from "./PointingSystemGraph";
import ScrollToTopButton from "./Scroll";
import Schedule from "./Schedule";
import CopyScheduleData from "./CopyScheduleData";
import DailyRewards from "./DailyRewards";
import SalvationDecision from "./SalvationDecision";
import CopyPreviousDayPoints from "./CopyPreviousDayPoints";
import Store from "./Store";
import CopyDataComponent from "./CopyDataComponent";
import Password from "./Password.jsx";
import StudentPointsRanking from "./StudentPointsRanking"

import { MdOutlineLocalGroceryStore } from "react-icons/md";
import { FaListCheck } from "react-icons/fa6";
import { FiClock } from "react-icons/fi";
import { HiMiniUserGroup } from "react-icons/hi2";
import { FaMedal } from "react-icons/fa";
import { FaCross } from "react-icons/fa";
import { TbDoorExit } from "react-icons/tb";
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
          <div
            className="flex flex-col justify-center items-center h-screen"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0.05))",
              position: "relative",
            }}>
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

  const currentYear = new Date().getFullYear();

  return (
    <div className="fade-in">
      <div className="fade-in">
        <div>
          {renderCurrentComponent()}
        </div>
      </div>
    </div>
  );
}

export default DisplayControl;
