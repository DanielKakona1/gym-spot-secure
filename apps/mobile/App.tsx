import { QueryClientProvider } from '@tanstack/react-query';
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { queryClient } from './src/lib/queryClient';
import { AdminScreen } from './src/screens/AdminScreen';
import { BookingScreen } from './src/screens/BookingScreen';

type ActiveTab = 'booking' | 'admin';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('booking');
  const [fontsLoaded] = useFonts({
    Poppins: Poppins_400Regular,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar style="dark" />
          {activeTab === 'booking' ? (
            <BookingScreen onGoToAdmin={() => setActiveTab('admin')} />
          ) : (
            <AdminScreen onBackToBooking={() => setActiveTab('booking')} />
          )}
        </SafeAreaView>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F5',
  },
});
