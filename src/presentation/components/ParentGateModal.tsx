import { useAtomValue } from 'jotai';
import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import { createGateChallenge, verifyGate } from '@/domain/parental/gate';
import { createRng } from '@/domain/shared/rng';
import { servicesAtom } from '@/state/core';

import { useT } from '../i18n/use-t';
import { colors, radii, spacing } from '../theme/tokens';
import { NumberPad } from './game';
import { AppText, BigButton } from './ui';

/**
 * The parental gate as a modal, for grown-up actions inside child screens
 * (sharing a certificate, for example). Same rule as the parent area.
 */
export function ParentGateModal({
  visible,
  onPass,
  onCancel,
}: {
  visible: boolean;
  onPass: () => void;
  onCancel: () => void;
}) {
  const { t } = useT();
  const services = useAtomValue(servicesAtom);
  const [challenge, setChallenge] = useState(() => createGateChallenge(createRng(services.clock.now())));
  const [input, setInput] = useState('');
  const [wrong, setWrong] = useState(false);

  const submit = () => {
    if (verifyGate(challenge, input)) {
      setInput('');
      setWrong(false);
      onPass();
      return;
    }
    setWrong(true);
    setInput('');
    setChallenge(createGateChallenge(createRng(services.clock.now() + 11)));
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <AppText variant="heading" center>
            🔒 {t('parentsOnly')}
          </AppText>
          <AppText variant="title" center>
            {t('gateQuestion', { a: challenge.a, b: challenge.b })}
          </AppText>
          <AppText variant="hero" center color={colors.primary}>
            {input || '—'}
          </AppText>
          {wrong ? (
            <AppText variant="small" center color={colors.danger}>
              {t('gateWrong')}
            </AppText>
          ) : null}
          <NumberPad
            enterLabel={t('enter')}
            onDigit={(d) => setInput((v) => (v.length < 3 ? v + d : v))}
            onDelete={() => setInput((v) => v.slice(0, -1))}
            onEnter={submit}
          />
          <BigButton label={t('cancel')} tone="neutral" compact onPress={onCancel} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.lg, gap: spacing.sm },
});
