import React from 'react';

const MessageBubble = ({ message, isCurrentUser, isBot }) => {
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get user display picture or fallback to initial
  const getUserDP = () => {
    if (message.sender?.profilePicture) {
      return message.sender.profilePicture;
    }
    return null;
  };

  if (isBot) {
    return (
      <div className="flex justify-start mb-4 animate-fadeIn">
        <div className="flex gap-3 max-w-xs lg:max-w-md xl:max-w-lg">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 text-white text-lg font-bold shadow-md">
              🤖
            </div>
          </div>
          <div className="flex flex-col">
            <p className="text-xs font-bold text-purple-600 mb-1.5">ChatterAI Bot</p>
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 text-gray-900 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-purple-100">
              <p className="break-words whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            </div>
            <p className="text-xs text-gray-400 mt-2">{formatTime(message.createdAt)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex mb-4 animate-fadeIn ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-xs lg:max-w-md xl:max-w-lg ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
        <div className="flex-shrink-0">
          {getUserDP() ? (
            <img
              src={getUserDP()}
              alt={message.sender?.username || 'User'}
              className="h-9 w-9 rounded-full object-cover shadow-md border-2 border-white"
            />
          ) : (
            <div className="flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-br text-white text-xs font-bold shadow-md"
              style={{
                backgroundImage: `linear-gradient(to bottom right, ${
                  ['from-blue-400 to-blue-600', 'from-green-400 to-green-600', 'from-pink-400 to-pink-600', 'from-orange-400 to-orange-600'][
                    (message.sender?.username?.charCodeAt(0) || 0) % 4
                  ]
                })`
              }}>
              {message.sender?.username?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <div className={isCurrentUser ? '' : 'flex-1'}>
          {!isCurrentUser && (
            <p className="text-xs font-bold text-gray-700 mb-1.5">
              {message.sender?.username || 'Unknown User'}
            </p>
          )}
          <div
            className={`px-4 py-3 rounded-2xl shadow-sm ${
              isCurrentUser
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none'
                : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
            }`}
          >
            <p className="break-words whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
          </div>
          <p className="text-xs text-gray-400 mt-2">{formatTime(message.createdAt)}</p>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
