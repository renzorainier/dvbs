import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase.js';

const StudentRanking = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'dvbs'));
        const studentData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        const currentDayLetter = getCurrentDayLetter();
        const presentStudents = studentData
          .map(group => {
            const groupStudents = [];
            for (const key in group) {
              if (key.endsWith(currentDayLetter)) {
                const prefix = key.slice(0, 2);
                const pointsField = `${prefix}${currentDayLetter}points`;
                if (group[pointsField]) {
                  groupStudents.push({
                    id: group.id,
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

        // Sort students alphabetically by name
        presentStudents.sort((a, b) => a.name.localeCompare(b.name));

        setStudents(presentStudents);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching students: ', error);
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const getCurrentDayLetter = () => {
    const days = ['A', 'B', 'C', 'D', 'E'];
    const dayIndex = new Date().getDay();
    return days[dayIndex >= 1 && dayIndex <= 5 ? dayIndex - 1 : 4];
  };

  return (
    <div className="bg-[#9ca3af] h-screen overflow-auto">
      <div className="flex justify-center items-center overflow-auto">
        <div className="w-full rounded-lg mx-auto" style={{ maxWidth: '90%' }}>
          <div className="w-full max-w-md text-gray-700 bg-white mt-5 p-5 border rounded-lg shadow-lg mx-auto">
            <input
              type="text"
              className="w-full p-2 mb-4 border border-gray-300 rounded-lg"
              placeholder="Search by name"
              value={''}
              // onChange={handleSearchChange}
            />

            {students.map(student => (
              <div
                key={`${student.id}-${student.prefix}`}
                className="flex items-center mb-4"
              >
                <button
                  className="flex-1 text-white font-bold py-2 px-4 rounded-lg bg-gray-400 hover:bg-gray-700"
                  onClick={() => {}}
                >
                  {student.name}
                </button>

                {/* Add colored div */}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentRanking;
