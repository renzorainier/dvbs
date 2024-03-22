import React, { useState } from "react";

function Buttons(props) {
  const [selectedNames, setSelectedNames] = useState([]);

  const handleClick = (name) => {
    const nameIndex = selectedNames.indexOf(name);

    if (nameIndex === -1) {
      setSelectedNames([...selectedNames, name]);
    } else {
      setSelectedNames([
        ...selectedNames.slice(0, nameIndex),
        ...selectedNames.slice(nameIndex + 1),
      ]);
    }
  };

  const sortedMemberNames = props.memberNames.sort();
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-semibold bg-gray-100 p-5 rounded-md shadow-lg mb-4">
        Members:
      </h2>
      <div className="flex flex-col gap-2 w-full"> {/* Container for buttons */}
        {sortedMemberNames.map((name, index) => (
          <button
            key={index}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl
              ${selectedNames.includes(name) ? "bg-gray-500" : ""}
              text-lg sm:text-xl md:text-2xl w-full mx-4`} // Make buttons full width
            onClick={() => handleClick(name)}
          >
            {name}
          </button>
        ))}
        {/* Since you want these buttons to also be centered and full-width, we don't
            need a special container for them. We'll add them directly in the main container */}
        <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl w-full mx-4">
          Button 1
        </button>
        <button className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl w-full mx-4">
          Button 2
        </button>
      </div>
    </div>
  );
}

export default Buttons;

// {selectedNames.length > 0 && (
//   <>
//     <h3>Selected Names:</h3>
//     <ul>
//       {selectedNames.map((name, index) => (
//         <li key={index}> {name} </li>
//       ))}
//     </ul>
//   </>
// )}
