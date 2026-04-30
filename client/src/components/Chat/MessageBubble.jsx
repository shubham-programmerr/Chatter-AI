import React, { useState } from 'react';

const MessageBubble = ({ message, isCurrentUser, isBot, onReact }) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

  // Get user display picture or fallback to initial
  const getUserDP = () => {
    if (message.sender?.profilePicture) {
      return message.sender.profilePicture;
    }
    return null;
  };

  const handleReaction = (emoji) => {
    onReact(message._id, emoji);
    setShowReactionPicker(false);
  };

  if (isBot) {
    return (
      <div className="flex justify-start mb-4 animate-fadeIn group">
        <div className="flex gap-2 md:gap-3 max-w-xs sm:max-w-sm lg:max-w-md xl:max-w-lg">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-8 w-8 md:h-9 md:w-9 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 text-white text-lg font-bold shadow-md">
              🤖
            </div>
          </div>
          <div className="flex flex-col w-full">
            <p className="text-sm md:text-xs font-bold text-purple-600 mb-1.5">ChatterAI Bot</p>
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 text-gray-900 px-3 md:px-4 py-2 md:py-3 rounded-2xl rounded-tl-sm shadow-sm border border-purple-100">
              <p className="break-words whitespace-pre-wrap text-base md:text-sm leading-relaxed">{message.content}</p>
            </div>
            <p className="text-sm md:text-xs text-gray-400 mt-2">{formatTime(message.createdAt)}</p>
            
            {/* Reactions Section */}
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              {message.reactions && message.reactions.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {message.reactions.map((reaction, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleReaction(reaction.emoji)}
                      className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition text-xs border border-gray-200 hover:border-gray-300"
                      title={reaction.users.map(u => u.username).join(', ')}
                    >
                      <span>{reaction.emoji}</span>
                      <span className="text-gray-600 font-medium text-xs">{reaction.users.length}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Reaction Picker */}
              <div className="relative">
                <button
                  onClick={() => setShowReactionPicker(!showReactionPicker)}
                  className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-gray-200 text-sm"
                  title="Add reaction"
                >
                  😊
                </button>
                
                {showReactionPicker && (
                  <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-300 rounded-lg p-1 md:p-2 shadow-lg flex gap-1 z-50">
                    {reactionEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        className="text-lg md:text-xl hover:scale-125 transition"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex mb-4 animate-fadeIn group ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-2 md:gap-3 max-w-xs sm:max-w-sm lg:max-w-md xl:max-w-lg ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
        <div className="flex-shrink-0">
          {getUserDP() ? (
            <img
              src={getUserDP()}
              alt={message.sender?.username || 'User'}
              className="h-8 w-8 md:h-9 md:w-9 rounded-full object-cover shadow-md border-2 border-white"
            />
          ) : (
            <div className="flex items-center justify-center h-8 w-8 md:h-9 md:w-9 rounded-full bg-gradient-to-br text-white text-xs font-bold shadow-md"
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
        <div className={`flex flex-col ${isCurrentUser ? '' : 'flex-1'}`}>
          {!isCurrentUser && (
            <p className="text-sm md:text-xs font-bold text-gray-700 mb-1.5">
              {message.sender?.username || 'Unknown User'}
            </p>
          )}
          <div
            className={`px-3 md:px-4 py-2 md:py-3 rounded-2xl shadow-sm text-base md:text-sm ${
              isCurrentUser
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none'
                : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
            }`}
          >
            <p className="break-words whitespace-pre-wrap leading-relaxed text-base md:text-sm">{message.content}</p>
          </div>
          <p className="text-xs text-gray-400 mt-2">{formatTime(message.createdAt)}</p>
          
          {/* Reactions Section */}
          <div className="flex items-center gap-1 mt-2 flex-wrap">
            {message.reactions && message.reactions.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {message.reactions.map((reaction, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleReaction(reaction.emoji)}
                    className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition text-xs border border-gray-200 hover:border-gray-300"
                    title={reaction.users.map(u => u.username).join(', ')}
                  >
                    <span>{reaction.emoji}</span>
                    <span className="text-gray-600 font-medium text-xs">{reaction.users.length}</span>
                  </button>
                ))}
              </div>
            )}
            
            {/* Reaction Picker */}
            <div className="relative">
              <button
                onClick={() => setShowReactionPicker(!showReactionPicker)}
                className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-gray-200 text-sm"
                title="Add reaction"
              >
                😊
              </button>
              
              {showReactionPicker && (
                <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-300 rounded-lg p-1 md:p-2 shadow-lg flex gap-1 z-50 flex-wrap max-w-xs">
                  {reactionEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(emoji)}
                      className="text-lg md:text-xl hover:scale-125 transition"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
