import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useUser } from '../hooks/useUser';
import { useChat } from '../hooks/useChat';
import { useMessage } from '../hooks/useMessage';
import { useError } from '../hooks/useError';

const LiveChat: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [name, setName] = useState('');
  const socket = useSocket();
  const { user, setUser } = useUser();
  const { chat, setChat } = useChat();
  const { message, setMessage } = useMessage();
  const { error, setError } = useError();

  useEffect(() => {
    // Show the popup as soon as the component mounts
    setShowPopup(true);
  }, []);

  const handleJoinChat = () => {
    if (name.trim() === '') {
      setError('Please enter your name');
      return;
    }

    setUser({ name });
    setShowPopup(false);
    socket.emit('join', { name });
  };

  const handleSendMessage = () => {
    if (message.trim() === '') {
      setError('Please enter a message');
      return;
    }

    socket.emit('message', { message });
    setMessage('');
  };

  return (
    <div className="fixed bottom-4 right-4">
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg">
            <h2 className="text-lg font-bold mb-2">Join the Chat</h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="border p-2 mb-2 w-full"
            />
            <button
              onClick={handleJoinChat}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Join
            </button>
          </div>
        </div>
      )}

      {!showPopup && (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-lg font-bold mb-2">Live Chat</h2>
          <div className="flex">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message"
              className="border p-2 w-full mr-2"
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Send
            </button>
          </div>
          <div className="mt-2">
            {chat.map((message, index) => (
              <div key={index} className="mb-2">
                <span className="font-bold">{message.name}:</span> {message.message}
              </div>
            ))}
          </div>
          {error && <div className="mt-2 text-red-500">{error}</div>}
        </div>
      )}
    </div>
  );
};

export default LiveChat;