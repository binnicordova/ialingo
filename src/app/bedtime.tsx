import { Guarded } from '@/presentation/components/Guarded';
import { BedtimeScreen } from '@/presentation/screens/BedtimeScreen';

export default function BedtimeRoute() {
  return (
    <Guarded>
      <BedtimeScreen />
    </Guarded>
  );
}
