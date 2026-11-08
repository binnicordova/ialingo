import { Guarded } from '@/presentation/components/Guarded';
import { PetsScreen } from '@/presentation/screens/PetsScreen';

export default function PetsRoute() {
  return (
    <Guarded>
      <PetsScreen />
    </Guarded>
  );
}
