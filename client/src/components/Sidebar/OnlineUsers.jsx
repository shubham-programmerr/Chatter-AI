import React from 'react';

const OnlineUsers = ({ users }) => {
  const onlineUsers = users.filter((user) => user.isOnline);

  return (
    <div className="border-t border-gray-200 p-5 bg-gradient-to-b from-white to-gray-50">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-400 animate-pulse"></div>
        <h3 className="font-bold text-gray-800">
          Online ({onlineUsers.length})
        </h3>
      </div>
      {onlineUsers.length === 0 ? (
        <p className="text-gray-500 text-sm italic">No users online</p>
      ) : (
        <div className="space-y-2.5">
          {onlineUsers.map((user) => (
            <div key={user._id} className="flex items-center gap-3 text-sm group cursor-pointer">
              <div className="flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold shadow-sm transform group-hover:scale-110 transition"
                style={{
                  backgroundImage: `linear-gradient(to bottom right, ${
                    ['from-blue-400 to-blue-600', 'from-green-400 to-green-600', 'from-pink-400 to-pink-600', 'from-orange-400 to-orange-600'][
                      (user.username?.charCodeAt(0) || 0) % 4
                    ]
                  })`
                }}>
                {user.username[0]?.toUpperCase()}
              </div>
              <span className="truncate text-gray-700 font-medium group-hover:text-blue-600 transition">{user.username}</span>
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 animate-pulse"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OnlineUsers;
