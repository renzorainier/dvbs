"use client";

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
import StudentPointsRanking from "./StudentPointsRanking";
import DisplayControl from "./DisplayControl";
import BobbingImage from "./Image";
import Weather from "./Weather";

import { MdOutlineLocalGroceryStore } from "react-icons/md";
import { FaListCheck } from "react-icons/fa6";
import { FiClock } from "react-icons/fi";
import { HiMiniUserGroup } from "react-icons/hi2";
import { FaMedal } from "react-icons/fa";
import { FaCross } from "react-icons/fa";
import { TbDoorExit } from "react-icons/tb";
import { BsGraphUpArrow } from "react-icons/bs";
import { FiMonitor } from "react-icons/fi";

function Main() {
  const [currentComponent, setCurrentComponent] = useState(null);
  const [isVisitorView, setIsVisitorView] = useState(false);

  const handleButtonClick = (componentName) => {
    setCurrentComponent(componentName);
  };

  const handleBackButtonClick = () => {
    setCurrentComponent(null);
    setIsVisitorView(false);
  };

  const renderCurrentComponent = () => {
    switch (currentComponent) {
      case "Tab":
        return <Tab />;
      case "Out":
        return (
          <Password
            isVisitorView={isVisitorView}
            setIsVisitorView={setIsVisitorView}
            correctPassword="1111">
            <StudentOutTime isVisitorView={isVisitorView} />;
          </Password>
        );

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
      case "Schedule":
        return <Schedule />;
      case "Rewards":
        return <DailyRewards />;
      case "SalvationDecision":
        return <SalvationDecision />;
      case "Rank":
        return <StudentPointsRanking />;
      case "Store":
        return (
          <Password
            isVisitorView={isVisitorView}
            setIsVisitorView={setIsVisitorView}
            correctPassword="2024">
            <Store isVisitorView={isVisitorView} />
          </Password>
        );
      case "DisplayControl":
        return (
          <Password
            isVisitorView={isVisitorView}
            setIsVisitorView={setIsVisitorView}
            correctPassword="0000">
            <DisplayControl isVisitorView={isVisitorView} />
          </Password>
        );

      default:
        return (
          <div
            className="flex flex-col justify-center items-center h-screen relative overflow-hidden"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,1), rgba(0,0,0,0.05))",
            }}>
            <div className="text-white text-center mb-4 relative z-10">
              <h1 className="font-bold text-9xl">
                <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-transparent bg-clip-text">
                  Re
                </span>

                <span className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 text-transparent bg-clip-text">
                  scue
                </span>
              </h1>
              <h1 className="font-bold text-9xl">
                <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-transparent bg-clip-text">
                  Z
                </span>
                <span className="bg-gradient-to-r from-orange-500 via-yellow-500 to-red-500 text-transparent bg-clip-text">
                  one
                </span>
              </h1>
              <h3 className="text-3xl font-bold ">D V B S &nbsp;2 0 2 4</h3>
            </div>
            <div className="container mx-auto mb-5 relative z-10">
              <Weather />
            </div>
            <div className="container mx-auto relative z-10">
              <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                <button
                  className="focus:outline-none  bg-white-500 backdrop-blur-lg  text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
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
                  className="focus:outline-none bg-white-500 backdrop-blur-lg  text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
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

                <button
                  className="focus:outline-none bg-white-500 backdrop-blur-lg  text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
                  onClick={() => handleButtonClick("Schedule")}
                  style={{ animation: "slide-from-left 1s ease forwards" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}>
                    <FiClock style={{ fontSize: "3.5em" }} />{" "}
                    <span style={{ marginTop: "0.5em" }}>Schedule</span>
                  </div>
                </button>

                <button
                  className="focus:outline-none bg-white-500 backdrop-blur-lg  text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
                  onClick={() => handleButtonClick("Point")}
                  style={{ animation: "slide-from-left 1s ease forwards" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}>
                    <HiMiniUserGroup style={{ fontSize: "3.5em" }} />{" "}
                    <span style={{ marginTop: "0.5em" }}>Points</span>
                  </div>
                </button>

                <button
                  className="focus:outline-none bg-white-500 backdrop-blur-lg  text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
                  onClick={() => handleButtonClick("Rewards")}
                  style={{ animation: "slide-from-left 1s ease forwards" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}>
                    <FaMedal style={{ fontSize: "3.5em" }} />{" "}
                    <span style={{ marginTop: "0.5em" }}>Rewards</span>
                  </div>
                </button>

                <button
                  className="focus:outline-none bg-white-500 backdrop-blur-lg   text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
                  onClick={() => handleButtonClick("SalvationDecision")}
                  style={{ animation: "slide-from-left 1s ease forwards" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}>
                    <FaCross style={{ fontSize: "3.5em" }} />{" "}
                    <span style={{ marginTop: "0.5em" }}>Salvation</span>
                  </div>
                </button>
                <button
                  className="focus:outline-none bg-white-500 backdrop-blur-lg  text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
                  onClick={() => handleButtonClick("Store")}
                  style={{ animation: "slide-from-left 1s ease forwards" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}>
                    <MdOutlineLocalGroceryStore style={{ fontSize: "3.5em" }} />{" "}
                    <span style={{ marginTop: "0.5em" }}>Store</span>
                  </div>
                </button>

                <button
                  className="focus:outline-none bg-white-500 backdrop-blur-lg  text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
                  onClick={() => handleButtonClick("Out")}
                  style={{ animation: "slide-from-left 1s ease forwards" }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}>
                    <TbDoorExit style={{ fontSize: "3.5em" }} />{" "}
                    <span style={{ marginTop: "0.5em" }}>Out</span>
                  </div>
                </button>
              </div>
            </div>
            <BobbingImage />
          </div>
        );
    }
  };

  // Style the back button with modern UI
  const backButton = currentComponent ? (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        className="bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2"
        onClick={handleBackButtonClick}>
        <svg
          className="w-6 h-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
          style={{ transform: "rotate(270deg)" }}>
          <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </div>
  ) : null;

  const currentYear = new Date().getFullYear();

  return (
    <div className="fade-in">
      <div className="fade-in">
        <div>
          {backButton}
          {/* <ScrollToTopButton /> */}
          {renderCurrentComponent()}
          {/* <StudentPointsRanking/> */}
          {/* <AttendanceChart/> */}
          {/* <CopyDataComponent />; */}
          {/* <CopyScheduleData/> */}
          {/* <Analytics />  */}
        </div>
      </div>
    </div>
  );
}

export default Main;

{
  /* <button
className="focus:outline-none bg-white-500 backdrop-blur-lg  text-white font-semibold py-4 px-6 rounded-lg shadow-lg transition duration-300 transform hover:scale-105"
onClick={() => handleButtonClick("DisplayControl")}
style={{ animation: "slide-from-left 1s ease forwards" }}>
<div
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  }}>
  <FiMonitor style={{ fontSize: "3.5em" }} />{" "}
  <span style={{ marginTop: "0.5em" }}>DisplayControl</span>
</div>
</button> */
}

// "use client";

// import React from "react";
// import Visitors from "./Visitors";
// import Tab from "./Tab";
// import Primary from "./Primary"
// import InitializeData from "./InitializeData"
// import AttendanceChart from "./AttendanceChart"
// import StudentOutTime from "./StudentOutTime"
// import PointingSystemGraph from "./PointingSystemGraph"

// function Main({ configurations, currentConfigIndex, setCurrentConfigIndex  }) {
//   return (
//     <div>
//       <AttendanceChart/>
// <Tab configurations={configurations} currentConfigIndex={currentConfigIndex}
//   setCurrentConfigIndex={setCurrentConfigIndex}/>
//       <StudentOutTime/>
//       <PointingSystemGraph/>

//     </div>
//   );
// }

// export default Main;
