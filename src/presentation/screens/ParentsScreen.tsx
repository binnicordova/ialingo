import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { worldStars } from '@/domain/curriculum/unlock-policy';
import { createGateChallenge, verifyGate, type GateChallenge } from '@/domain/parental/gate';
import { createRng } from '@/domain/shared/rng';
import { SUPPORTED_LOCALES } from '@/domain/shared/locale';
import { EXTRA_TIME_MINUTES, SCREEN_TIME_OPTIONS_MINUTES } from '@/domain/wellbeing/screen-time';
import { levelForXp, stageForLevel } from '@/domain/pets/leveling';
import { MAX_PROFILES } from '@/domain/profiles/profiles';
import {
  deletePostcardAtom,
  downloadOfflineModelAtom,
  grantExtraTimeAtom,
  refreshRecognitionAtom,
  resetGameAtom,
  tapFeedbackAtom,
  updateSettingsAtom,
} from '@/state/actions';
import { activeProfileIdAtom, contentAtom, recognitionAtom, servicesAtom } from '@/state/core';
import {
  addProfileAtom,
  canAddProfileAtom,
  deleteProfileAtom,
  profilesAtom,
  switchProfileAtom,
} from '@/state/profiles';
import { progressAtom, screenTimeAtom, settingsAtom, statsAtom, voiceDiaryAtom } from '@/state/selectors';

import { EggPortrait, PetPortrait } from '../art/PetPortrait';

import { NumberPad, SectionTitle } from '../components/game';
import { AppText, BigButton, Card, ProgressBar, Screen, TopBar } from '../components/ui';
import { useT } from '../i18n/use-t';
import { colors, radii, spacing } from '../theme/tokens';

function newChallenge(seed: number): GateChallenge {
  return createGateChallenge(createRng(seed));
}

/** Grown-ups area, behind a parental gate. */
export function ParentsScreen() {
  const [unlocked, setUnlocked] = useState(false);
  return unlocked ? <Dashboard /> : <Gate onPass={() => setUnlocked(true)} />;
}

function Gate({ onPass }: { onPass: () => void }) {
  const { t } = useT();
  const services = useAtomValue(servicesAtom);
  const [challenge, setChallenge] = useState(() => newChallenge(services.clock.now()));
  const [input, setInput] = useState('');
  const [wrong, setWrong] = useState(false);

  const submit = () => {
    if (verifyGate(challenge, input)) {
      onPass();
      return;
    }
    setWrong(true);
    setInput('');
    setChallenge(newChallenge(services.clock.now() + 7));
  };

  return (
    <Screen background={colors.surfaceAlt}>
      <TopBar title={t('parentsOnly')} onBack={() => router.back()} />
      <View style={styles.gate}>
        <AppText variant="title" center>
          {t('gateQuestion', { a: challenge.a, b: challenge.b })}
        </AppText>
        <View style={styles.inputBox} accessibilityLabel={input || '—'}>
          <AppText variant="hero" center color={colors.primary}>
            {input || '—'}
          </AppText>
        </View>
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
      </View>
    </Screen>
  );
}

function Choice({ label, selected, onPress, testID }: { label: string; selected: boolean; onPress: () => void; testID?: string }) {
  const feedback = useSetAtom(tapFeedbackAtom);
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      aria-selected={selected}
      onPress={() => {
        feedback();
        onPress();
      }}
      style={[styles.choice, selected && styles.choiceOn]}
    >
      <AppText variant="small" color={selected ? '#FFFFFF' : colors.ink}>
        {label}
      </AppText>
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="title" color={colors.primary}>
        {value}
      </AppText>
      <AppText variant="tiny" color={colors.inkSoft} center>
        {label}
      </AppText>
    </View>
  );
}

function Dashboard() {
  const { t, l } = useT();
  const stats = useAtomValue(statsAtom);
  const settings = useAtomValue(settingsAtom);
  const screen = useAtomValue(screenTimeAtom);
  const progress = useAtomValue(progressAtom);
  const content = useAtomValue(contentAtom);
  const update = useSetAtom(updateSettingsAtom);
  const extraTime = useSetAtom(grantExtraTimeAtom);
  const reset = useSetAtom(resetGameAtom);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [extraGiven, setExtraGiven] = useState(false);

  return (
    <Screen background={colors.surfaceAlt}>
      <TopBar title={t('parents')} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <SectionTitle>{t('progress')}</SectionTitle>
        <Card style={styles.stats}>
          <Stat label={t('wordsLearned')} value={`${stats.wordsLearned}/${stats.totalWords}`} />
          <Stat label={t('wordsMastered')} value={String(stats.wordsMastered)} />
          <Stat label={t('lessonsDone')} value={`${stats.lessonsCompleted}/${stats.totalLessons}`} />
          <Stat label={t('daysPlayed')} value={String(stats.daysPlayed)} />
          <Stat label={t('accuracy')} value={`${Math.round(stats.accuracy * 100)}%`} />
          <Stat label={t('todayMinutes')} value={String(screen.minutesUsedToday)} />
        </Card>

        <SectionTitle>{t('worldProgress')}</SectionTitle>
        <Card style={styles.worldList}>
          {content.orderedWorlds.map((world) => {
            const stars = worldStars(world, progress);
            return (
              <View key={world.id} style={styles.worldRow}>
                <AppText variant="small" style={styles.worldName} numberOfLines={1}>
                  {world.emoji} {l(world.title)}
                </AppText>
                <ProgressBar value={stars.earned / stars.max} height={10} color={world.color} style={styles.worldBar} />
              </View>
            );
          })}
        </Card>

        <SectionTitle>{t('settings')}</SectionTitle>
        <Card style={styles.settings}>
          <AppText variant="heading">{t('appLanguage')}</AppText>
          <View style={styles.choices}>
            {SUPPORTED_LOCALES.map((locale) => (
              <Choice
                key={locale}
                label={t(`languageName_${locale}`)}
                selected={settings.uiLocale === locale}
                onPress={() => update({ uiLocale: locale })}
              />
            ))}
          </View>

          <AppText variant="heading">{t('voiceSpeed')}</AppText>
          <View style={styles.choices}>
            <Choice label={t('slow')} selected={settings.voiceSpeed === 'slow'} onPress={() => update({ voiceSpeed: 'slow' })} />
            <Choice label={t('normal')} selected={settings.voiceSpeed === 'normal'} onPress={() => update({ voiceSpeed: 'normal' })} />
          </View>

          <AppText variant="heading">{t('soundEffects')}</AppText>
          <View style={styles.choices}>
            <Choice label={t('on')} selected={settings.soundEffects} onPress={() => update({ soundEffects: true })} />
            <Choice label={t('off')} selected={!settings.soundEffects} onPress={() => update({ soundEffects: false })} />
          </View>

          <AppText variant="heading">{t('vibration')}</AppText>
          <View style={styles.choices}>
            <Choice label={t('on')} selected={settings.haptics} onPress={() => update({ haptics: true })} />
            <Choice label={t('off')} selected={!settings.haptics} onPress={() => update({ haptics: false })} />
          </View>

          <AppText variant="heading">{t('reducedMotion')}</AppText>
          <View style={styles.choices}>
            <Choice label={t('on')} selected={settings.reducedMotion} onPress={() => update({ reducedMotion: true })} />
            <Choice label={t('off')} selected={!settings.reducedMotion} onPress={() => update({ reducedMotion: false })} />
          </View>

          <AppText variant="heading">{t('dailyLimit')}</AppText>
          <View style={styles.choices}>
            {SCREEN_TIME_OPTIONS_MINUTES.map((minutes) => (
              <Choice
                key={minutes}
                testID={`limit-${minutes}`}
                label={t('minutesShort', { n: minutes })}
                selected={settings.dailyLimitMinutes === minutes}
                onPress={() => update({ dailyLimitMinutes: minutes })}
              />
            ))}
            <Choice label={t('noLimit')} selected={settings.dailyLimitMinutes === null} onPress={() => update({ dailyLimitMinutes: null })} />
          </View>
          {settings.dailyLimitMinutes !== null ? (
            <BigButton
              label={extraGiven ? t('extraTimeGiven') : t('extraTime')}
              icon="⏱️"
              tone="sky"
              compact
              onPress={() => {
                extraTime(EXTRA_TIME_MINUTES);
                setExtraGiven(true);
              }}
              testID="extra-time"
            />
          ) : null}
        </Card>

        <SectionTitle>{t('profiles')}</SectionTitle>
        <PlayersSection />

        <SectionTitle>{t('speakingPractice')}</SectionTitle>
        <SpeakingSection />

        <SectionTitle>{t('voiceDiary')}</SectionTitle>
        <VoiceDiarySection />

        <SectionTitle>{t('privacyTitle')}</SectionTitle>
        <Card>
          <AppText variant="small" color={colors.inkSoft}>
            🔒 {t('privacyBody')}
          </AppText>
        </Card>

        <BigButton label={t('backToGame')} tone="success" onPress={() => router.back()} />
        <BigButton label={t('deleteData')} tone="danger" compact icon="🗑️" onPress={() => setConfirmDelete(true)} />
      </ScrollView>

      <Modal transparent visible={confirmDelete} animationType="fade" onRequestClose={() => setConfirmDelete(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText variant="heading" center>
              {t('deleteConfirm')}
            </AppText>
            <BigButton
              label={t('delete')}
              tone="danger"
              onPress={() => {
                setConfirmDelete(false);
                reset();
                router.replace('/welcome');
              }}
            />
            <BigButton label={t('cancel')} tone="neutral" compact onPress={() => setConfirmDelete(false)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function PlayersSection() {
  const { t } = useT();
  const profiles = useAtomValue(profilesAtom);
  const activeId = useAtomValue(activeProfileIdAtom);
  const canAdd = useAtomValue(canAddProfileAtom);
  const content = useAtomValue(contentAtom);
  const switchProfile = useSetAtom(switchProfileAtom);
  const addProfile = useSetAtom(addProfileAtom);
  const deleteProfile = useSetAtom(deleteProfileAtom);
  const [confirm, setConfirm] = useState<string | null>(null);
  const starter = content.species('sprout');

  return (
    <Card style={styles.settings}>
      {profiles.map((profile) => {
        const species = profile.petSpeciesId ? content.species(profile.petSpeciesId) : undefined;
        const active = profile.id === activeId;
        return (
          <View key={profile.id} style={styles.playerRow}>
            {species ? (
              <PetPortrait blueprint={species.blueprint} stage={stageForLevel(levelForXp(profile.petXp))} size={52} />
            ) : starter ? (
              <EggPortrait blueprint={starter.blueprint} size={48} />
            ) : null}
            <View style={styles.flex}>
              <AppText variant="heading" numberOfLines={1}>
                {profile.petNickname ?? t('newPlayer')}
              </AppText>
              <AppText variant="tiny" color={colors.inkSoft}>
                {active ? t('playingNow') : t('lessonsDone') + `: ${profile.lessonsCompleted}`}
              </AppText>
            </View>
            {!active ? (
              <Choice
                label={t('switchPlayer')}
                selected={false}
                onPress={async () => {
                  await switchProfile(profile.id);
                  router.replace(profile.onboarded ? '/home' : '/welcome');
                }}
              />
            ) : null}
            {profiles.length > 1 ? (
              <Choice label="🗑️" selected={false} onPress={() => setConfirm(profile.id)} />
            ) : null}
          </View>
        );
      })}
      {canAdd ? (
        <BigButton
          label={t('addPlayer')}
          icon="➕"
          tone="primary"
          compact
          onPress={async () => {
            const id = await addProfile();
            if (id) router.replace('/welcome');
          }}
          testID="add-player"
        />
      ) : null}
      <AppText variant="tiny" color={colors.inkSoft}>
        {t('maxPlayers', { n: MAX_PROFILES })}
      </AppText>
      <Modal transparent visible={confirm !== null} animationType="fade" onRequestClose={() => setConfirm(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <AppText variant="heading" center>
              {t('deletePlayerConfirm')}
            </AppText>
            <BigButton
              label={t('deletePlayer')}
              tone="danger"
              onPress={async () => {
                const id = confirm;
                setConfirm(null);
                if (id) await deleteProfile(id);
              }}
            />
            <BigButton label={t('cancel')} tone="neutral" compact onPress={() => setConfirm(null)} />
          </View>
        </View>
      </Modal>
    </Card>
  );
}

function SpeakingSection() {
  const { t } = useT();
  const settings = useAtomValue(settingsAtom);
  const recognition = useAtomValue(recognitionAtom);
  const update = useSetAtom(updateSettingsAtom);
  const downloadModel = useSetAtom(downloadOfflineModelAtom);
  const refresh = useSetAtom(refreshRecognitionAtom);
  const [offlineNote, setOfflineNote] = useState<string | null>(null);
  const usable = recognition.installed && recognition.available;

  // A model downloaded in the background shows up the next time this opens.
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const status = !usable
    ? t('recognitionUnavailable')
    : recognition.onDevice
      ? t('recognitionOnDevice')
      : t('recognitionOnline');
  return (
    <Card style={styles.settings}>
      <AppText variant="small" color={colors.inkSoft}>
        🎤 {status}
      </AppText>
      <View style={styles.choices}>
        <Choice
          label={t('speakingRecognition')}
          selected={settings.speaking === 'recognition'}
          onPress={() => update({ speaking: 'recognition' })}
          testID="speaking-recognition"
        />
        <Choice
          label={t('speakingSelfCheck')}
          selected={settings.speaking === 'self-check'}
          onPress={() => update({ speaking: 'self-check' })}
          testID="speaking-self-check"
        />
      </View>
      {recognition.offlineModel === 'missing' ? (
        <View style={styles.offline}>
          <AppText variant="heading">⬇️ {t('offlineModelTitle')}</AppText>
          <AppText variant="small" color={colors.inkSoft}>
            {t('offlineModelMissing')}
          </AppText>
          <BigButton
            label={t('offlineModelDownload')}
            tone="sky"
            compact
            onPress={() => {
              void downloadModel().then((result) =>
                setOfflineNote(
                  result === 'downloaded'
                    ? t('offlineModelReady')
                    : result === 'started'
                      ? t('offlineModelStarted')
                      : t('offlineModelFailed'),
                ),
              );
            }}
            testID="offline-download"
          />
          {offlineNote ? (
            <AppText variant="small" color={colors.inkSoft}>
              {offlineNote}
            </AppText>
          ) : null}
        </View>
      ) : recognition.offlineModel === 'installed' ? (
        <AppText variant="small" color={colors.successDark}>
          ✅ {t('offlineModelReady')}
        </AppText>
      ) : null}
      {usable && !recognition.onDevice ? (
        <>
          <AppText variant="heading">{t('allowOnline')}</AppText>
          <View style={styles.choices}>
            <Choice label={t('on')} selected={settings.allowOnlineRecognition} onPress={() => update({ allowOnlineRecognition: true })} />
            <Choice label={t('off')} selected={!settings.allowOnlineRecognition} onPress={() => update({ allowOnlineRecognition: false })} />
          </View>
        </>
      ) : null}
    </Card>
  );
}

function VoiceDiarySection() {
  const { t } = useT();
  const settings = useAtomValue(settingsAtom);
  const entries = useAtomValue(voiceDiaryAtom);
  const services = useAtomValue(servicesAtom);
  const profileId = useAtomValue(activeProfileIdAtom);
  const update = useSetAtom(updateSettingsAtom);
  const deletePostcard = useSetAtom(deletePostcardAtom);
  const player = useRef<AudioPlayer | null>(null);

  useEffect(() => () => player.current?.remove(), []);

  const play = (fileName: string) => {
    const uri = services.voiceStore.uriFor(profileId, fileName);
    if (!uri) return;
    player.current?.remove();
    player.current = createAudioPlayer(uri);
    player.current.play();
  };

  const share = async (fileName: string) => {
    const uri = services.voiceStore.uriFor(profileId, fileName);
    if (uri && (await Sharing.isAvailableAsync())) await Sharing.shareAsync(uri, { mimeType: 'audio/mp4' });
  };

  return (
    <Card style={styles.settings}>
      <AppText variant="small" color={colors.inkSoft}>
        💌 {t('voiceDiaryInfo')}
      </AppText>
      <View style={styles.choices}>
        <Choice label={t('on')} selected={settings.voiceDiary} onPress={() => update({ voiceDiary: true })} testID="voice-diary-on" />
        <Choice label={t('off')} selected={!settings.voiceDiary} onPress={() => update({ voiceDiary: false })} testID="voice-diary-off" />
      </View>
      {settings.voiceDiary && entries.length === 0 ? (
        <AppText variant="small" color={colors.inkSoft}>
          {t('noPostcards')}
        </AppText>
      ) : null}
      {entries.map((entry, i) => (
        <View key={entry.id} style={styles.playerRow}>
          <View style={styles.flex}>
            <AppText variant="small" numberOfLines={1}>
              {i === 0 ? `⭐ ${t('firstPostcard')} · ` : i === entries.length - 1 ? `🆕 ${t('latestPostcard')} · ` : ''}
              {entry.day}
            </AppText>
            <AppText variant="tiny" color={colors.inkSoft} numberOfLines={1}>
              “{entry.prompt}”
            </AppText>
          </View>
          <Choice label="▶️" selected={false} onPress={() => play(entry.fileName)} />
          <Choice label="📤" selected={false} onPress={() => void share(entry.fileName)} />
          <Choice label="🗑️" selected={false} onPress={() => deletePostcard(entry.id)} />
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  offline: { gap: spacing.sm },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  gate: { flex: 1, padding: spacing.xl, gap: spacing.lg, justifyContent: 'center' },
  inputBox: {
    alignSelf: 'center',
    minWidth: 160,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  stat: { width: '31%', alignItems: 'center', paddingVertical: spacing.sm },
  worldList: { gap: spacing.sm },
  worldRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  worldName: { width: 150 },
  worldBar: { flex: 1 },
  settings: { gap: spacing.sm },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  choice: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: colors.border,
    minHeight: 44,
    justifyContent: 'center',
  },
  choiceOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  modalBackdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xl },
  modalCard: { backgroundColor: colors.surface, borderRadius: radii.xl, padding: spacing.xl, gap: spacing.md },
});
