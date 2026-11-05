import { Guarded } from '@/presentation/components/Guarded';
import { AlbumScreen } from '@/presentation/screens/AlbumScreen';

export default function AlbumRoute() {
  return (
    <Guarded>
      <AlbumScreen />
    </Guarded>
  );
}
