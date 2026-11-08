import { Tabs } from 'expo-router/tabs';

import { KidTabBar } from '@/presentation/components/KidTabBar';
import { colors } from '@/presentation/theme/tokens';

/** The minimal home: the map, plus four tabs for everything else. */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
      tabBar={(props) => <KidTabBar {...props} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="play" />
      <Tabs.Screen name="quests" />
      <Tabs.Screen name="pets" />
      <Tabs.Screen name="me" />
    </Tabs>
  );
}
