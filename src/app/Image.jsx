import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const BobbingImage = () => {
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) { // Adjust this value according to your screen size
        setShouldRender(false);
      } else {
        setShouldRender(true);
      }
    };

    handleResize(); // Check on initial render
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return shouldRender ? (
    <div className="absolute bottom-0 right-0 animate-bob">
      <div className="relative h-100 w-100"> {/* Adjusted size */}
        <Image
          src="/firefighter.png"
          alt="Bobbing Image"
          layout="responsive"
          width={100} // Adjusted width
          height={100} // Adjusted height
        />
      </div>
    </div>
  ) : null;
};

export default BobbingImage;
