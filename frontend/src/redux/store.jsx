// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/authSlice';
import motorReducer from './slices/motorSlice';
import bqpReducer from './slices/bqpSlice';
import reportingReducer from './slices/reportingSlice';
import relationshipReducer from './slices/relationshipSlice';
import posReducer from "./slices/posSlice";
import setCountReducer from "./slices/setCountSlice";

const persistedAuthReducer = persistReducer(
  { key: 'auth', storage, whitelist: ['user', 'token'] },
  authReducer
);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    motor: motorReducer,
    bqp: bqpReducer,
    reporting: reportingReducer,
    relationship: relationshipReducer,
    pos: posReducer,
    setCount: setCountReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);