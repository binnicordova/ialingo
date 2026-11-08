import { Guarded } from '@/presentation/components/Guarded';
import { HomeScreen } from '@/presentation/screens/HomeScreen';

export default function HomeRoute() {
  return (
    <Guarded>
      <HomeScreen />
    </Guarded>
  );
}
