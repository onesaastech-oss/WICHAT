import React, { useState, useEffect } from 'react';
import {
  FiSearch,
  FiMoreVertical,
  FiPaperclip,
  FiMic,
  FiSmile,
  FiStar,
  FiArrowLeft,
} from 'react-icons/fi';
import { MdOutlineCancel } from "react-icons/md";

function Chat() {
  const [showModal, setShowModal] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChat, setActiveChat] = useState(null);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Sample chat data
  const chats = [
    {
      id: 1,
      name: 'Sumiya ISERVEU',
      lastMessage: 'Kindly share...',
      time: '15/07/25',
      unread: true,
      isFavorite: true,
      isGroup: false,
      messages: [
        { sender: '+91 93609 46383', text: 'Hi air Good morning', time: '11:31 AM' },
        { sender: 'You', text: 'Good morning! 😊', time: '11:32 AM' },
      ],
    },
    {
      id: 2,
      name: 'Malibar Bhai',
      lastMessage: 'Jimmy',
      time: '11:26 AM',
      unread: false,
      isFavorite: false,
      isGroup: false,
    },
    {
      id: 3,
      name: 'OneSaaS <> ASeney',
      lastMessage: '~Flakesh Singh Bishir...',
      time: '11:01 AM',
      unread: false,
      isFavorite: false,
      isGroup: true,
      messages: [
        { sender: '+91 84860 92996', text: 'Count notori', time: '10:46 AM' },
        { sender: '+91 93659 46885', text: 'Yesterday', time: '9:12 AM' },
      ],
    },
  ];

  const filteredChats = chats.filter((chat) => {
    const matchesSearch =
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesTab = true;
    if (activeTab === 'Unread') matchesTab = chat.unread;
    if (activeTab === 'Favourites') matchesTab = chat.isFavorite;
    if (activeTab === 'Groups') matchesTab = chat.isGroup;
    return matchesSearch && matchesTab;
  });

  const handleBack = () => setActiveChat(null);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={`flex w-full max-w-7xl h-[90vh] rounded-xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
      >
        {/* Chat List (Left Pane) */}
        <div
          className={`w-full md:w-1/3 border-r flex flex-col transition-all duration-300 ${activeChat ? 'hidden md:flex' : 'flex'
            }`}
          style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4 border-b"
            style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}
          >

            <div className="flex flex-row items-center gap-2">
              <MdOutlineCancel
                className="text-xl cursor-pointer"
                onClick={() => setShowModal(false)}
              />
              <h1
                className="text-xl cursor-pointer"
                onClick={() => setShowModal(false)}
              >
                Chats
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:opacity-80"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              <button className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:opacity-80">
                <FiMoreVertical />
              </button>
            </div>
          </div>

          {/* Search */}
          <div
            className="p-4 border-b"
            style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}
          >
            <div className="flex items-center px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700">
              <FiSearch className="text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Search"
                className="w-full bg-transparent focus:outline-none placeholder-gray-500 dark:placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Tabs */}
          <div
            className="flex border-b"
            style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}
          >
            {['All', 'Unread', 'Favourites', 'Groups'].map((tab) => (
              <button
                key={tab}
                className={`flex-1 py-3 text-sm font-medium relative ${activeTab === tab
                  ? darkMode
                    ? 'text-blue-400'
                    : 'text-blue-600'
                  : darkMode
                    ? 'text-gray-400'
                    : 'text-gray-500'
                  }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {activeTab === tab && (
                  <div
                    className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-1 rounded-full ${darkMode ? 'bg-blue-400' : 'bg-blue-600'
                      }`}
                  ></div>
                )}
              </button>
            ))}
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                    <div className="flex-1">
                      <div className="h-4 w-3/4 mb-2 rounded bg-gray-200 dark:bg-gray-700"></div>
                      <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="divide-y"
                style={{ divideColor: darkMode ? '#374151' : '#e5e7eb' }}
              >
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setActiveChat(chat)}
                    className={`p-4 cursor-pointer ${chat.unread && !darkMode ? 'bg-blue-50' : ''
                      } ${chat.unread && darkMode ? 'bg-blue-900/30' : ''
                      } hover:${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                        {chat.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium truncate">{chat.name}</h3>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {chat.time}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-sm truncate text-gray-500 dark:text-gray-400">
                            {chat.lastMessage}
                          </p>
                          {chat.unread && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400"></span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Conversation (Right Pane) */}
        <div
          className={`w-full md:w-2/3 flex flex-col transition-all duration-300 ${activeChat ? 'flex' : 'hidden md:flex'
            }`}
        >
          {activeChat ? (
            <>
              {/* Chat header */}
              <div
                className="flex items-center justify-between p-4 border-b"
                style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}
              >
                <div className="flex items-center space-x-3">
                  {/* Back button (only mobile) */}
                  <button
                    className="md:hidden mr-2"
                    onClick={handleBack}
                  >
                    <FiArrowLeft className="w-6 h-6" />
                  </button>

                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                    {activeChat.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium">{activeChat.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button>
                    <FiStar className="text-yellow-500 dark:text-yellow-400" />
                  </button>
                  <button>
                    <FiMoreVertical />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                {activeChat.messages?.map((msg, i) => (
                  <div key={i} className="flex flex-col space-y-1">
                    <div
                      className={`flex items-end space-x-2 ${msg.sender === 'You' ? 'justify-end' : ''
                        }`}
                    >
                      {msg.sender !== 'You' && (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                          {msg.sender.charAt(0)}
                        </div>
                      )}
                      <div
                        className={`max-w-xs p-3 rounded-lg ${msg.sender === 'You'
                          ? darkMode
                            ? 'bg-blue-600 text-white'
                            : 'bg-blue-500 text-white'
                          : darkMode
                            ? 'bg-gray-700'
                            : 'bg-gray-100'
                          }`}
                      >
                        <p>{msg.text}</p>
                      </div>
                    </div>
                    <div
                      className={`text-xs text-gray-500 dark:text-gray-400 ${msg.sender === 'You' ? 'text-right' : 'pl-10'
                        }`}
                    >
                      {msg.time}{' '}
                      {msg.sender !== 'You' && `• ${msg.sender}`}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div
                className="p-4 border-t"
                style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}
              >
                <div className="flex items-center px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700">
                  <button className="mr-2">
                    <FiSmile className="text-gray-500 dark:text-gray-400" />
                  </button>
                  <button className="mr-2">
                    <FiPaperclip className="text-gray-500 dark:text-gray-400" />
                  </button>
                  <input
                    type="text"
                    placeholder="Type a message"
                    className="flex-1 bg-transparent focus:outline-none placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <button>
                    <FiMic className="text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 hidden md:flex items-center justify-center text-gray-400">
              Select a chat to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Chat;
