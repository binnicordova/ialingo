import { buildLessonPlans } from '@/domain/curriculum/lesson-plans';
import { CONTENT_CATALOG } from '@/infrastructure/content/catalog';

import playListings from '../../../store/google-play/listings.json';
import appleConfig from '../../../store/store.config.json';

/**
 * Store listings are product copy, so they get tests: every field fits the
 * store's limits, and every number we promise parents matches the content.
 */
const apple = appleConfig as unknown as {
  apple: {
    advisory: Record<string, unknown>;
    categories: unknown[];
    info: Record<
      string,
      {
        title: string;
        subtitle: string;
        description: string;
        keywords: string[];
        releaseNotes: string;
        promoText: string;
        privacyPolicyUrl: string;
      }
    >;
  };
};
const play = playListings as unknown as {
  listings: Record<string, { title: string; shortDescription: string; fullDescription: string; releaseNotes: string }>;
};

const { worlds, species } = CONTENT_CATALOG;
const counts = {
  worlds: worlds.length,
  words: worlds.flatMap((w) => w.words).length,
  sentences: worlds.flatMap((w) => w.sentences).length,
  stories: worlds.filter((w) => w.story).length,
  songs: worlds.filter((w) => w.song).length,
  pets: species.length,
};

describe('App Store metadata (EAS Metadata format)', () => {
  it.each(Object.entries(apple.apple.info))('%s fits the App Store limits', (_locale, info) => {
    expect(info.title.length).toBeGreaterThanOrEqual(2);
    expect(info.title.length).toBeLessThanOrEqual(30);
    expect(info.subtitle.length).toBeLessThanOrEqual(30);
    expect(info.promoText.length).toBeLessThanOrEqual(170);
    expect(info.description.length).toBeLessThanOrEqual(4000);
    expect(info.releaseNotes.length).toBeLessThanOrEqual(4000);
    expect(info.keywords.join(',').length).toBeLessThanOrEqual(100);
    expect(new Set(info.keywords).size).toBe(info.keywords.length);
    expect(info.privacyPolicyUrl).toMatch(/^https:\/\//);
  });

  it('declares a Kids Category age band and no risky content', () => {
    const advisory = apple.apple.advisory;
    expect(advisory.kidsAgeBand).toBe('SIX_TO_EIGHT');
    for (const key of ['gambling', 'lootBox', 'advertising', 'unrestrictedWebAccess', 'userGeneratedContent', 'messagingAndChat']) {
      expect(advisory[key]).toBe(false);
    }
    expect(Object.values(advisory).filter((v) => typeof v === 'string' && v !== 'NONE' && v !== 'SIX_TO_EIGHT')).toEqual([]);
    expect(apple.apple.categories[0]).toBe('EDUCATION');
  });
});

describe('Google Play listings', () => {
  it.each(Object.entries(play.listings))('%s fits the Play limits', (_locale, listing) => {
    expect(listing.title.length).toBeLessThanOrEqual(30);
    expect(listing.shortDescription.length).toBeLessThanOrEqual(80);
    expect(listing.fullDescription.length).toBeLessThanOrEqual(4000);
    expect(listing.releaseNotes.length).toBeLessThanOrEqual(500);
  });
});

describe('store copy matches the real content', () => {
  const descriptions = [
    ...Object.entries(apple.apple.info).map(([locale, i]) => [`apple ${locale}`, i.description] as const),
    ...Object.entries(play.listings).map(([locale, l]) => [`play ${locale}`, l.fullDescription] as const),
  ];

  it.each(descriptions)('%s promises only what ships', (_name, text) => {
    // Every count we mention (worlds, words, sentences, stories, songs, pets) is the real one.
    const missing = Object.entries(counts)
      .filter(([, value]) => !text.includes(String(value)))
      .map(([name, value]) => `${name}=${value}`);
    expect(missing).toEqual([]);
  });

  it('describes a curriculum at least as big as the listing implies', () => {
    expect(worlds.flatMap((w) => buildLessonPlans(w)).length).toBeGreaterThanOrEqual(300);
  });
});
