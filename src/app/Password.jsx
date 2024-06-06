import React, { useState } from "react";

const Password = ({
  correctPassword,
  children,
  isVisitorView,
  setIsVisitorView,
}) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handlePinChange = (event) => {
    setPin(event.target.value);
    setError(""); // Clear error message when PIN input changes
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (pin === correctPassword) {
      setIsAuthenticated(true);
    } else {
      setError("Incorrect PIN. Please try again."); // Set error message
      setPin(""); // Clear PIN input after incorrect entry
    }
  };

  const handleVisitorView = () => {
    setIsAuthenticated(true); // Directly set isAuthenticated to true for visitor view
    setIsVisitorView(true); // Set the state indicating visitor view
  };

  return (
    <div className="min-h-screen flex items-center justify-center ">
      {isAuthenticated || isVisitorView ? (
        children
      ) : (
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Restricted Access
          </h1>
          <p className="text-gray-600 mb-6 text-center">
            This feature is intended for authorized users. Enter the password to
            edit data or view as a visitor.
          </p>
          <form onSubmit={handleSubmit}>
            <input
              type="number"
              value={pin}
              onChange={handlePinChange}
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4 w-full text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter PIN"
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg w-full transition duration-200">
              Submit
            </button>
            <button
              onClick={handleVisitorView}
              type="button"
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg w-full mt-4 transition duration-200">
              Enter as Visitor
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Password;
