import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RoomList = ({ rooms, currentRoomId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const canJoinRoom = (room) => {
    // Public rooms - everyone can join
    if (!room.isPrivate) return true;

    // Private rooms - only owner can join
    const isOwner = room.owner?._id === user?._id || room.owner?.toString?.() === user?._id;
    return isOwner;
  };

  const handleRoomClick = (room) => {
    if (canJoinRoom(room)) {
      navigate(`/chat/${room._id}`);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-gray-600 px-4 pt-4 uppercase tracking-wider">Rooms</h3>
      {rooms.length === 0 ? (
        <p className="text-gray-500 text-center py-4 text-sm">No rooms available</p>
      ) : (
        <div className="space-y-1 px-2">
          {rooms.map((room) => {
            const isCurrentRoom = currentRoomId === room._id;
            const canJoin = canJoinRoom(room);

            return (
              <button
                key={room._id}
                onClick={() => handleRoomClick(room)}
                disabled={!canJoin}
                className={`w-full text-left px-4 py-3 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isCurrentRoom
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : canJoin
                    ? 'text-gray-700 hover:bg-gray-100 group'
                    : 'text-gray-500 cursor-not-allowed bg-gray-50'
                }`}
                title={!canJoin ? 'Private room - Owner only' : ''}
              >
                <div className="flex items-center gap-2">
                  <p className={`font-semibold truncate flex-1 ${isCurrentRoom ? '' : 'group-hover:text-blue-600 transition'}`}>
                    #{room.name}
                  </p>
                  {room.isPrivate && (
                    <span className="text-lg" title="Private room">🔒</span>
                  )}
                </div>
                <p className={`text-xs truncate opacity-75 ${isCurrentRoom ? 'text-blue-100' : 'text-gray-500'}`}>
                  {room.description || 'No description'}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RoomList;
