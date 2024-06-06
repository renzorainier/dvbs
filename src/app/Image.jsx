import React from 'react';
import Image from "next/image";

const BobbingImage = () => {
  return (
    <div className="absolute bottom-0 right-0 mb-10 mr-10 animate-bob">
      <div className="relative h-80 w-80">
        <Image
          src="/firefighter.png"
          alt="Bobbing Image"
          layout="responsive"
          width={80}
          height={80}
        />
      </div>
    </div>
  );
};

export default BobbingImage;
