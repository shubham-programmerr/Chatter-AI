import React from 'react';

const TypingIndicator = ({ users }) => {
  return (
    <div className="flex items-center gap-2 text-gray-500 pl-3">
      <span className="text-sm font-medium">
        {users.length === 1
          ? `${users[0]} is typing`
          : `${users.slice(0, -1).join(', ')} and ${users[users.length - 1]} are typing`}
      </span>
      <div className="flex gap-1.5">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
      </div>
    </div>
  );
};

export default TypingIndicator;
