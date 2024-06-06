import React from 'react';
import Image from "next/image";

const BobbingImage = () => {
  return (
    <div className="absolute bottom-0 right-0 animate-bob">
      <div className="relative h-100 w-100"> {/* Adjusted size */}
        <Image
          src="/firefighter.png"
          alt="Bobbing Image"
          // layout="responsive"
          width={100} // Adjusted width
          height={100} // Adjusted height
        />
      </div>
    </div>
  );
};

export default BobbingImage;
