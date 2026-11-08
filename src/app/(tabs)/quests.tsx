import { Guarded } from '@/presentation/components/Guarded';
import { QuestsScreen } from '@/presentation/screens/QuestsScreen';

export default function QuestsRoute() {
  return (
    <Guarded>
      <QuestsScreen />
    </Guarded>
  );
}
