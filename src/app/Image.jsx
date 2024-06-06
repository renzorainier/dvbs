import React from 'react';
import Image from "next/image";

const BobbingImage = () => {
  return (
    <div className="absolute bottom-0 right-0 mb-10 mr-10 animate-bob">
      <div className="relative h-20 w-140">
        <Image
          src="/firefighter.png"
          alt="Bobbing Image"
          layout="responsive"
          width={140}
          height={140}        />
      </div>
    </div>
  );
};

export default BobbingImage;
