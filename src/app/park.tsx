import { Guarded } from '@/presentation/components/Guarded';
import { ParkScreen } from '@/presentation/screens/ParkScreen';

export default function ParkRoute() {
  return (
    <Guarded>
      <ParkScreen />
    </Guarded>
  );
}
