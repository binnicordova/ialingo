import { ScrollView, StyleSheet } from 'react-native';

import { ActivityTiles } from '../components/HomeActivities';
import { AppText, Screen } from '../components/ui';
import { useT } from '../i18n/use-t';
import { spacing } from '../theme/tokens';

/** The Play tab: Word Gym, Play Park and the sticker album. */
export function PlayScreen() {
  const { t } = useT();
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.body}>
        <AppText variant="title" accessibilityRole="header">
          {t('playTitle')}
        </AppText>
        <ActivityTiles />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.lg, gap: spacing.lg },
});
