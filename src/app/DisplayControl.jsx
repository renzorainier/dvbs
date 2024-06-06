import React, { useState, useEffect } from "react";
import { collection, onSnapshot, doc } from "firebase/firestore";
import { db2 } from "./firebaseConfig2.js";
import AttendanceChart from "./AttendanceChart";
import PointingSystemGraph from "./PointingSystemGraph";
import Password from "./Password.jsx";
import StudentPointsRanking from "./StudentPointsRanking";

import { FaListCheck } from "react-icons/fa6";
import { BsGraphUpArrow } from "react-icons/bs";

function DisplayControl() {
  const [currentComponent, setCurrentComponent] = useState(null);
  const [isVisitorView, setIsVisitorView] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, "points", "monitor1");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log("Document data:", docSnap.data());
      } else {
        console.log("No such document!");
      }
    };

    fetchData();
  }, []);

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
            <div className="container mx-auto"></div>
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
