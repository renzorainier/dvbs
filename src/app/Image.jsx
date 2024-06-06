import React from 'react';
import Image from "next/image";

const BobbingImage = () => {
  return (
    <div className="flex items-start justify-center h-screen">
      <div className="h-96 w-96 flex items-center justify-center animate-bob" style={{ transform: 'translateY(-50px)' }}>
        <div className="relative h-80 w-80">
          <Image
            src="/pictures/bob.png"
            alt="Bobbing Image"
            layout="fill"
          />
        </div>
      </div>
    </div>
  );
};

export default BobbingImage;
