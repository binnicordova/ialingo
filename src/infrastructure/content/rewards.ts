import type { Achievement } from '@/domain/achievements/achievement';
import type { Accessory } from '@/domain/pets/accessory';

/** Cosmetic accessories, from 20 to 80 berries (about 2–7 lessons). */
export const ACCESSORIES: readonly Accessory[] = [
  { id: 'bow', name: { en: 'Bow', es: 'Moño', pt: 'Laço' }, emoji: '🎀', price: 20, model: 'bow', color: '#EC407A' },
  { id: 'flower', name: { en: 'Flower', es: 'Flor', pt: 'Flor' }, emoji: '🌼', price: 20, model: 'flower', color: '#FFEB3B' },
  { id: 'party-hat', name: { en: 'Party hat', es: 'Gorro de fiesta', pt: 'Chapéu de festa' }, emoji: '🥳', price: 25, model: 'party-hat', color: '#7C4DFF' },
  { id: 'cap', name: { en: 'Cap', es: 'Gorra', pt: 'Boné' }, emoji: '🧢', price: 30, model: 'cap', color: '#1E88E5' },
  { id: 'scarf', name: { en: 'Scarf', es: 'Bufanda', pt: 'Cachecol' }, emoji: '🧣', price: 30, model: 'scarf', color: '#E53935' },
  { id: 'glasses', name: { en: 'Cool glasses', es: 'Lentes geniales', pt: 'Óculos legais' }, emoji: '🕶️', price: 35, model: 'glasses', color: '#212121' },
  { id: 'headphones', name: { en: 'Headphones', es: 'Audífonos', pt: 'Fones de ouvido' }, emoji: '🎧', price: 50, model: 'headphones', color: '#00BFA5' },
  { id: 'crown', name: { en: 'Crown', es: 'Corona', pt: 'Coroa' }, emoji: '👑', price: 80, model: 'crown', color: '#FFC107' },
];

/** Badges. Pet eggs are earned by learning milestones, never bought with money. */
export const ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: 'first-steps',
    emoji: '👣',
    title: { en: 'First Steps', es: 'Primeros pasos', pt: 'Primeiros passos' },
    description: { en: 'Finish your first lesson', es: 'Termina tu primera lección', pt: 'Termine sua primeira lição' },
    condition: { type: 'lessons-completed', count: 1 },
    reward: { berries: 20 },
  },
  {
    id: 'word-explorer',
    emoji: '🔎',
    title: { en: 'Word Explorer', es: 'Explorador de palabras', pt: 'Explorador de palavras' },
    description: { en: 'Learn 25 words', es: 'Aprende 25 palabras', pt: 'Aprenda 25 palavras' },
    condition: { type: 'words-learned', count: 25 },
    reward: { speciesId: 'mochi' },
  },
  {
    id: 'perfect-five',
    emoji: '💯',
    title: { en: 'Perfect Five', es: 'Cinco perfectas', pt: 'Cinco perfeitas' },
    description: { en: 'Get 5 perfect lessons', es: 'Logra 5 lecciones perfectas', pt: 'Faça 5 lições perfeitas' },
    condition: { type: 'perfect-lessons', count: 5 },
    reward: { speciesId: 'glowbug' },
  },
  {
    id: 'five-days',
    emoji: '📆',
    title: { en: 'Five Fun Days', es: 'Cinco días de diversión', pt: 'Cinco dias de diversão' },
    description: { en: 'Play on 5 different days', es: 'Juega en 5 días distintos', pt: 'Jogue em 5 dias diferentes' },
    condition: { type: 'days-played', count: 5 },
    reward: { speciesId: 'pebble' },
  },
  {
    id: 'pet-chef',
    emoji: '🍓',
    title: { en: 'Pet Chef', es: 'Chef de mascotas', pt: 'Chef de bichinhos' },
    description: { en: 'Feed your pets 10 times', es: 'Alimenta a tus mascotas 10 veces', pt: 'Alimente seus bichinhos 10 vezes' },
    condition: { type: 'pets-fed', count: 10 },
    reward: { speciesId: 'coral' },
  },
  {
    id: 'world-hero',
    emoji: '🦸',
    title: { en: 'World Hero', es: 'Héroe de mundos', pt: 'Herói dos mundos' },
    description: { en: 'Beat 5 world bosses', es: 'Vence 5 jefes de mundo', pt: 'Vença 5 chefes de mundo' },
    condition: { type: 'worlds-completed', count: 5 },
    reward: { speciesId: 'ember' },
  },
  {
    id: 'fifteen-days',
    emoji: '🌟',
    title: { en: 'Super Habit', es: 'Súper hábito', pt: 'Super hábito' },
    description: { en: 'Play on 15 different days', es: 'Juega en 15 días distintos', pt: 'Jogue em 15 dias diferentes' },
    condition: { type: 'days-played', count: 15 },
    reward: { speciesId: 'nimbus' },
  },
  {
    id: 'word-wizard',
    emoji: '🧙',
    title: { en: 'Word Wizard', es: 'Mago de palabras', pt: 'Mago das palavras' },
    description: { en: 'Learn 100 words', es: 'Aprende 100 palabras', pt: 'Aprenda 100 palavras' },
    condition: { type: 'words-learned', count: 100 },
    reward: { speciesId: 'sparkle' },
  },
  {
    id: 'super-learner',
    emoji: '🚀',
    title: { en: 'Super Learner', es: 'Súper estudiante', pt: 'Super estudante' },
    description: { en: 'Finish 50 lessons', es: 'Termina 50 lecciones', pt: 'Termine 50 lições' },
    condition: { type: 'lessons-completed', count: 50 },
    reward: { berries: 100 },
  },
  {
    id: 'all-worlds',
    emoji: '🏆',
    title: { en: 'Legend of iaLingo', es: 'Leyenda de iaLingo', pt: 'Lenda do iaLingo' },
    description: { en: 'Beat every world boss', es: 'Vence a todos los jefes', pt: 'Vença todos os chefes' },
    condition: { type: 'worlds-completed', count: 26 },
    reward: { berries: 500 },
  },
];
