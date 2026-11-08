import { Guarded } from '@/presentation/components/Guarded';
import { PlayScreen } from '@/presentation/screens/PlayScreen';

export default function PlayRoute() {
  return (
    <Guarded>
      <PlayScreen />
    </Guarded>
  );
}
