import React, { useState, useEffect } from 'react';
import {
  FiMessageSquare,
  FiMail,
  FiSettings,
  FiUsers,
  FiLayers,
  FiZap,
  FiCalendar,
  FiShoppingCart,
  FiMaximize,
  FiChevronDown,
  FiChevronUp,
  FiMenu,
  FiX,
  FiUser,
  FiLogOut,
  FiHelpCircle,
  FiBell,
  FiPieChart
} from 'react-icons/fi';

export const Header = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Profile dropdown items
  const profileItems = [
    { title: 'My Profile', icon: <FiUser className="mr-2" />, path: '#' },
    { title: 'Settings', icon: <FiSettings className="mr-2" />, path: '#' },
    { title: 'Help', icon: <FiHelpCircle className="mr-2" />, path: '#' },
    { title: 'Logout', icon: <FiLogOut className="mr-2" />, path: '#' }
  ];

  return (
    <header className="fixed top-0 inset-x-0 bg-white shadow-sm z-30">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 md:px-8">
        {/* Mobile menu button */}
      <div className='left flex'>
      <button
          className="md:hidden text-gray-500 hover:text-gray-600 focus:outline-none"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <FiMenu size={24} />
        </button>

        {/* Logo */}
        <h1 className="text-xl ml-3 font-bold text-indigo-600">WICHAT</h1>
      </div>

        {/* Right side - Notifications and Profile */}
        <div className="flex items-center space-x-4 text-xs sm:text-sm">
          {/* <div>API Status : <span className='text-red-700 font-semibold'>PENDING</span></div> */}
          {/* Success Button */}
          <button className="bg-green-600 text-white px-2 py-1 rounded-md hover:bg-green-700  font-medium text-[10px] sm:text-sm">
            Apply Now
          </button>
          <button className="relative p-1 text-gray-500 hover:text-gray-600 focus:outline-none">
            <FiBell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="relative">
            <button
              className="flex items-center focus:outline-none"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 font-medium text-sm">BM</span>
              </div>
            </button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setProfileDropdownOpen(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-30 transition-all duration-200 transform origin-top-right">
                  {profileItems.map((item, index) => (
                    <a
                      key={index}
                      href={item.path}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                    >
                      {item.icon}
                      {item.title}
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export const Sidebar = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const [openSubmenus, setOpenSubmenus] = useState({});

  const toggleSubmenu = (menuKey) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  // Menu items with submenus and icons
  const menuItems = [
    {
      key: 'dashboard',
      title: 'Dashboard',
      icon: <FiPieChart className="text-indigo-500" />,
      path: '#'
    },
    {
      key: 'live-chat',
      title: 'Live Chat',
      icon: <FiPieChart className="text-indigo-500" />,
      path: 'live-chat'
    },
    {
      key: 'communications',
      title: 'Communications',
      icon: <FiMessageSquare className="text-indigo-500" />,
      submenus: [
        { title: 'Live Chat', path: 'live-chat', icon: <FiMessageSquare className="text-indigo-400" /> },
        { title: 'Templates', path: 'template', icon: <FiMail className="text-indigo-400" /> },
        { title: 'Campaigns', path: '#', icon: <FiZap className="text-indigo-400" /> }
      ]
    },
    {
      key: 'contact',
      title: 'Contact',
      icon: <FiZap className="text-indigo-500" />,
      submenus: [
        { title: 'All Contact', path: 'contact', icon: <FiLayers className="text-indigo-400" /> },
        { title: 'Contact Group', path: 'contact-group', icon: <FiMessageSquare className="text-indigo-400" /> },
        { title: 'Add Input', path: 'contact-input-field', icon: <FiSettings className="text-indigo-400" /> }
      ]
    },
    {
      key: 'automation',
      title: 'Automation',
      icon: <FiZap className="text-indigo-500" />,
      submenus: [
        { title: 'Flows', path: '#', icon: <FiLayers className="text-indigo-400" /> },
        { title: 'Chatbot', path: '#', icon: <FiMessageSquare className="text-indigo-400" /> },
        { title: 'API Setup', path: '#', icon: <FiSettings className="text-indigo-400" /> }
      ]
    },
    {
      key: 'management',
      title: 'Management',
      icon: <FiUsers className="text-indigo-500" />,
      submenus: [
        { title: 'Agents', path: 'agent-management', icon: <FiUsers className="text-indigo-400" /> },
        { title: 'WhatsApp Orders', path: '#', icon: <FiShoppingCart className="text-indigo-400" /> }
      ]
    },
    {
      key: 'tools',
      title: 'Tools',
      icon: <FiSettings className="text-indigo-500" />,
      submenus: [
        { title: 'QR Code', path: '#', icon: <FiMaximize className="text-indigo-400" /> },
        { title: 'My Plan', path: '#', icon: <FiCalendar className="text-indigo-400" /> },
        { title: 'Setup', path: '#', icon: <FiSettings className="text-indigo-400" /> }
      ]
    },
    {
      key: 'my-plan',
      title: 'My Plan',
      icon: <FiPieChart className="text-indigo-500" />,
      path: 'my-plan'
    },
  ];

  return (
    <>
      {/* Mobile Menu - Full Screen Modal with smooth transition */}
      <div className={`fixed inset-0 z-40 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:hidden`}>
        <div className="bg-white h-full overflow-y-auto">
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <h1 className="text-xl font-bold text-indigo-600">WICHAT</h1>
            <button
              className="text-gray-500 hover:text-gray-600 focus:outline-none"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <FiX size={24} />
            </button>
          </div>

          <nav className="p-4">
            {menuItems.map((item) => (
              <div key={item.key} className="mb-1">
                {item.path ? (
                  <a
                    href={item.path}
                    className="flex items-center w-full p-3 text-left text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none transition-colors duration-150"
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span className="font-medium">{item.title}</span>
                  </a>
                ) : (
                  <>
                    <button
                      className="flex items-center justify-between w-full p-3 text-left text-gray-700 hover:bg-gray-100 rounded-md focus:outline-none transition-colors duration-150"
                      onClick={() => toggleSubmenu(`mobile-${item.key}`)}
                    >
                      <div className="flex items-center">
                        <span className="mr-3">{item.icon}</span>
                        <span className="font-medium">{item.title}</span>
                      </div>
                      {openSubmenus[`mobile-${item.key}`] ?
                        <FiChevronUp className="text-gray-400" /> :
                        <FiChevronDown className="text-gray-400" />
                      }
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${openSubmenus[`mobile-${item.key}`] ? 'max-h-96' : 'max-h-0'}`}
                    >
                      <div className="ml-8 mt-1 space-y-1">
                        {item.submenus.map((submenu, index) => (
                          <a
                            key={index}
                            href={submenu.path}
                            className="flex items-center p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors duration-150"
                          >
                            <span className="mr-3">{submenu.icon}</span>
                            {submenu.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r pt-16">
        <div className="flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {menuItems.map((item) => (
              <div key={item.key} className="mb-1">
                {item.path ? (
                  <a
                    href={item.path}
                    className="flex items-center w-full p-2 text-left text-gray-700 hover:bg-gray-50 rounded-md focus:outline-none transition-colors duration-150"
                  >
                    <span className="mr-3">{item.icon}</span>
                    <span className="font-medium">{item.title}</span>
                  </a>
                ) : (
                  <>
                    <button
                      className={`flex items-center justify-between w-full p-2 text-left rounded-md focus:outline-none transition-colors duration-150 ${openSubmenus[item.key] ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                      onClick={() => toggleSubmenu(item.key)}
                    >
                      <div className="flex items-center">
                        <span className="mr-3">{item.icon}</span>
                        <span className="font-medium">{item.title}</span>
                      </div>
                      {openSubmenus[item.key] ?
                        <FiChevronUp className="text-gray-400" /> :
                        <FiChevronDown className="text-gray-400" />
                      }
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${openSubmenus[item.key] ? 'max-h-96' : 'max-h-0'}`}
                    >
                      <div className="ml-8 mt-1 space-y-1">
                        {item.submenus.map((submenu, index) => (
                          <a
                            key={index}
                            href={submenu.path}
                            className="flex items-center p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors duration-150"
                          >
                            <span className="mr-3">{submenu.icon}</span>
                            {submenu.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};