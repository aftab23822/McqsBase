import React from 'react';

const PakistanFlag = ({ className = "w-6 h-6" }) => {
  return (
    <div className={`${className} flex items-center justify-center`}>
      <img 
        src="/pakistan_flag.svg" 
        alt="Pakistan Flag" 
        className="w-full h-full object-contain"
      />
    </div>
  );
};

export default PakistanFlag; 