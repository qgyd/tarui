import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";
import storage from "redux-persist/lib/storage"; // 默认使用 localStorage
import userReducer from "./slices/userSlice";
import themeReducer from "./slices/themeSlice";

// 1. 合并所有 reducer
const rootReducer = combineReducers({
  user: userReducer,
  theme: themeReducer,
});

// 2. 配置持久化参数
const persistConfig = {
  key: "root",
  storage,
  // 如果只想持久化部分 reducer，可以在这里配置 whitelist 或 blacklist
  // whitelist: ['user'],
};

// 3. 创建持久化的 reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 4. 配置 store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略 redux-persist 的一些 action，防止报错
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// 5. 创建 persistor
export const persistor = persistStore(store);

// 6. 导出类型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
