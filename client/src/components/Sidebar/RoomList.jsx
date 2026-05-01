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
    <div className="space-y-1 md:space-y-0.5">
      <h3 className="text-sm md:text-xs font-bold text-gray-600 px-2 md:px-3 pt-2 md:pt-3 uppercase tracking-wider">Rooms</h3>
      {rooms.length === 0 ? (
        <p className="text-gray-500 text-center py-3 md:py-2 text-sm md:text-xs">No rooms</p>
      ) : (
        <div className="space-y-0.5 md:space-y-0 px-1 md:px-1.5">
          {rooms.map((room) => {
            const isCurrentRoom = currentRoomId === room._id;
            const canJoin = canJoinRoom(room);

            return (
              <button
                key={room._id}
                onClick={() => handleRoomClick(room)}
                disabled={!canJoin}
                className={`w-full text-left px-2 md:px-2.5 py-2 md:py-1.5 rounded-md transition duration-200 text-sm md:text-xs disabled:opacity-50 disabled:cursor-not-allowed ${
                  isCurrentRoom
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                    : canJoin
                    ? 'text-gray-700 hover:bg-gray-100 group'
                    : 'text-gray-500 cursor-not-allowed bg-gray-50'
                }`}
                title={!canJoin ? 'Private room - Owner only' : ''}
              >
                <div className="flex items-center gap-1 md:gap-1.5">
                  <p className={`font-semibold truncate flex-1 text-sm ${
                    isCurrentRoom ? '' : 'group-hover:text-blue-600 transition'
                  }`}>
                    #{room.name}
                  </p>
                  {room.isPrivate && (
                    <span className="text-sm flex-shrink-0" title="Private room">🔒</span>
                  )}
                  {room.passwordProtected && (
                    <span className="text-sm flex-shrink-0" title="Password protected">🔐</span>
                  )}
                </div>
                <p className={`text-xs truncate opacity-75 ${
                  isCurrentRoom ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {room.description?.substring(0, 25) || 'No desc'}
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
