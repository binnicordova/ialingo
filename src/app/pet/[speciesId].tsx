import { useLocalSearchParams } from 'expo-router';

import { Guarded } from '@/presentation/components/Guarded';
import { PetRoomScreen } from '@/presentation/screens/PetRoomScreen';

export default function PetRoute() {
  const { speciesId } = useLocalSearchParams<{ speciesId: string }>();
  return (
    <Guarded>
      <PetRoomScreen speciesId={String(speciesId)} />
    </Guarded>
  );
}
