import { Guarded } from '@/presentation/components/Guarded';
import { GymScreen } from '@/presentation/screens/GymScreen';

export default function GymRoute() {
  return (
    <Guarded>
      <GymScreen />
    </Guarded>
  );
}
