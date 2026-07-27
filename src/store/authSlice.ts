import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isFromLogin: boolean;
  rememberedMobile: string | null;
}

const initialState: AuthState = {
  token: null,
  user: null,
  isAuthenticated: false,
  isFromLogin: false,
  rememberedMobile: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: User; isFromLogin?: boolean }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isFromLogin = action.payload.isFromLogin ?? true;
    },
    updateProfile: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    logoutAction: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.isFromLogin = false;
    },
    setRememberedMobile: (state, action: PayloadAction<string | null>) => {
      state.rememberedMobile = action.payload;
    },
  },
});

export const { setCredentials, updateProfile, logoutAction, setRememberedMobile } =
  authSlice.actions;

export default authSlice.reducer;
