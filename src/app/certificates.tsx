import { Guarded } from '@/presentation/components/Guarded';
import { CertificatesScreen } from '@/presentation/screens/CertificatesScreen';

export default function CertificatesRoute() {
  return (
    <Guarded>
      <CertificatesScreen />
    </Guarded>
  );
}
