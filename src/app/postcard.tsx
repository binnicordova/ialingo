import { Guarded } from '@/presentation/components/Guarded';
import { PostcardScreen } from '@/presentation/screens/PostcardScreen';

export default function PostcardRoute() {
  return (
    <Guarded>
      <PostcardScreen />
    </Guarded>
  );
}
