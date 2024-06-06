import React from 'react';
import Image from "next/image";

const BobbingImage = () => {
  return (
    <div className="flex items-start justify-center h-screen">
      <div className="h-96 w-96 flex items-center justify-center animate-bob" style={{ transform: 'translateY(-50px)' }}>
        <div className="relative h-80 w-80">
          <Image
            src="/firefighter.png"
            alt="Bobbing Image"
            layout="responsive" // Change the layout prop value to "responsive"
            width={80} // Set the width and height explicitly
            height={80}
          />
        </div>
      </div>
    </div>
  );
};

export default BobbingImage;
