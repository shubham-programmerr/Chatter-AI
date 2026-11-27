import React from 'react';

const AVATAR_GRADIENTS = [
  'from-blue-400 to-blue-600',
  'from-green-400 to-green-600',
  'from-pink-400 to-pink-600',
  'from-orange-400 to-orange-600'
];

const OnlineUsers = ({ users, onViewProfile }) => {
  const onlineUsers = users.filter((user) => user.isOnline);

  return (
    <div className="p-3 md:p-4 bg-gradient-to-b from-white to-gray-50 w-full h-full flex flex-col">
      {/* Header - Always visible */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <div className="flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 animate-pulse"></div>
        <h3 className="font-bold text-gray-800 text-sm md:text-base">
          Online ({onlineUsers.length})
        </h3>
      </div>

      {/* Users List - Scrollable */}
      {onlineUsers.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-sm md:text-base text-center">No users online</p>
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto flex-1 pr-1">
          {onlineUsers.map((user) => {
            const dpUrl = user.profilePicture || user.avatar || null;
            const gradientClass = AVATAR_GRADIENTS[(user.username?.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];
            return (
              <div key={user._id} className="flex items-center gap-2.5 py-2 px-2 rounded-lg hover:bg-blue-50 transition group">
                {dpUrl ? (
                  <button
                    type="button"
                    onClick={() => onViewProfile?.({ username: user.username, dpUrl, gradientClass })}
                    className="rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 hover:scale-105 transition cursor-pointer flex-shrink-0"
                    title={`View ${user.username}'s DP`}
                    aria-label={`View ${user.username}'s profile picture`}
                  >
                    <img
                      src={dpUrl}
                      alt={user.username}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 md:w-9 md:h-9 rounded-full object-cover shadow-md border-2 border-white"
                    />
                  </button>
                ) : (
                  <div
                    className={`flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br ${gradientClass} text-white text-sm font-bold shadow-md flex-shrink-0`}
                  >
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 text-sm md:text-base font-semibold truncate group-hover:text-blue-600 transition">{user.username}</p>
                  <p className="text-xs text-green-600 font-medium">● Online</p>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0 animate-pulse"></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OnlineUsers;
