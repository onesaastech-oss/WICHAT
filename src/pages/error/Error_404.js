import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Error_404 = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="relative h-48 bg-gradient-to-r from-purple-500 to-indigo-600 overflow-hidden">
          <motion.div
            animate={{
              x: [0, 20, -20, 0],
              y: [0, -20, 20, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full opacity-20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#FFFFFF"
                d="M45.1,-65.6C58.2,-58.4,68.5,-45.8,73.9,-31.4C79.3,-17,79.7,-0.8,75.9,13.2C72.1,27.1,64.1,38.9,53.1,49.2C42.1,59.5,28.1,68.3,12.5,73.8C-3.1,79.3,-20.3,81.6,-34.9,74.9C-49.5,68.2,-61.5,52.6,-68.2,35.2C-74.9,17.8,-76.3,-1.4,-70.9,-17.8C-65.5,-34.2,-53.3,-47.8,-39.1,-54.7C-24.9,-61.6,-8.7,-61.8,6.3,-69.5C21.3,-77.2,42.6,-92.4,45.1,-65.6Z"
                transform="translate(100 100)"
              />
            </svg>
          </motion.div>
          <div className="relative z-10 h-full flex flex-col items-center justify-center">
            <motion.h1 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              className="text-9xl font-bold text-white"
            >
              404
            </motion.h1>
          </div>
        </div>

        <div className="p-8 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold text-gray-800 mb-2"
          >
            Oops! Page Not Found
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mb-6"
          >
            The page you're looking for doesn't exist or has been moved.
          </motion.p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition-all"
            >
              Go Back
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all"
            >
              Go to Home
            </motion.button>
          </div>
        </div>

        <div className="px-8 py-4 bg-gray-50 text-center">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-sm text-gray-500"
          >
            Need help? <a href="#" className="text-indigo-600 hover:underline">Contact support</a>
          </motion.p>
        </div>
      </motion.div>

      {/* Floating animated elements */}
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
          rotate: [0, 10, 0]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }}
        className="hidden md:block absolute top-1/4 left-1/4 w-16 h-16 bg-purple-200 rounded-full opacity-20"
      />
      
      <motion.div
        animate={{
          x: [0, -40, 0],
          y: [0, 40, 0],
          rotate: [0, -15, 0]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
          delay: 2
        }}
        className="hidden md:block absolute bottom-1/4 right-1/4 w-20 h-20 bg-indigo-200 rounded-full opacity-20"
      />
    </div>
  );
};

export default Error_404;