import React from 'react';
import { useNavigate } from 'react-router-dom';

const RoomList = ({ rooms, currentRoomId }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-gray-600 px-4 pt-4 uppercase tracking-wider">Rooms</h3>
      {rooms.length === 0 ? (
        <p className="text-gray-500 text-center py-4 text-sm">No rooms available</p>
      ) : (
        <div className="space-y-1 px-2">
          {rooms.map((room) => (
            <button
              key={room._id}
              onClick={() => navigate(`/chat/${room._id}`)}
              className={`w-full text-left px-4 py-3 rounded-lg transition duration-200 ${
                currentRoomId === room._id
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100 group'
              }`}
            >
              <p className={`font-semibold truncate ${currentRoomId === room._id ? '' : 'group-hover:text-blue-600 transition'}`}>
                #{room.name}
              </p>
              <p className={`text-xs truncate opacity-75 ${currentRoomId === room._id ? 'text-blue-100' : 'text-gray-500'}`}>
                {room.description || 'No description'}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomList;
