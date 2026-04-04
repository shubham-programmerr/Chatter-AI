import React from 'react';

const BotMessage = ({ message }) => {
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex justify-start mb-4 animate-fadeIn">
      <div className="flex gap-3 max-w-2xl">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xl font-bold shadow-lg animate-pulse-glow">
            🤖
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-bold text-transparent bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text">ChatterAI Bot</p>
            <span className="text-xs bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 px-2.5 py-1 rounded-full font-semibold">⚡ AI</span>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 text-gray-900 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm hover:shadow-md transition-shadow">
            <p className="break-words whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>

            {/* Bot features indicator */}
            <div className="mt-3 pt-3 border-t border-purple-200 text-xs text-gray-600 flex gap-3 flex-wrap">
              <span className="flex items-center gap-1">✨ Powered by Groq AI</span>
              <span className="flex items-center gap-1">⚡ Instant response</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">{formatTime(message.createdAt)}</p>
        </div>
      </div>
    </div>
  );
};

export default BotMessage;
