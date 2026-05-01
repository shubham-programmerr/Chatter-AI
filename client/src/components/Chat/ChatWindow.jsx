import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

const ChatWindow = ({ messages, typing, currentUser, onSendMessage, onReact }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-2 min-h-0 pb-20 md:pb-0">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center px-4">
              <div className="text-4xl md:text-5xl mb-3">💬</div>
              <p className="text-gray-400 text-base md:text-lg">No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg._id}
                message={msg}
                isCurrentUser={msg.sender?._id === currentUser?._id}
                isBot={msg.isBot}
                onReact={onReact}
              />
            ))}
          </>
        )}
        {typing.length > 0 && (
          <div className="py-2">
            <TypingIndicator users={typing} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom on mobile, relative on desktop */}
      <div className="border-t border-gray-200 p-2 md:p-6 bg-white shadow-lg flex-shrink-0 fixed md:relative bottom-0 left-0 right-0 z-10 md:z-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
        <form onSubmit={handleSubmit} className="space-y-1 md:space-y-3 max-w-7xl mx-auto">
          <div className="flex gap-2 md:gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 rounded-full px-3 md:px-5 py-2 md:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-gray-50 text-gray-800 text-sm md:text-sm"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 md:px-8 py-2 md:py-3 rounded-full transition font-semibold shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 text-sm md:text-base flex-shrink-0"
            >
              Send
            </button>
          </div>
          <p className="text-xs md:text-sm text-gray-500 flex items-center gap-1 px-1 hidden md:flex">
            <span>💡</span> Tip: Type @bot followed by your question to get AI assistance!
          </p>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
