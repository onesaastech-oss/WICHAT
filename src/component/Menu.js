import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  FiPieChart,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export const Sidebar = ({ mobileMenuOpen, setMobileMenuOpen, isMinimized, setIsMinimized }) => {
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  // Get current path on component mount and when location changes
  useEffect(() => {
    setCurrentPath(window.location.pathname);

    // Listen for navigation events
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const toggleSubmenu = (menuKey) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  // Auto expand on hover when minimized
  const handleSidebarHover = (hoverState) => {
    if (isMinimized) {
      setIsHovered(hoverState);
    }
  };

  // Check if a menu item is active
  const isItemActive = (item) => {
    if (item.path && item.path !== '#') {
      // For dashboard, use exact match since it's the root
      if (item.path === '/') {
        return currentPath === '/' || currentPath === '';
      }
      // For other paths, check if current path starts with the item path
      // but not just as a substring - it should be exact or a subpath
      return currentPath === item.path || currentPath.startsWith(item.path + '/');
    }

    if (item.submenus) {
      return item.submenus.some(submenu =>
        submenu.path && submenu.path !== '#' &&
        (currentPath === submenu.path || currentPath.startsWith(submenu.path + '/'))
      );
    }

    return false;
  };

  // Check if a submenu item is active
  const isSubmenuItemActive = (submenuPath) => {
    if (submenuPath === '/') {
      return currentPath === '/' || currentPath === '';
    }
    return submenuPath && submenuPath !== '#' &&
      (currentPath === submenuPath || currentPath.startsWith(submenuPath + '/'));
  };

  // Menu items with submenus and icons
  const menuItems = [
    {
      key: 'dashboard',
      title: 'Dashboard',
      icon: <FiPieChart size={20} />,
      path: '/'
    },
    {
      key: 'live-chat',
      title: 'Live Chat',
      icon: <FiMessageSquare size={20} />,
      path: '/live-chat'
    },
    {
      key: 'contact',
      title: 'Contact',
      icon: <FiUsers size={20} />,
      submenus: [
        { title: 'All Contact', path: '/contact', icon: <FiLayers size={18} /> },
        { title: 'Contact Group', path: '/contact-group', icon: <FiMessageSquare size={18} /> },
      ]
    },
    {
      key: 'templates',
      title: 'Templates',
      icon: <FiMail size={20} />,
      path: '/template'
    },
    {
      key: 'campaigns',
      title: 'Campaigns',
      icon: <FiZap size={20} />,
       path: '/campaigns'
    },
    // {
    //   key: 'automation',
    //   title: 'Automation',
    //   icon: <FiZap size={20} />,
    //   submenus: [
    //     { title: 'Flows', path: '/flows', icon: <FiLayers size={18} /> },
    //     { title: 'Chatbot', path: '/chatbot', icon: <FiMessageSquare size={18} /> },
    //     { title: 'API Setup', path: '/api-setup', icon: <FiSettings size={18} /> }
    //   ]
    // },
    {
      key: 'management',
      title: 'Management',
      icon: <FiUsers size={20} />,
      submenus: [
        { title: 'Agents', path: '/agent-management', icon: <FiUsers size={18} /> },
        // { title: 'WhatsApp Orders', path: '/whatsapp-orders', icon: <FiShoppingCart size={18} /> },
        { title: 'Permission', path: '/permission-list', icon: <FiSettings size={18} /> }
      ]
    },
    {
      key: 'tools',
      title: 'Tools',
      icon: <FiSettings size={20} />,
      submenus: [
        { title: 'QR Code', path: '/qr-code', icon: <FiMaximize size={18} /> },
        { title: 'Setup', path: '/setup', icon: <FiSettings size={18} /> }
      ]
    },
    {
      key: 'my-plan',
      title: 'My Plan',
      icon: <FiPieChart size={20} />,
      path: '/my-plan'
    },
  ];

  // Animation variants
  const sidebarVariants = {
    expanded: {
      width: 280,
      transition: {
        type: "spring",
        damping: 30,
        stiffness: 300,
        duration: 0.3
      }
    },
    collapsed: {
      width: 72,
      transition: {
        type: "spring",
        damping: 30,
        stiffness: 300,
        duration: 0.3
      }
    }
  };

  const menuItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.15,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      x: -10,
      transition: {
        duration: 0.1,
        ease: "easeIn"
      }
    }
  };

  const submenuVariants = {
    open: {
      height: "auto",
      opacity: 1,
      transition: {
        height: {
          duration: 0.25,
          ease: "easeOut"
        },
        opacity: {
          duration: 0.2,
          delay: 0.05
        }
      }
    },
    closed: {
      height: 0,
      opacity: 0,
      transition: {
        height: {
          duration: 0.25,
          ease: "easeIn"
        },
        opacity: {
          duration: 0.15
        }
      }
    }
  };

  return (
    <>
      {/* Mobile Menu - 80% width with overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Mobile Sidebar */}
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-4/5 max-w-sm bg-white md:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between h-16 px-4 border-b">
                  <h1 className="text-xl font-bold text-indigo-600">WICHAT</h1>
                  <button
                    className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-0"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close menu"
                  >
                    <FiX size={24} />
                  </button>
                </div>

                <nav className="flex-1 p-4 overflow-y-auto scrollbar-hide">
                  {menuItems.map((item) => {
                    const isActive = isItemActive(item);
                    return (
                      <div key={item.key} className="mb-1">
                        {item.path ? (
                          <motion.a
                            href={item.path}
                            className={`flex items-center w-full p-4 text-left rounded-lg transition-colors duration-150 outline-none ring-0 ${isActive
                              ? 'bg-indigo-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <span className={`mr-3 ${isActive ? 'text-white' : 'text-gray-600'}`}>
                              {item.icon}
                            </span>
                            <span className="font-medium text-base">{item.title}</span>
                          </motion.a>
                        ) : (
                          <>
                            <motion.button
                              className={`flex items-center justify-between w-full p-4 text-left rounded-lg transition-colors duration-150 outline-none ring-0 border-0 ${isActive
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              onClick={() => toggleSubmenu(`mobile-${item.key}`)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center">
                                <span className={`mr-3 ${isActive ? 'text-white' : 'text-gray-600'}`}>
                                  {item.icon}
                                </span>
                                <span className="font-medium text-base">{item.title}</span>
                              </div>
                              {openSubmenus[`mobile-${item.key}`] ?
                                <FiChevronUp className="text-gray-400" /> :
                                <FiChevronDown className="text-gray-400" />
                              }
                            </motion.button>

                            <motion.div
                              className="overflow-hidden"
                              initial="closed"
                              animate={openSubmenus[`mobile-${item.key}`] ? "open" : "closed"}
                              variants={submenuVariants}
                            >
                              <div className="ml-8 mt-1 space-y-1">
                                {item.submenus.map((submenu, index) => {
                                  const isSubActive = isSubmenuItemActive(submenu.path);
                                  return (
                                    <motion.a
                                      key={index}
                                      href={submenu.path}
                                      className={`flex items-center p-3 rounded-lg transition-colors duration-150 outline-none ring-0 ${isSubActive
                                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                        : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                      whileHover={{ x: 4 }}
                                      onClick={() => setMobileMenuOpen(false)}
                                    >
                                      <span className={`mr-3 ${isSubActive ? 'text-blue-600' : 'text-gray-600'}`}>
                                        {submenu.icon}
                                      </span>
                                      <span className="text-base">{submenu.title}</span>
                                    </motion.a>
                                  );
                                })}
                              </div>
                            </motion.div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.div
        className="hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-white border-r z-40 scrollbar-hide"
        variants={sidebarVariants}
        animate={(isMinimized && !isHovered) ? "collapsed" : "expanded"}
        initial={isMinimized ? "collapsed" : "expanded"}
        onMouseEnter={() => handleSidebarHover(true)}
        onMouseLeave={() => handleSidebarHover(false)}
        style={{
          top: '64px',
          height: 'calc(100vh - 64px)',
          overflowX: 'hidden'
        }}
      >
        <div className={`flex-1 flex flex-col overflow-y-auto scrollbar-hide ${(isMinimized && !isHovered) ? 'overflow-x-hidden' : ''}`}>
          {/* Navigation Items Only - No header section */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = isItemActive(item);
              return (
                <div
                  key={item.key}
                  className="mb-1 relative"
                  onMouseEnter={() => (isMinimized && !isHovered) && setHoveredMenu(item.key)}
                  onMouseLeave={() => (isMinimized && !isHovered) && setHoveredMenu(null)}
                >
                  {item.path ? (
                    <motion.a
                      href={item.path}
                      className={`flex items-center w-full p-3 rounded-lg transition-colors duration-150 group outline-none ring-0 ${isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      layout
                      transition={{ duration: 0.15 }}
                    >
                      <span className={`flex items-center justify-center ${(isMinimized && !isHovered) ? 'w-6 h-6 mx-auto' : 'mr-3'} ${isActive ? 'text-white' : 'text-gray-600'}`}>
                        {item.icon}
                      </span>
                      <AnimatePresence mode="wait">
                        {(!isMinimized || isHovered) && (
                          <motion.span
                            className="font-medium whitespace-nowrap text-base"
                            variants={menuItemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            key={`text-${item.key}`}
                          >
                            {item.title}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Tooltip for minimized state when not hovered */}
                      {(isMinimized && !isHovered && hoveredMenu === item.key) && (
                        <motion.div
                          className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-md whitespace-nowrap z-50 border-0"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                        >
                          {item.title}
                        </motion.div>
                      )}
                    </motion.a>
                  ) : (
                    <>
                      <motion.button
                        className={`flex items-center w-full p-3 rounded-lg transition-colors duration-150 group outline-none ring-0 border-0 ${isActive
                          ? 'bg-indigo-600 text-white'
                          : openSubmenus[item.key] ? 'bg-gray-100' : 'hover:bg-gray-50'
                          } ${(isMinimized && !isHovered) ? 'justify-center' : 'justify-between'}`}
                        onClick={() => (!isMinimized || isHovered) && toggleSubmenu(item.key)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        layout
                        transition={{ duration: 0.15 }}
                      >
                        <div className={`flex items-center ${(isMinimized && !isHovered) ? 'w-full justify-center' : 'flex-1'}`}>
                          <span className={`flex items-center justify-center ${(isMinimized && !isHovered) ? 'w-6 h-6' : 'mr-3'} ${isActive ? 'text-white' : 'text-gray-600'}`}>
                            {item.icon}
                          </span>
                          <AnimatePresence mode="wait">
                            {(!isMinimized || isHovered) && (
                              <motion.span
                                className="font-medium whitespace-nowrap text-base"
                                variants={menuItemVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                key={`text-${item.key}`}
                              >
                                {item.title}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>

                        <AnimatePresence mode="wait">
                          {(!isMinimized || isHovered) && (
                            <motion.span
                              variants={menuItemVariants}
                              initial="hidden"
                              animate="visible"
                              exit="exit"
                              key={`chevron-${item.key}`}
                            >
                              {openSubmenus[item.key] ?
                                <FiChevronUp className={isActive ? "text-white" : "text-gray-400"} size={18} /> :
                                <FiChevronDown className={isActive ? "text-white" : "text-gray-400"} size={18} />
                              }
                            </motion.span>
                          )}
                        </AnimatePresence>

                        {/* Tooltip for minimized state when not hovered */}
                        {(isMinimized && !isHovered && hoveredMenu === item.key) && (
                          <motion.div
                            className="absolute left-full ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-md whitespace-nowrap z-50 border-0"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                          >
                            {item.title}
                          </motion.div>
                        )}
                      </motion.button>

                      <AnimatePresence>
                        {(!isMinimized || isHovered) && (
                          <motion.div
                            className="overflow-hidden"
                            initial="closed"
                            animate={openSubmenus[item.key] ? "open" : "closed"}
                            variants={submenuVariants}
                            layout
                          >
                            <div className="ml-8 mt-1 space-y-1">
                              {item.submenus.map((submenu, index) => {
                                const isSubActive = isSubmenuItemActive(submenu.path);
                                return (
                                  <motion.a
                                    key={index}
                                    href={submenu.path}
                                    className={`flex items-center p-3 rounded-lg transition-colors duration-150 outline-none ring-0 ${isSubActive
                                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                      : 'text-gray-600 hover:bg-gray-50'
                                      }`}
                                    whileHover={{ x: 4 }}
                                    layout
                                  >
                                    <span className={`mr-3 ${isSubActive ? 'text-blue-600' : 'text-gray-600'}`}>
                                      {submenu.icon}
                                    </span>
                                    <span className="text-base">{submenu.title}</span>
                                  </motion.a>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </motion.div>
    </>
  );
};

export const Header = ({ mobileMenuOpen, setMobileMenuOpen, isMinimized, setIsMinimized }) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const toggleSidebar = () => {
    setIsMinimized(!isMinimized);
  };

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("userData");
    navigate('/login');
  }

  // Profile dropdown items
  const profileItems = [
    { title: 'My Profile', icon: <FiUser className="mr-2" size={16} />, path: '#' },
    { title: 'Settings', icon: <FiSettings className="mr-2" size={16} />, path: '#' },
    { title: 'Help', icon: <FiHelpCircle className="mr-2" size={16} />, path: '#' },
  ];

  return (
    <header className="fixed top-0 inset-x-0 bg-white shadow-sm z-50 border-b">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 md:px-6">
        {/* Left side - Menu button and Logo */}
        <div className='left flex items-center'>
          {/* Desktop sidebar toggle button */}
          <button
            className="hidden md:block text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-0 mr-3"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <FiMenu size={24} />
          </button>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-0 mr-3"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <FiMenu size={24} />
          </button>

          {/* Logo */}
          <h1 className="text-xl font-bold text-indigo-600">WICHAT</h1>
        </div>

        {/* Right side - Notifications and Profile */}
        <div className="flex items-center space-x-4 text-xs sm:text-sm">
          {/* Success Button */}
          <button className="bg-green-600 text-white px-2 py-1 rounded-md hover:bg-green-700 font-medium text-[10px] sm:text-sm focus:outline-none focus:ring-0">
            Apply Now
          </button>
          <button className="relative p-1 text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-0">
            <FiBell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="relative">
            <button
              className="flex items-center focus:outline-none focus:ring-0"
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
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileDropdownOpen(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 transition-all duration-200 transform origin-top-right border-0">
                  {profileItems.map((item, index) => (
                    <a
                      key={index}
                      href={item.path}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150 outline-none"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      {item.icon}
                      {item.title}
                    </a>
                  ))}
                  <a
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150 outline-none cursor-pointer"
                    onClick={() => handleLogout()}
                  >
                    <FiLogOut className="mr-2" size={16} /> Logout
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};