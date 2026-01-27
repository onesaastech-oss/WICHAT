import { configureStore } from '@reduxjs/toolkit';
import projectReducer from './projectSlice';
import authReducer from './authSlice';
import chatReducer from './chatSlice';

const store = configureStore({
  reducer: {
    project: projectReducer,
    auth: authReducer,
    chat: chatReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export default store;


