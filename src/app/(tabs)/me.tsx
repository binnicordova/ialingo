import { Guarded } from '@/presentation/components/Guarded';
import { MeScreen } from '@/presentation/screens/MeScreen';

export default function MeRoute() {
  return (
    <Guarded>
      <MeScreen />
    </Guarded>
  );
}
