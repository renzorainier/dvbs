import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase.js";
import ChildComponent from './ChildComponent'; // Assuming ChildComponent is in the same directory

function Fetch() {
  const [memberNames, setMemberNames] = useState([]);

  useEffect(() => {
    const fetchNames = async () => {
      try {
        const wordRef = doc(db, "men", "members");  // Adjust path if needed
        const wordDoc = await getDoc(wordRef);

        if (wordDoc.exists()) {
          const data = wordDoc.data();
          setMemberNames(data.names);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching data from Firestore:", error);
      }
    };

    fetchNames();
  }, []);

  return (
    <div>
      {memberNames.length > 0 ? (
        <ChildComponent memberNames={memberNames} />  // Pass data as prop
      ) : (
        <div>Loading names...</div>
      )}
    </div>
  );
}

export default Fetch;
