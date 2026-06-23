import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Sidebar } from '../component/Menu';
import {
  FiPlus,
  FiSearch,
  FiBriefcase,
  FiX,
  FiCheck,
  FiEye,
  FiUser,
  FiShield,
  FiUserCheck,
  FiDollarSign,
  FiCreditCard
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { fetchUserProfile, createProject, getSubscriptionPacks } from '../api/auth';

const SkeletonBar = ({ className = '' }) => (
  <div className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />
);

const ProjectCardSkeleton = () => (
  <div className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 min-h-[100px] flex flex-col animate-pulse">
    <div className="flex items-start gap-2 w-full">
      <SkeletonBar className="h-5 flex-1" />
      <SkeletonBar className="h-5 w-16 rounded flex-shrink-0" />
    </div>
    <SkeletonBar className="h-4 w-2/3 mt-2" />
    <div className="mt-auto pt-2 flex items-center gap-2">
      <SkeletonBar className="h-5 w-16 rounded-full" />
      <SkeletonBar className="h-4 w-24" />
    </div>
  </div>
);

const ProjectsSkeleton = () => (
  <>
    <div className="mb-6 animate-pulse">
      <SkeletonBar className="h-10 w-full rounded-lg" />
    </div>

    <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4 animate-pulse"
        >
          <SkeletonBar className="h-4 w-24 mb-2" />
          <SkeletonBar className="h-8 w-12" />
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <ProjectCardSkeleton key={index} />
      ))}
    </div>
  </>
);

const Projects = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem('sidebarMinimized');
    return saved ? JSON.parse(saved) : false;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userData, setUserData] = useState(null);
  const [projects, setProjects] = useState([]);

  const userProjects = Array.isArray(userData?.projects?.list) ? userData.projects.list : [];
  const hasUserProjects = userData && userProjects.length > 0;

  const [formData, setFormData] = useState({
    company_name: '',
    name: ''
  });
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [subscriptionPackage, setSubscriptionPackage] = useState(null); // { monthly: { amount, package_id }, yearly: { amount, package_id } }
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
  const [packageLoading, setPackageLoading] = useState(false);
  const [showWalletRechargeModal, setShowWalletRechargeModal] = useState(false);
  const [walletRechargeAmount, setWalletRechargeAmount] = useState(0);

  // Get active project ID from localStorage
  useEffect(() => {
    const getUserData = () => {
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const parsed = JSON.parse(userData);
          return parsed.selected_project_id || null;
        }
      } catch (error) {
        console.error('Error parsing userData:', error);
      }
      return null;
    };
    setActiveProjectId(getUserData());
  }, [userData]); // Update when userData changes

  // Fetch user profile data on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        const response = await fetchUserProfile();

        if (response && !response.error) {
          const profileData = response;
          setUserData(profileData);


          // Set projects from API response
          if (Array.isArray(profileData.projects?.list)) {
            setProjects(profileData.projects.list.map(project => ({
              id: project.project_id,
              project_id: project.project_id,
              name: project.name,
              owned: project.owned,
              owner_name: project.owner_name
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        toast.error('Failed to load projects');

      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
  }, [isMinimized]);

  // Fetch package pricing (same as MySubscription) for create project modal
  useEffect(() => {
    const fetchPackage = async () => {
      setPackageLoading(true);
      try {
        const response = await getSubscriptionPacks();
        if (!response.error && response.data?.package) {
          setSubscriptionPackage(response.data.package);
        }
      } catch (err) {
        console.error('Failed to fetch package pricing:', err);
      } finally {
        setPackageLoading(false);
      }
    };
    fetchPackage();
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mobileMenuOpen]);

  // Filter projects based on search (name, owner)
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (project.owner_name && project.owner_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const ownedCount = filteredProjects.filter(p => p.owned === true).length;
  const sharedCount = filteredProjects.filter(p => p.owned === false).length;

  const handleCreateProject = () => {
    setEditingProject(null);
    setFormData({
      company_name: '',
      name: ''
    });
    setShowCreateModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingProject) {
      // TODO: Implement API call for update project
      setProjects(projects.map(p =>
        p.id === editingProject.id
          ? {
            ...p,
            ...formData,
            updatedAt: new Date().toISOString()
          }
          : p
      ));
      toast.success('Project updated successfully');
      setShowCreateModal(false);
      setFormData({ company_name: '', name: '' });
      setEditingProject(null);
    } else {
      // Create new project via API
      try {
        setSubmitting(true);
        const packageId = subscriptionPackage?.[billingCycle]?.package_id ||
          (billingCycle === 'yearly' ? 'PROJECT_1Y' : 'PROJECT_1M');
        const response = await createProject({
          company_name: formData.company_name,
          project_name: formData.name,
          package_id: packageId
        });

        const responseError = response?.error;
        const hasError =
          !response ||
          responseError === true ||
          responseError === 1 ||
          responseError === 'true' ||
          (typeof responseError === 'string' && responseError.trim() !== '');

        if (hasError) {
          const errorMessage =
            (typeof responseError === 'string' && responseError.trim()) ||
            response?.message ||
            response?.msg ||
            'Failed to create project';
          toast.error(errorMessage);
          return;
        }

        toast.success('Project created successfully');
        setShowCreateModal(false);
        setFormData({ company_name: '', name: '' });
        setEditingProject(null);

        const profileResponse = await fetchUserProfile();
        if (profileResponse && !profileResponse.error) {
          const profileData = profileResponse;
          setUserData(profileData);

          if (Array.isArray(profileData.projects?.list)) {
            setProjects(profileData.projects.list.map(project => ({
              id: project.project_id,
              project_id: project.project_id,
              name: project.name,
              owned: project.owned,
              owner_name: project.owner_name
            })));
          }
        }
      } catch (error) {
        console.error('Error creating project:', error);
        if (error.response?.status === 402) {
          const amount = subscriptionPackage?.[billingCycle]?.amount != null
            ? Number(subscriptionPackage[billingCycle].amount)
            : 0;
          setWalletRechargeAmount(amount);
          setShowWalletRechargeModal(true);
        } else {
          toast.error(error?.message || error.response?.data?.error || 'Failed to create project');
        }
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleWalletRechargeNavigate = () => {
    setShowWalletRechargeModal(false);
    navigate(`/wallet-recharge/${walletRechargeAmount}`);
  };


  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (showCreateModal || showWalletRechargeModal) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [showCreateModal, showWalletRechargeModal]);

  return (
    <div className="min-h-screen bg-gray-50">
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

      {/* Main content - same layout as Switch Project Modal */}
      <div className={`pt-16 transition-all duration-300 ease-in-out ${isMinimized ? 'md:pl-20' : 'md:pl-72'}`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6">
          {/* Header - same style as modal */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <FiBriefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Projects</h1>
                {loading ? (
                  <SkeletonBar className="h-4 w-36 mt-1" />
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} · {sharedCount} agent
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleCreateProject}
              className="flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              <FiPlus size={20} />
              <span>Create Project</span>
            </button>
          </div>

          {loading ? (
            <ProjectsSkeleton />
          ) : (
            <>
              {/* No Projects Warning */}
              {!hasUserProjects && (
                <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <FiBriefcase className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        No Projects Found
                      </h3>
                      <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                        <p>
                          You need to create at least one project to access Live Chat, Templates, and Campaigns features.
                        </p>
                      </div>
                      <div className="mt-4">
                        <button
                          onClick={handleCreateProject}
                          className="bg-amber-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
                        >
                          Create Your First Project
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Search Bar - same style as modal */}
              <div className="mb-6 px-0 py-0">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                  <input
                    type="text"
                    placeholder="Search by project name or owner..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                  />
                </div>
              </div>

              {/* Stats Summary - Total, Owned, Shared */}
              {filteredProjects.length > 0 && (
                <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Projects</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredProjects.length}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Owned</p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{ownedCount}</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Agent</p>
                    <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{sharedCount}</p>
                  </div>
                </div>
              )}

              {/* Projects Grid - same card design as Switch Project Modal */}
              {filteredProjects.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <FiBriefcase className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {searchTerm ? 'No projects found' : 'No projects yet'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {searchTerm ? 'Try a different search term' : 'Get started by creating your first project'}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={handleCreateProject}
                      className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <FiPlus size={18} />
                      <span>Create Project</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProjects.map((project) => {
                    const isActive = activeProjectId === project.id;
                    const isOwned = project.owned === true;
                    return (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`relative text-left p-4 rounded-xl border-2 transition-all duration-200 min-h-[100px] flex flex-col ${isOwned
                          ? 'cursor-pointer'
                          : 'cursor-not-allowed'
                          } ${isActive
                          ? 'border-indigo-400 bg-indigo-50/70 dark:bg-indigo-900/15'
                          : isOwned
                            ? 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-sm'
                            : 'border-gray-200 dark:border-gray-600 opacity-90'
                          }`}
                        onClick={() => { if (isOwned) navigate(`/project-details/${project.id}`); }}
                      >
                        {/* Row 1: Project name + role badge (same as modal) */}
                        <div className="flex items-start gap-2 w-full min-w-0">
                          <h3 className={`flex-1 min-w-0 font-semibold text-base truncate ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-white'}`} title={project.name}>
                            {project.name}
                          </h3>
                          <span className="flex-shrink-0 mt-0.5">
                            {isOwned ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 rounded">
                                <FiShield className="w-3 h-3" />
                                Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600/50 rounded">
                                <FiUserCheck className="w-3 h-3" />
                                Agent
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Row 2: Owner */}
                        {project.owner_name && (
                          <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 min-w-0">
                            <FiUser className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                            <span className="truncate">{project.owner_name}</span>
                          </p>
                        )}

                        {/* Row 3: Active + View Details (View Details only for owned) */}
                        <div className="mt-auto pt-2 flex items-center gap-2 flex-wrap">
                          {isActive && (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 rounded-full">
                              Current
                            </span>
                          )}
                          {isOwned && (
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/project-details/${project.id}`); }}
                              className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium"
                            >
                              <FiEye className="w-3.5 h-3.5" />
                              View Details
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Project Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <FiBriefcase className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingProject ? 'Edit Project' : 'Create New Project'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter company name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter project name"
                    />
                  </div>

                  {/* Package selection (create only) */}
                  {!editingProject && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Package
                      </label>
                      {packageLoading ? (
                        <div className="text-sm text-gray-500 py-2">Loading pricing...</div>
                      ) : subscriptionPackage ? (
                        <div className="space-y-3">
                          <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-100">
                            <button
                              type="button"
                              onClick={() => setBillingCycle('monthly')}
                              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                billingCycle === 'monthly'
                                  ? 'bg-white text-indigo-600 shadow-sm border border-gray-200'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              Monthly — ₹{subscriptionPackage.monthly?.amount != null ? Number(subscriptionPackage.monthly.amount).toLocaleString() : '0'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setBillingCycle('yearly')}
                              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                billingCycle === 'yearly'
                                  ? 'bg-white text-indigo-600 shadow-sm border border-gray-200'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              Yearly — ₹{subscriptionPackage.yearly?.amount != null ? Number(subscriptionPackage.yearly.amount).toLocaleString() : '0'}
                            </button>
                          </div>
                          <p className="text-xs text-gray-500">
                            {billingCycle === 'monthly' ? 'Billed per month per project.' : 'Billed per year per project.'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Pricing not available.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="mt-6 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    disabled={submitting}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiCheck size={18} />
                    <span>{submitting ? 'Creating...' : `${editingProject ? 'Update' : 'Create'} Project`}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wallet / Fund load modal (402 - insufficient balance) */}
      <AnimatePresence>
        {showWalletRechargeModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowWalletRechargeModal(false)}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                  <FiDollarSign className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Insufficient wallet balance</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Your wallet balance is not enough to complete this action. Please recharge your wallet to continue.
                </p>
                <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-6">
                  Amount due: ₹{Number(walletRechargeAmount).toLocaleString()}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setShowWalletRechargeModal(false)}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleWalletRechargeNavigate}
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <FiCreditCard className="mr-2 w-4 h-4" />
                    Recharge wallet
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Projects;
