import React from 'react';

const BobbingImage = () => {
  return (
    <div className="relative flex items-start justify-center h-screen">
      <div className="absolute inset-0 bg-cover bg-center animate-bob" style={{ backgroundImage: 'url("/firefighter.png")' }}>
        {/* Empty div to maintain the aspect ratio */}
        <div className="relative h-full w-full"></div>
      </div>
      <div className="relative z-10 flex items-center justify-center h-full">
        {/* Your other components */}
        <div className="h-96 w-96 flex items-center justify-center animate-bob" style={{ transform: 'translateY(-50px)' }}>
          {/* Your component content */}
        </div>
      </div>
    </div>
  );
};

export default BobbingImage;
