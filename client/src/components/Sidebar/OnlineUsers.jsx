import React from 'react';

const OnlineUsers = ({ users }) => {
  const onlineUsers = users.filter((user) => user.isOnline);

  return (
    <div className="p-2 md:p-3 bg-gradient-to-b from-white to-gray-50 w-full">
      <div className="flex items-center gap-1.5 md:gap-2 mb-2">
        <div className="flex items-center justify-center w-4 h-4 md:w-5 md:h-5 rounded-full bg-green-400 animate-pulse"></div>
        <h3 className="font-bold text-gray-800 text-sm md:text-xs">
          Online ({onlineUsers.length})
        </h3>
      </div>
      {onlineUsers.length === 0 ? (
        <p className="text-gray-500 text-sm md:text-xs italic">No users online</p>
      ) : (
        <div className="space-y-1">
          {onlineUsers.map((user) => (
            <div key={user._id} className="flex items-center gap-1.5 md:gap-2 py-1.5 px-1 rounded hover:bg-blue-50 transition">
              <div className="flex items-center justify-center w-6 h-6 md:w-5 md:h-5 rounded-full text-white text-xs font-bold shadow-sm flex-shrink-0"
                style={{
                  backgroundImage: `linear-gradient(to bottom right, ${
                    ['from-blue-400 to-blue-600', 'from-green-400 to-green-600', 'from-pink-400 to-pink-600', 'from-orange-400 to-orange-600'][
                      (user.username?.charCodeAt(0) || 0) % 4
                    ]
                  })`
                }}>
                {user.username[0]?.toUpperCase()}
              </div>
              <span className="truncate text-gray-700 text-xs md:text-xs flex-1">{user.username}</span>
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 animate-pulse"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OnlineUsers;
