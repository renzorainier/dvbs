import React from 'react';
import Image from "next/image";

const BobbingImage = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden animate-bob z-0">
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
