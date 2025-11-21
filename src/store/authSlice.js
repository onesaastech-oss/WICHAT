import { createSlice } from '@reduxjs/toolkit';

// This slice keeps global auth + project selection state
// so any thunk or component can access token / project_id.

const initialState = {
  token: null,
  username: null,
  profile: null,
  projects: [],
  projectCount: 0,
  selectedProjectId: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthData: (state, action) => {
      const payload = action.payload || {};
      state.token = payload.token || null;
      state.username = payload.username || null;
      state.profile = payload.profile || null;
      state.projects = Array.isArray(payload.projects) ? payload.projects : [];
      state.projectCount = typeof payload.project_count === 'number'
        ? payload.project_count
        : state.projects.length;

      // Auto-select project when there is exactly one
      if (state.projects.length === 1) {
        state.selectedProjectId = state.projects[0]?.project_id || null;
      }
    },
    setSelectedProjectId: (state, action) => {
      state.selectedProjectId = action.payload || null;
    },
    clearAuth: () => initialState
  }
});

export const {
  setAuthData,
  setSelectedProjectId,
  clearAuth
} = authSlice.actions;

export default authSlice.reducer;


