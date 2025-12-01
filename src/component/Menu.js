import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FiMenu, FiBriefcase, FiChevronDown, FiCreditCard, 
  FiPlus, FiBell, FiUser, FiSettings, FiHelpCircle, 
  FiLogOut, FiPieChart, FiMessageSquare, FiUsers, 
  FiMail, FiZap, FiCpu, FiLock, FiChevronRight, FiX 
} from 'react-icons/fi';

// Adjust these import paths if necessary
import { fetchProjectInfo } from '../store/projectSlice';
import { setSelectedProjectId, setAuthData } from '../store/authSlice';
import { fetchUserProfile } from '../api/auth';
import SwitchProjectModal from './Modals/SwitchProjectModal';

// ==========================================
// 1. Constants & Styles (Modern Indigo Theme)
// ==========================================
const THEME = {
  active: "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm", // Soft Indigo background for active
  inactive: "text-slate-600 hover:bg-indigo-50/50 hover:text-indigo-600 border-transparent", // Subtle hover
  locked: "text-slate-300 cursor-not-allowed hover:bg-transparent",
  iconActive: "text-indigo-600",
  iconInactive: "text-slate-400 group-hover:text-indigo-500"
};

// ==========================================
// 2. Helper Functions
// ==========================================
const getUserData = () => {
  try {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) { return null; }
};

const requiresProject = (item) => {
  const protectedPaths = ['/live-chat', '/template', '/campaigns'];
  return protectedPaths.includes(item.path) || 
         (item.submenus && item.submenus.some(submenu => protectedPaths.includes(submenu.path)));
};

const isItemActive = (item, currentPath) => {
  if (item.path && item.path !== '#') {
    if (item.path === '/') return currentPath === '/' || currentPath === '';
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

const isSubmenuItemActive = (submenuPath, currentPath) => {
  if (submenuPath === '/') return currentPath === '/' || currentPath === '';
  return submenuPath && submenuPath !== '#' && (currentPath === submenuPath || currentPath.startsWith(submenuPath + '/'));
};

// ==========================================
// 3. NavItem Component (MOVED OUTSIDE)
// ==========================================
const NavItem = ({ item, isMobile, isMinimized, isHovered, currentPath, openSubmenus, toggleSubmenu, setHoveredMenu, hoveredMenu, setMobileMenuOpen, hasProjects }) => {
  const isActive = isItemActive(item, currentPath);
  const isDisabled = requiresProject(item) && !hasProjects;
  const hasSubmenu = item.submenus && item.submenus.length > 0;
  const isOpen = isMobile ? openSubmenus[`mobile-${item.key}`] : openSubmenus[item.key];
  const isMini = !isMobile && isMinimized && !isHovered;

  // Render Submenu Item (Parent)
  if (hasSubmenu) {
    return (
      <div className="mb-1">
        <button
          onClick={() => !isMini && toggleSubmenu(isMobile ? `mobile-${item.key}` : item.key)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group border
            ${isActive ? THEME.active : THEME.inactive}
            ${isMini ? 'justify-center px-2' : ''}`}
          onMouseEnter={() => isMini && setHoveredMenu(item.key)}
          onMouseLeave={() => isMini && setHoveredMenu(null)}
        >
          <div className={`flex items-center ${isMini ? 'justify-center w-full' : 'gap-3'}`}>
            <span className={`${isActive ? THEME.iconActive : THEME.iconInactive} transition-colors`}>
              {item.icon}
            </span>
            {!isMini && <span>{item.title}</span>}
          </div>
          {!isMini && (
            <motion.span animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
              <FiChevronRight size={16} className={isActive ? "text-indigo-400" : "text-slate-400"} />
            </motion.span>
          )}
          
          {/* Tooltip for Mini Mode */}
          {isMini && hoveredMenu === item.key && (
            <div className="absolute left-16 ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-md shadow-lg z-50 whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
              {item.title}
            </div>
          )}
        </button>

        <AnimatePresence>
          {(!isMini && isOpen) && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: "auto", opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }} 
              transition={{ duration: 0.2, ease: "easeInOut" }} 
              className="overflow-hidden"
            >
              <div className="ml-5 pl-4 border-l-2 border-indigo-100 my-1 space-y-0.5">
                {item.submenus.map((sub, idx) => {
                    const isSubActive = isSubmenuItemActive(sub.path, currentPath);
                    return (
                    <a key={idx} href={sub.path} className={`block px-3 py-2 rounded-md text-sm transition-all duration-200 ${isSubActive ? 'text-indigo-700 font-semibold bg-indigo-50' : 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'}`}>
                      {sub.title}
                    </a>
                    )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Render Single Link Item
  return (
    <div className="mb-1 relative">
      <a href={isDisabled ? '#' : item.path} onClick={(e) => { if(isDisabled) e.preventDefault(); else if(isMobile) setMobileMenuOpen(false); }}
        className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group border
          ${isDisabled ? THEME.locked : isActive ? THEME.active : THEME.inactive}
          ${isMini ? 'justify-center px-2' : ''}`}
        onMouseEnter={() => isMini && setHoveredMenu(item.key)}
        onMouseLeave={() => isMini && setHoveredMenu(null)}
      >
        <span className={`${isMini ? '' : 'mr-3'} ${isDisabled ? 'text-slate-300' : isActive ? THEME.iconActive : THEME.iconInactive} transition-colors`}>
          {item.icon}
        </span>
        {!isMini && (
          <div className="flex-1 flex items-center justify-between">
            <span>{item.title}</span>
            {isDisabled && <FiLock size={12} className="text-slate-300" />}
          </div>
        )}
        {isMini && hoveredMenu === item.key && (
            <div className="absolute left-16 ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-md shadow-lg z-50 whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
              {item.title} {isDisabled && '(Locked)'}
            </div>
        )}
      </a>
    </div>
  );
};

// ==========================================
// 4. Header Component
// ==========================================
export const Header = ({ mobileMenuOpen, setMobileMenuOpen, isMinimized, setIsMinimized }) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [switchProjectModalOpen, setSwitchProjectModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedProjectName, setSelectedProjectName] = useState(null);
  const [userProfile, setUserProfile] = useState({ name: '', email: '' });
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const walletBalance = useSelector((state) => state.project?.walletBalance || 0);
  const projectInfoStatus = useSelector((state) => state.project?.status || 'idle');

  useEffect(() => {
    const getSelectedProjectName = () => {
      try {
        const userData = localStorage.getItem('userData');
        if (!userData) return null;
        const parsed = JSON.parse(userData);
        const selectedProjectId = parsed.selected_project_id;
        const projects = parsed.projects?.list || (Array.isArray(parsed.projects) ? parsed.projects : []);
        
        if (selectedProjectId && projects.length > 0) {
          const selectedProject = projects.find(p => p.project_id === selectedProjectId);
          return selectedProject ? selectedProject.name : null;
        }
        return null;
      } catch (error) { return null; }
    };
    setSelectedProjectName(getSelectedProjectName());
  }, [switchProjectModalOpen]);

  const toggleSidebar = () => {
    if (setIsMinimized) setIsMinimized(!isMinimized);
  };
  
  const handleLogout = () => {
    localStorage.removeItem("userData");
    navigate('/login');
  };

  const handleSelectCompany = (company) => {
    if (!company) return;
    setSelectedCompany(company);
    try {
      const stored = localStorage.getItem('userData');
      const parsed = stored ? JSON.parse(stored) : {};
      const selectedId = company.project_id || company.id || null;
      const updatedUserData = { ...parsed, selected_project_id: selectedId };
      localStorage.setItem('userData', JSON.stringify(updatedUserData));
      if (selectedId) dispatch(setSelectedProjectId(selectedId));
      dispatch(setAuthData(updatedUserData));
    } catch (error) { console.error('Failed to update selected project', error); }
    window.location.reload();
  };

  useEffect(() => {
    if (projectInfoStatus === 'idle') {
      dispatch(fetchProjectInfo());
    }
  }, [dispatch, projectInfoStatus]);

  // Load user profile - first from localStorage, then fetch from API
  useEffect(() => {
    // Load from localStorage immediately
    const loadFromLocalStorage = () => {
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const parsed = JSON.parse(userData);
          if (parsed.profile) {
            setUserProfile({
              name: parsed.profile.name || '',
              email: parsed.profile.email || ''
            });
          }
        }
      } catch (error) {
        console.error('Error parsing userData from localStorage:', error);
      }
    };

    loadFromLocalStorage();

    // Fetch from API in the background
    const fetchProfile = async () => {
      try {
        const response = await fetchUserProfile();
        if (response && response.profile) {
          setUserProfile({
            name: response.profile.name || '',
            email: response.profile.email || ''
          });
          // Update localStorage with fresh data
          try {
            const userData = localStorage.getItem('userData');
            if (userData) {
              const parsed = JSON.parse(userData);
              localStorage.setItem('userData', JSON.stringify({
                ...parsed,
                profile: response.profile
              }));
            }
          } catch (error) {
            console.error('Error updating localStorage:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Keep showing localStorage data on error
      }
    };

    fetchProfile();
  }, []);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (userProfile.name) {
      const names = userProfile.name.trim().split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return userProfile.name.substring(0, 2).toUpperCase();
    }
    return 'U'; // Default initial
  };

  const profileItems = [
    { title: 'My Profile', icon: <FiUser size={16} />, path: '/my-profile' },
    { title: 'Settings', icon: <FiSettings size={16} />, path: '#' },
    { title: 'Help & Support', icon: <FiHelpCircle size={16} />, path: '#' },
  ];

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 h-16 border-b border-indigo-100 bg-white/90 backdrop-blur-md transition-all duration-200">
        <div className="flex h-full items-center justify-between px-4 sm:px-6">
          {/* Left */}
          <div className="flex items-center gap-4">
            <button
              className="text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 p-2 rounded-md transition-colors focus:outline-none"
              onClick={window.innerWidth >= 768 ? toggleSidebar : () => setMobileMenuOpen(true)}
            >
              <FiMenu size={22} />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-lg shadow-md shadow-indigo-200">W</div>
              <span className="text-xl font-bold tracking-tight text-slate-800 hidden sm:block font-sans">WICHAT</span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3 md:gap-5">
            <button
              onClick={() => setSwitchProjectModalOpen(true)}
              className="hidden md:flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm transition-all duration-200 group"
            >
              <FiBriefcase size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
              <span className="max-w-[120px] truncate">{selectedProjectName || selectedCompany?.name || 'Select Project'}</span>
              <FiChevronDown size={14} className="text-slate-400" />
            </button>

            <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 pr-3 shadow-sm hover:border-indigo-200 transition-colors cursor-default">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <FiCreditCard size={14} />
              </div>
              <div className="flex flex-col leading-none">
                {/* <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Balance</span> */}
                <span className="text-sm font-bold text-slate-700 font-mono">₹{Number(walletBalance).toFixed(2)}</span>
              </div>
              <button onClick={() => navigate('/wallet-recharge')} className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 transition-all shadow-md shadow-indigo-200">
                <FiPlus size={12} />
              </button>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

            <button className="relative p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all">
              <FiBell size={20} />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
            </button>

            <div className="relative">
              <button className="flex items-center gap-2 focus:outline-none ring-offset-2 focus:ring-2 focus:ring-indigo-100 rounded-full transition-all" onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-medium text-sm shadow-md shadow-indigo-200 border-2 border-white">{getUserInitials()}</div>
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-3 w-56 origin-top-right rounded-xl border border-slate-100 bg-white p-1 shadow-xl ring-1 ring-black ring-opacity-5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="text-sm font-semibold text-slate-900">{userProfile.name || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate">{userProfile.email || ''}</p>
                    </div>
                    <button className="md:hidden flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" onClick={() => { setProfileDropdownOpen(false); setSwitchProjectModalOpen(true); }}>
                      <FiBriefcase size={16} /> Switch Project
                    </button>
                    {profileItems.map((item, index) => (
                      <a key={index} href={item.path} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors" onClick={() => setProfileDropdownOpen(false)}>
                        {item.icon} {item.title}
                      </a>
                    ))}
                    <div className="my-1 h-px bg-slate-100"></div>
                    <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <FiLogOut size={16} /> Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <SwitchProjectModal
        isOpen={switchProjectModalOpen}
        onClose={() => setSwitchProjectModalOpen(false)}
        onSelectCompany={handleSelectCompany}
      />
    </>
  );
};

// ==========================================
// 5. Sidebar Component
// ==========================================
export const Sidebar = ({ mobileMenuOpen, setMobileMenuOpen, isMinimized, setIsMinimized }) => {
  const [openSubmenus, setOpenSubmenus] = useState({});
  const [hoveredMenu, setHoveredMenu] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  const userData = getUserData();
  const projectList = userData?.projects?.list || (Array.isArray(userData?.projects) ? userData.projects : []);
  const hasProjects = projectList.length > 0 || (userData?.projects?.project_count > 0);

  useEffect(() => {
    setCurrentPath(window.location.pathname);
    const handleLocationChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const toggleSubmenu = (menuKey) => {
    setOpenSubmenus(prev => ({ ...prev, [menuKey]: !prev[menuKey] }));
  };

  const handleSidebarHover = (hoverState) => {
    if (isMinimized) setIsHovered(hoverState);
  };

  const menuItems = [
    { key: 'dashboard', title: 'Dashboard', icon: <FiPieChart size={18} />, path: '/' },
    { key: 'live-chat', title: 'Live Chat', icon: <FiMessageSquare size={18} />, path: '/live-chat' },
    { 
      key: 'contact', title: 'Audience', icon: <FiUsers size={18} />, 
      submenus: [
        { title: 'All Contacts', path: '/contact' },
        { title: 'Groups', path: '/contact-group' },
      ]
    },
    { key: 'templates', title: 'Templates', icon: <FiMail size={18} />, path: '/template' },
    { key: 'campaigns', title: 'Campaigns', icon: <FiZap size={18} />, path: '/campaigns' },
    { 
      key: 'automation', title: 'Automation', icon: <FiCpu size={18} />, 
      submenus: [
        { title: 'Auto Reply', path: '/auto-reply' },
        { title: 'Flow Builder', path: '/flow' }
      ]
    },
    { key: 'projects', title: 'Projects', icon: <FiBriefcase size={18} />, path: '/projects' },
    { 
      key: 'management', title: 'Management', icon: <FiSettings size={18} />, 
      submenus: [
        { title: 'Agents', path: '/agent-management' },
        { title: 'Permissions', path: '/permission-list' }
      ]
    },
    { 
      key: 'billing', title: 'Billing', icon: <FiCreditCard size={18} />, 
      submenus: [
        { title: 'My Plan', path: '/my-plan' },
        { title: 'Transactions', path: '/transactions' }
      ]
    }
  ];

  return (
    <>
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileMenuOpen(false)} />
            <motion.div className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl md:hidden flex flex-col" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: "spring", damping: 30, stiffness: 300 }}>
              <div className="h-16 flex items-center justify-between px-6 border-b border-indigo-100 bg-indigo-50/30">
                <span className="text-xl font-bold text-slate-800 font-sans">WICHAT</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                  <FiX size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                {menuItems.map(item => (
                  <NavItem 
                    key={item.key} 
                    item={item} 
                    isMobile={true}
                    currentPath={currentPath}
                    openSubmenus={openSubmenus}
                    toggleSubmenu={toggleSubmenu}
                    hasProjects={hasProjects}
                    setMobileMenuOpen={setMobileMenuOpen}
                  />
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div
        className="hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-white border-r border-indigo-100 z-40 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]"
        initial={false}
        animate={{ width: (isMinimized && !isHovered) ? 80 : 260 }}
        style={{ top: '64px', height: 'calc(100vh - 64px)' }}
        onMouseEnter={() => handleSidebarHover(true)}
        onMouseLeave={() => handleSidebarHover(false)}
      >
        <div className="flex-1 flex flex-col overflow-y-auto py-6 px-3 scrollbar-hide">
          <nav className="space-y-1">
            {menuItems.map(item => (
              <NavItem 
                key={item.key} 
                item={item} 
                isMobile={false}
                isMinimized={isMinimized}
                isHovered={isHovered}
                currentPath={currentPath}
                openSubmenus={openSubmenus}
                toggleSubmenu={toggleSubmenu}
                setHoveredMenu={setHoveredMenu}
                hoveredMenu={hoveredMenu}
                hasProjects={hasProjects}
              />
            ))}
          </nav>
        </div>
        
        <AnimatePresence>
          {(!isMinimized || isHovered) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ delay: 0.1 }} className="p-4 border-t border-indigo-100">
              <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-4 text-xs border border-indigo-100 shadow-sm">
                <p className="font-semibold text-indigo-900 mb-1">Need help?</p>
                <p className="text-slate-600 mb-3 leading-relaxed">Check our docs or contact support for assistance.</p>
                <button className="w-full py-1.5 bg-white border border-indigo-200 text-indigo-600 font-medium rounded-md shadow-sm hover:bg-indigo-50 transition-colors">Contact Support</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

// ==========================================
// 6. Main Layout Wrapper (Default Export)
// ==========================================
const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen}
        isMinimized={isMinimized}
        setIsMinimized={setIsMinimized}
      />

      <Sidebar 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen}
        isMinimized={isMinimized}
        setIsMinimized={setIsMinimized}
      />

      <main 
        className={`pt-16 transition-all duration-300 ease-in-out ${
          isMinimized ? 'md:pl-20' : 'md:pl-[260px]'
        }`}
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;