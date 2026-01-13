import React from "react";

const CEBadge = () => {
  return (
    <div className="flex items-center gap-2 group sm:gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-105 sm:h-10 sm:w-10 sm:rounded-xl">
        {/* <Zap className="h-4 w-4 sm:h-5 sm:w-5" /> */}
        <h1 className="font-bold">CE</h1>
      </div>
    
    </div>
  );
};

export default CEBadge;
