import { useLocalSearchParams } from 'expo-router';

import { Guarded } from '@/presentation/components/Guarded';
import { WorldScreen } from '@/presentation/screens/WorldScreen';

export default function WorldRoute() {
  const { worldId } = useLocalSearchParams<{ worldId: string }>();
  return (
    <Guarded>
      <WorldScreen worldId={String(worldId)} />
    </Guarded>
  );
}
