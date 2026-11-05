import { useLocalSearchParams } from 'expo-router';

import { Guarded } from '@/presentation/components/Guarded';
import { LessonScreen } from '@/presentation/screens/LessonScreen';

export default function LessonRoute() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  return (
    <Guarded>
      <LessonScreen lessonId={String(lessonId)} />
    </Guarded>
  );
}
