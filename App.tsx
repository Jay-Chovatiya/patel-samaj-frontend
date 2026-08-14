import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { store, persistor } from './src/store';
import { theme } from './src/theme';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthSession } from './src/hooks/useAuthSession';
import { ToastProvider } from './src/context/ToastContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const MainApp = () => {
  useAuthSession();

  return (
    <PaperProvider theme={theme}>
      <ToastProvider>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="light" />
        </NavigationContainer>
      </ToastProvider>
    </PaperProvider>
  );
};

export default function App() {
  return (
    <ReduxProvider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <MainApp />
        </QueryClientProvider>
      </PersistGate>
    </ReduxProvider>
  );
}

