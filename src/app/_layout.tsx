import {
  Fredoka_400Regular,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
  useFonts,
} from '@expo-google-fonts/fredoka';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { createStore, Provider } from 'jotai';
import { useEffect, useRef, useState } from 'react';

import { detectDeviceLocale } from '@/infrastructure/device/device';
import { createAppServices } from '@/infrastructure/services';
import { CelebrationOverlay } from '@/presentation/components/CelebrationOverlay';
import { useAppLifecycle } from '@/presentation/hooks/use-app-lifecycle';
import { colors } from '@/presentation/theme/tokens';
import { bootstrapStore, type Autosave } from '@/state/bootstrap';

void SplashScreen.preventAutoHideAsync();

/** One store for the app's lifetime (Jotai atoms live here). */
const store = createStore();
const services = createAppServices();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fredoka_400Regular,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
  });
  const [hydrated, setHydrated] = useState(false);
  const autosaveRef = useRef<Autosave | null>(null);

  useEffect(() => {
    let cancelled = false;
    bootstrapStore(store, services, detectDeviceLocale())
      .then((autosave) => {
        if (cancelled) {
          void autosave.stop();
          return;
        }
        autosaveRef.current = autosave;
        setHydrated(true);
      })
      .catch(() => setHydrated(true));
    return () => {
      cancelled = true;
      void autosaveRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded && hydrated) void SplashScreen.hideAsync();
  }, [fontsLoaded, hydrated]);

  if (!fontsLoaded || !hydrated) return null;

  return (
    <Provider store={store}>
      <StatusBar style="dark" />
      <AppShell onBackground={() => void autosaveRef.current?.flush()} />
    </Provider>
  );
}

function AppShell({ onBackground }: { onBackground: () => void }) {
  useAppLifecycle(onBackground);
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="lesson/[lessonId]" options={{ gestureEnabled: false, animation: 'fade_from_bottom' }} />
        <Stack.Screen name="bedtime" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="welcome" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="profiles" options={{ gestureEnabled: false, animation: 'fade' }} />
      </Stack>
      <CelebrationOverlay />
    </>
  );
}
