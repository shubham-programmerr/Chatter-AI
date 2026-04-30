import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RoomList = ({ rooms, currentRoomId, onJoinRoom }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const canJoinRoom = (room) => {
    // Public rooms - everyone can join
    if (!room.isPrivate) return true;

    // Private rooms - only owner can join (or anyone if they know the password)
    const isOwner = room.owner?._id === user?._id || room.owner?.toString?.() === user?._id;
    return isOwner;
  };

  const handleRoomClick = (room) => {
    if (canJoinRoom(room)) {
      // If room is password protected, pass that flag to the join handler
      if (onJoinRoom) {
        onJoinRoom(room._id, room.passwordProtected);
      } else {
        navigate(`/chat/${room._id}`);
      }
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs md:text-sm font-bold text-gray-600 px-3 md:px-4 pt-3 md:pt-4 uppercase tracking-wider">Rooms</h3>
      {rooms.length === 0 ? (
        <p className="text-gray-500 text-center py-4 text-xs md:text-sm">No rooms available</p>
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
                className={`w-full text-left px-3 md:px-4 py-2 md:py-3 rounded-lg transition duration-200 text-xs md:text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
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
                    <span className="text-base md:text-lg flex-shrink-0" title="Private room">🔒</span>
                  )}
                  {room.passwordProtected && (
                    <span className="text-base md:text-lg flex-shrink-0" title="Password protected">🔐</span>
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
