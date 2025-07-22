import React, { useEffect, useState } from 'react';

const Notification = ({ messages, onClose }) => {
  if (!messages || messages.length === 0) {
    return null; // Don't render if no messages
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end space-y-2 pointer-events-none">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`
            p-3 rounded-lg shadow-md flex items-center justify-between
            transition-all duration-300 ease-in-out transform translate-x-0 opacity-100
            ${
              msg.type === 'success' ? 'bg-green-500' :
              msg.type === 'fail' || msg.type === 'error' || msg.type === 'warning' ? 'bg-yellow-500' :
              'bg-gray-700'
            }
            text-white max-w-xs w-full pointer-events-auto
          `}
          role="alert"
        >
          <div className="flex-grow">
            <p className="font-semibold">{msg.text}</p>
            {msg.details && <p className="text-sm opacity-90 mt-1">{msg.details}</p>}
          </div>
          <button
            onClick={() => onClose(msg.id)}
            className="ml-4 text-white hover:text-gray-200 focus:outline-none p-1 rounded-full hover:bg-white hover:bg-opacity-20"
            aria-label="Close notification"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

export default Notification;
