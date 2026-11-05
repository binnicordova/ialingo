import { Guarded } from '@/presentation/components/Guarded';
import { GuidesScreen } from '@/presentation/screens/GuidesScreen';

export default function GuidesRoute() {
  return (
    <Guarded>
      <GuidesScreen />
    </Guarded>
  );
}
