import React, { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore"; // Changed getDocs to onSnapshot
import { db } from "./firebase.js";

const StudentRanking = () => {
  const [groupedStudents, setGroupedStudents] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "dvbs"), (querySnapshot) => {
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
              const pointsField = `${prefix}${currentDayLetter}points`;
              if (group[pointsField]) {
                groupStudents.push({
                  id: group.id,
                  group: group.id,
                  prefix,
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

      console.log("Fetched Students:", presentStudents);

      // Sort students by points from highest to lowest
      presentStudents.sort((a, b) => b.points - a.points);

      // Group students by their group (document name)
      const groups = presentStudents.reduce((acc, student) => {
        if (!acc[student.group]) {
          acc[student.group] = [];
        }
        acc[student.group].push(student);
        return acc;
      }, {});

      // Group students by their ranks within each group
      const groupedByRank = {};
      for (const group in groups) {
        let rank = 0;
        let currentRankPoints = null;
        let currentRankStudents = 0;
        let rankIndex = 0;
        groupedByRank[group] = {};
        groups[group].forEach((student) => {
          if (student.points !== currentRankPoints) {
            rank++;
            currentRankPoints = student.points;
            currentRankStudents = 0;
            rankIndex = 0;
          }
          if (currentRankStudents < 5 && rank <= 5) {
            if (!groupedByRank[group][rank]) {
              groupedByRank[group][rank] = [];
            }
            groupedByRank[group][rank].push(student);
            currentRankStudents++;
            rankIndex++;
          }
        });
      }

      setGroupedStudents(groupedByRank);
      setLoading(false);
    });

    return () => {
      // Unsubscribe from the snapshot listener when the component unmounts
      unsubscribe();
    };
  }, []);

  const getCurrentDayLetter = () => {
    const days = ["A", "B", "C", "D", "E"];
    const dayIndex = new Date().getDay();
    return days[dayIndex >= 1 && dayIndex <= 5 ? dayIndex - 1 : 4];
  };

  const getBackgroundColor = (group) => {
    switch (group) {
      case "primary":
        return "#FFC100";
      case "middlers":
        return "#04d924";
      case "juniors":
        return "#027df7";
      case "youth":
        return "#f70233";
      default:
        return "#FFFFFF";
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-[#9ca3af] h-screen  overflow-auto">
      <div className="flex justify-center items-center overflow-auto">
        <div className="w-full rounded-lg mx-auto">
          {Object.keys(groupedStudents).map((group) => (
            <div
              key={group}
              className="w-full max-w-full text-gray-700 bg-white  p-5 border rounded-lg shadow-lg"
            >
              <h2 className="text-9xl font-bold mb-4">{group} Ranking</h2>
              {Object.keys(groupedStudents[group]).map((rank) => (
                parseInt(rank) <= 5 && (
                  <div key={rank} className="mb-4 flex items-center  bg-gray-100 rounded-lg shadow-md">
                  <div className="text-9xl font-extrabold text-black-700 mb-2 flex-shrink-0 mr-4">
                    {rank}
                  </div>
                  <div className="flex-grow">
                    <div className="flex flex-wrap">
                      {groupedStudents[group][rank].map((student) => (
                        <div
                          key={`${student.id}-${student.prefix}`}
                          className="flex items-center m-2 w-full"
                        >
                          <div
                            className="flex-grow p-4 rounded-l-lg shadow-md text-white font-bold text-5xl"
                            style={{
                              backgroundColor: getBackgroundColor(student.group),
                            }}
                          >
                            {student.name}
                          </div>
                          <div className="flex-shrink-0 ml-auto bg-black p-4 rounded-r-lg shadow-md text-white font-bold text-5xl">
                            {student.points}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                )
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentRanking;
