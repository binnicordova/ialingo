import { useLocalSearchParams } from 'expo-router';

import { Guarded } from '@/presentation/components/Guarded';
import { MiniGameScreen } from '@/presentation/screens/MiniGameScreen';

export default function MiniGameRoute() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  return (
    <Guarded>
      <MiniGameScreen kind={String(kind)} />
    </Guarded>
  );
}
