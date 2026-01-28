import { configureStore } from '@reduxjs/toolkit';
import projectReducer from './projectSlice';
import authReducer from './authSlice';

const store = configureStore({
  reducer: {
    project: projectReducer,
    auth: authReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export default store;


