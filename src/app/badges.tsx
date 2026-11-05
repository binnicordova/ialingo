import { Guarded } from '@/presentation/components/Guarded';
import { BadgesScreen } from '@/presentation/screens/BadgesScreen';

export default function BadgesRoute() {
  return (
    <Guarded>
      <BadgesScreen />
    </Guarded>
  );
}
