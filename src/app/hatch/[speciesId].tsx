import { useLocalSearchParams } from 'expo-router';

import { Guarded } from '@/presentation/components/Guarded';
import { HatchScreen } from '@/presentation/screens/HatchScreen';

export default function HatchRoute() {
  const { speciesId } = useLocalSearchParams<{ speciesId: string }>();
  return (
    <Guarded>
      <HatchScreen speciesId={String(speciesId)} />
    </Guarded>
  );
}
