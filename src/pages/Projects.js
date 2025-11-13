import React, { useState, useEffect } from 'react';
import { Header, Sidebar } from '../component/Menu';
import { 
  FiPlus, 
  FiSearch, 
  FiBriefcase, 
  FiEdit2, 
  FiTrash2, 
  FiX, 
  FiUsers,
  FiCalendar,
  FiMoreVertical,
  FiCheck
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';

const Projects = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem('sidebarMinimized');
    return saved ? JSON.parse(saved) : false;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showActionsMenu, setShowActionsMenu] = useState(null);

  // Dummy projects data
  const [projects, setProjects] = useState([
    {
      id: 1,
      name: 'Acme Corporation',
      description: 'Technology Solutions Provider',
      status: 'Active',
      members: 12,
      createdAt: '2024-01-15T10:30:00',
      updatedAt: '2024-01-20T14:20:00'
    },
    {
      id: 2,
      name: 'Global Industries',
      description: 'Manufacturing & Trade Company',
      status: 'Active',
      members: 8,
      createdAt: '2024-01-10T09:15:00',
      updatedAt: '2024-01-18T11:45:00'
    },
    {
      id: 3,
      name: 'Digital Ventures',
      description: 'Software Development Agency',
      status: 'Active',
      members: 15,
      createdAt: '2024-01-08T14:20:00',
      updatedAt: '2024-01-19T16:30:00'
    },
    {
      id: 4,
      name: 'TechStart Inc.',
      description: 'Startup Accelerator Program',
      status: 'Inactive',
      members: 5,
      createdAt: '2023-12-20T08:00:00',
      updatedAt: '2024-01-05T10:15:00'
    },
    {
      id: 5,
      name: 'Enterprise Solutions',
      description: 'Business Consulting Services',
      status: 'Active',
      members: 20,
      createdAt: '2023-12-15T11:30:00',
      updatedAt: '2024-01-22T09:20:00'
    },
    {
      id: 6,
      name: 'Cloud Services Ltd',
      description: 'Cloud Infrastructure Provider',
      status: 'Active',
      members: 10,
      createdAt: '2024-01-12T13:45:00',
      updatedAt: '2024-01-21T15:10:00'
    }
  ]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'Active'
  });

  useEffect(() => {
    localStorage.setItem('sidebarMinimized', JSON.stringify(isMinimized));
  }, [isMinimized]);

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

  // Filter projects based on search
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateProject = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      status: 'Active'
    });
    setShowCreateModal(true);
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      status: project.status
    });
    setShowActionsMenu(null);
    setShowCreateModal(true);
  };

  const handleDeleteProject = (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      setProjects(projects.filter(p => p.id !== projectId));
      setShowActionsMenu(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingProject) {
      // Update existing project
      setProjects(projects.map(p => 
        p.id === editingProject.id 
          ? { 
              ...p, 
              ...formData, 
              updatedAt: new Date().toISOString() 
            }
          : p
      ));
    } else {
      // Create new project
      const newProject = {
        id: projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1,
        ...formData,
        members: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setProjects([...projects, newProject]);
    }
    setShowCreateModal(false);
    setFormData({ name: '', description: '', status: 'Active' });
    setEditingProject(null);
  };

  const getStatusColor = (status) => {
    return status === 'Active' 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (showCreateModal) {
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
  }, [showCreateModal]);

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

      {/* Main content */}
      <div className={`pt-16 transition-all duration-300 ease-in-out ${isMinimized ? 'md:pl-20' : 'md:pl-72'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6">
          {/* Header Section */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Projects</h1>
              <p className="text-gray-600">Manage your projects and teams</p>
            </div>
            <button
              onClick={handleCreateProject}
              className="flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <FiPlus size={20} />
              <span>Create Project</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Projects Grid */}
          {filteredProjects.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <FiBriefcase className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No projects found' : 'No projects yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Get started by creating your first project'}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl shadow hover:shadow-lg transition-shadow duration-200 p-6 relative"
                >
                  {/* Actions Menu */}
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => setShowActionsMenu(showActionsMenu === project.id ? null : project.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <FiMoreVertical size={18} />
                    </button>
                    {showActionsMenu === project.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowActionsMenu(null)}
                        />
                        <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                          <button
                            onClick={() => handleEditProject(project)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                          >
                            <FiEdit2 size={16} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                          >
                            <FiTrash2 size={16} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Project Icon */}
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <FiBriefcase className="text-indigo-600" size={24} />
                    </div>
                  </div>

                  {/* Project Info */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{project.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>

                  {/* Project Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-1 text-gray-600">
                      <FiUsers size={16} />
                      <span className="text-sm">{project.members} members</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>

                  {/* Project Dates */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <FiCalendar size={14} />
                      <span>Updated {moment(project.updatedAt).fromNow()}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Stats Summary */}
          {filteredProjects.length > 0 && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow p-4">
                <p className="text-sm text-gray-600 mb-1">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{filteredProjects.length}</p>
              </div>
              <div className="bg-white rounded-xl shadow p-4">
                <p className="text-sm text-gray-600 mb-1">Active Projects</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredProjects.filter(p => p.status === 'Active').length}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow p-4">
                <p className="text-sm text-gray-600 mb-1">Total Members</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {filteredProjects.reduce((sum, p) => sum + p.members, 0)}
                </p>
              </div>
            </div>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter project description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="mt-6 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 flex items-center space-x-2"
                  >
                    <FiCheck size={18} />
                    <span>{editingProject ? 'Update' : 'Create'} Project</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Projects;
