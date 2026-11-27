import React, { useState } from 'react';

const AVATAR_GRADIENTS = [
  'from-blue-400 to-blue-600',
  'from-green-400 to-green-600',
  'from-pink-400 to-pink-600',
  'from-orange-400 to-orange-600'
];

const MessageBubble = ({ message, isCurrentUser, isBot, onReact, onViewProfile }) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '🔥', '👏', '🎉'];

  // Get user display picture or fallback to initial
  const getUserDP = () => {
    return message.sender?.profilePicture || message.sender?.avatar || null;
  };

  const handleReaction = (emoji) => {
    onReact(message._id, emoji);
    setShowReactionPicker(false);
  };

  const getReactionCount = (reaction) => (reaction.users?.length || 0) + (reaction.botReacted ? 1 : 0);

  const getReactionTooltip = (reaction) => {
    const names = [];
    if (reaction.botReacted) names.push('ChatterAI 🤖');
    if (Array.isArray(reaction.users)) {
      reaction.users.filter(Boolean).forEach((u) => {
        if (u.username) names.push(u.username);
      });
    }
    return names.join(', ');
  };

  if (isBot) {
    return (
      <div className="flex justify-start mb-2 md:mb-3 animate-fadeIn group">
        <div className="flex gap-2 md:gap-2 max-w-xs sm:max-w-sm lg:max-w-md xl:max-w-lg">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-7 w-7 md:h-7 md:w-7 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 text-white text-base md:text-base font-bold shadow-md">
              🤖
            </div>
          </div>
          <div className="flex flex-col w-full">
            <p className="text-sm md:text-xs font-bold text-purple-600 mb-1">ChatterAI</p>
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 text-gray-900 px-3 md:px-3 py-1.5 md:py-2 rounded-2xl rounded-tl-sm shadow-sm border border-purple-100">
              <p className="break-words whitespace-pre-wrap text-base md:text-sm leading-relaxed">{message.content}</p>
            </div>
            <p className="text-xs md:text-xs text-gray-400 mt-1">{formatTime(message.createdAt)}</p>
            
            {/* Reactions Section */}
            <div className="flex items-center gap-0.5 mt-1 md:mt-1 flex-wrap">
              {message.reactions && message.reactions.length > 0 && (
                <div className="flex gap-0.5 flex-wrap">
                  {message.reactions.map((reaction, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleReaction(reaction.emoji)}
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gray-100 hover:bg-gray-200 transition text-xs border border-gray-200 hover:border-gray-300"
                      title={getReactionTooltip(reaction)}
                    >
                      <span>{reaction.emoji}</span>
                      <span className="text-gray-600 font-medium text-xs">{getReactionCount(reaction)}</span>
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
                  <div className="absolute bottom-full mb-1 left-0 bg-white border border-gray-300 rounded-lg p-1 shadow-lg flex gap-0.5 z-50">
                    {reactionEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        className="text-base md:text-lg hover:scale-125 transition"
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

  const senderName = message.sender?.username || message.senderUsername || 'User';
  const dpUrl = getUserDP();
  const gradientClass = AVATAR_GRADIENTS[(senderName.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];

  return (
    <div className={`flex mb-2 md:mb-3 animate-fadeIn group ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-2 md:gap-2 max-w-xs sm:max-w-sm lg:max-w-md xl:max-w-lg ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
        <div className="flex-shrink-0">
          <button
            type="button"
            onClick={() => onViewProfile?.({ username: senderName, dpUrl, gradientClass })}
            className="rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 hover:scale-110 active:scale-95 transition cursor-pointer block"
            title={`View ${senderName}'s DP`}
            aria-label={`View ${senderName}'s profile picture`}
          >
            {dpUrl ? (
              <img
                src={dpUrl}
                alt={senderName}
                className="h-7 w-7 md:h-7 md:w-7 rounded-full object-cover shadow-md border-2 border-white"
              />
            ) : (
              <div
                className={`flex items-center justify-center h-7 w-7 md:h-7 md:w-7 rounded-full bg-gradient-to-br ${gradientClass} text-white text-xs font-bold shadow-md`}
              >
                {senderName[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </button>
        </div>
        <div className={`flex flex-col ${isCurrentUser ? '' : 'flex-1'}`}>
          {!isCurrentUser && (
            <p className="text-sm md:text-xs font-bold text-gray-700 mb-0.5">
              {message.sender?.username || 'Unknown'}
            </p>
          )}
          <div
            className={`px-3 md:px-3 py-2 md:py-2 rounded-2xl shadow-sm text-base md:text-sm ${
              isCurrentUser
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none'
                : 'bg-white text-gray-900 rounded-bl-none border border-gray-200'
            }`}
          >
            <p className="break-words whitespace-pre-wrap leading-relaxed text-base md:text-sm">{message.content}</p>
          </div>
          <p className="text-xs text-gray-400 mt-1">{formatTime(message.createdAt)}</p>
          
          {/* Reactions Section */}
          <div className="flex items-center gap-0.5 mt-1 flex-wrap">
            {message.reactions && message.reactions.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {message.reactions.map((reaction, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleReaction(reaction.emoji)}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gray-100 hover:bg-gray-200 transition text-xs border border-gray-200 hover:border-gray-300"
                    title={getReactionTooltip(reaction)}
                  >
                    <span>{reaction.emoji}</span>
                    <span className="text-gray-600 font-medium text-xs">{getReactionCount(reaction)}</span>
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
                  <div className="absolute bottom-full mb-1 left-0 bg-white border border-gray-300 rounded-lg p-1 shadow-lg flex gap-0.5 z-50 flex-wrap max-w-xs">
                  {reactionEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(emoji)}
                      className="text-base md:text-lg hover:scale-125 transition"
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
