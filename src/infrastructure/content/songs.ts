import type { StorySource } from './define-world';

/**
 * One original sing-along chant per world (4 lines). The guide sings each
 * line and the child echoes it (call and response), which is how young
 * children pick up rhythm, chunks and pronunciation. Each line repeats one of
 * the world's words (last column); that word must appear in the line as a
 * whole word, because the missing-word exercises blank it out.
 */
export const SONGS: Readonly<Record<string, StorySource>> = {
  feelings: {
    title: { en: 'How Do You Feel?', es: '¿Cómo te sientes?', pt: 'Como você se sente?', fr: 'Comment tu te sens ?' },
    lines: [
      ['Happy, happy, clap your hands!', '😀', '¡Feliz, feliz, aplaude!', 'Feliz, feliz, bata palmas!', 'Content, content, tape des mains !', 'happy'],
      ['Sad, sad, give a hug.', '😢', 'Triste, triste, da un abrazo.', 'Triste, triste, dê um abraço.', 'Triste, triste, fais un câlin.', 'sad'],
      ['Angry, angry, breathe in slow.', '😠', 'Enojado, enojado, respira despacio.', 'Bravo, bravo, respire devagar.', 'En colère, en colère, respire doucement.', 'angry'],
      ['Calm, calm, now I feel calm.', '😌', 'Tranquilo, tranquilo, ahora estoy tranquilo.', 'Calmo, calmo, agora estou calmo.', 'Calme, calme, maintenant je suis calme.', 'calm'],
    ],
  },
  colors: {
    title: { en: 'Color Chant', es: 'Canción de colores', pt: 'Canção das cores', fr: 'La chanson des couleurs' },
    lines: [
      ['Purple, purple, I see purple!', '🟣', '¡Morado, morado, veo morado!', 'Roxo, roxo, eu vejo roxo!', 'Violet, violet, je vois du violet !', 'purple'],
      ['Orange, orange, like the sun!', '🟠', '¡Naranja, naranja, como el sol!', 'Laranja, laranja, como o sol!', 'Orange, orange, comme le soleil !', 'orange'],
      ['Pink and white and black and brown.', '🎨', 'Rosa y blanco y negro y café.', 'Rosa e branco e preto e marrom.', 'Rose et blanc et noir et marron.', 'black'],
      ['Every color, one big rainbow!', '🌈', '¡Todos los colores, un gran arcoíris!', 'Todas as cores, um grande arco-íris!', 'Toutes les couleurs, un grand arc-en-ciel !', 'color'],
    ],
  },
  numbers: {
    title: { en: 'Count With Ziggy', es: 'Cuenta con Ziggy', pt: 'Conte com o Ziggy', fr: 'Compte avec Ziggy' },
    lines: [
      ['One, two, three, four, tap the floor!', '4️⃣', '¡Uno, dos, tres, cuatro, toca el piso!', 'Um, dois, três, quatro, bata no chão!', 'Un, deux, trois, quatre, tape le sol !', 'four'],
      ['Five, six, seven, eight, do not be late!', '8️⃣', '¡Cinco, seis, siete, ocho, no llegues tarde!', 'Cinco, seis, sete, oito, não se atrase!', 'Cinq, six, sept, huit, ne sois pas en retard !', 'eight'],
      ['Nine and ten, let us count again!', '🔟', '¡Nueve y diez, contemos otra vez!', 'Nove e dez, vamos contar outra vez!', 'Neuf et dix, on recompte encore !', 'nine'],
      ['Zero, zero, back to zero!', '0️⃣', '¡Cero, cero, otra vez al cero!', 'Zero, zero, de volta ao zero!', 'Zéro, zéro, on revient à zéro !', 'zero'],
    ],
  },
  farm: {
    title: { en: 'Down on the Farm', es: 'En la granja', pt: 'Lá na fazenda', fr: 'À la ferme' },
    lines: [
      ['The sheep says baa, baa, baa!', '🐑', '¡La oveja dice bee, bee, bee!', 'A ovelha faz mé, mé, mé!', 'Le mouton fait bêê, bêê, bêê !', 'sheep'],
      ['The frog says ribbit, ribbit!', '🐸', '¡La rana dice croac, croac!', 'O sapo faz croac, croac!', 'La grenouille fait coâ, coâ !', 'frog'],
      ['The chicken says cluck, cluck, cluck!', '🐔', '¡La gallina dice coc, coc, coc!', 'A galinha faz có, có, có!', 'La poule fait cot, cot, cot !', 'chicken'],
      ['The bee says buzz, buzz, buzz!', '🐝', '¡La abeja dice bzz, bzz, bzz!', 'A abelha faz zum, zum, zum!', "L'abeille fait bzz, bzz, bzz !", 'bee'],
    ],
  },
  fruits: {
    title: { en: 'Yummy Fruit Chant', es: 'Canción de frutas ricas', pt: 'Canção das frutas gostosas', fr: 'La chanson des bons fruits' },
    lines: [
      ['Mango, mango, sweet and yellow!', '🥭', '¡Mango, mango, dulce y amarillo!', 'Manga, manga, doce e amarela!', 'Mangue, mangue, sucrée et jaune !', 'mango'],
      ['Lemon, lemon, sour, sour!', '🍋', '¡Limón, limón, ácido, ácido!', 'Limão, limão, azedo, azedo!', 'Citron, citron, acide, acide !', 'lemon'],
      ['Pineapple, pear and a peach.', '🍍', 'Piña, pera y un durazno.', 'Abacaxi, pera e um pêssego.', 'Ananas, poire et une pêche.', 'pineapple'],
      ['Coconut! Crack! I love fruit!', '🥥', '¡Coco! ¡Crac! ¡Me encanta la fruta!', 'Coco! Crac! Eu amo frutas!', "Noix de coco ! Crac ! J'adore les fruits !", 'coconut'],
    ],
  },
  family: {
    title: { en: 'My Family Song', es: 'La canción de mi familia', pt: 'A música da minha família', fr: 'La chanson de ma famille' },
    lines: [
      ['Grandpa, Grandpa, tell a story.', '👴', 'Abuelo, abuelo, cuenta un cuento.', 'Vovô, vovô, conta uma história.', 'Papi, papi, raconte une histoire.', 'grandpa'],
      ['Sister, sister, let us play.', '👧', 'Hermana, hermana, vamos a jugar.', 'Irmã, irmã, vamos brincar.', 'Ma sœur, ma sœur, viens jouer.', 'sister'],
      ['Baby, baby, time to sleep.', '👶', 'Bebé, bebé, hora de dormir.', 'Bebê, bebê, hora de dormir.', "Bébé, bébé, c'est l'heure de dormir.", 'baby'],
      ['My family, my home, my heart!', '🏠', '¡Mi familia, mi casa, mi corazón!', 'Minha família, minha casa, meu coração!', 'Ma famille, ma maison, mon cœur !', 'family'],
    ],
  },
  body: {
    title: { en: 'Wiggle Your Body', es: 'Mueve tu cuerpo', pt: 'Mexa o corpo', fr: 'Bouge ton corps' },
    lines: [
      ['Touch your face, touch your hair.', '🙂', 'Toca tu cara, toca tu pelo.', 'Toque o rosto, toque o cabelo.', 'Touche ton visage, touche tes cheveux.', 'hair'],
      ['Wiggle one finger in the air.', '☝️', 'Mueve un dedo en el aire.', 'Mexa um dedo no ar.', "Agite un doigt en l'air.", 'finger'],
      ['Shake a leg and stamp your feet.', '🦵', 'Sacude una pierna y zapatea.', 'Balance a perna e bata os pés.', 'Secoue une jambe et tape des pieds.', 'leg'],
      ['Point to your eye, point to your ear!', '👂', '¡Señala tu ojo, señala tu oreja!', 'Aponte o olho, aponte a orelha!', 'Montre ton œil, montre ton oreille !', 'ear'],
    ],
  },
  toys: {
    title: { en: 'Toy Box Song', es: 'La canción de los juguetes', pt: 'A música dos brinquedos', fr: 'La chanson des jouets' },
    lines: [
      ['Up, up, up goes my kite!', '🪁', '¡Arriba, arriba, sube mi cometa!', 'Sobe, sobe, sobe minha pipa!', 'Haut, haut, haut, mon cerf-volant !', 'kite'],
      ['Roll the dice, one, two, three!', '🎲', '¡Tira el dado, uno, dos, tres!', 'Jogue o dado, um, dois, três!', 'Lance les dés, un, deux, trois !', 'dice'],
      ['Beep, beep, dance, my robot!', '🤖', '¡Bip, bip, baila, mi robot!', 'Bip, bip, dança, meu robô!', 'Bip, bip, danse, mon robot !', 'robot'],
      ['Hug my teddy bear, good night.', '🧸', 'Abrazo a mi osito, buenas noches.', 'Abraço meu ursinho, boa noite.', 'Un câlin à mon nounours, bonne nuit.', 'teddy bear'],
    ],
  },
  food: {
    title: { en: 'Lunchtime Chant', es: 'Canción de la comida', pt: 'Canção do almoço', fr: 'La chanson du repas' },
    lines: [
      ['Pizza, pizza, hot and yummy!', '🍕', '¡Pizza, pizza, caliente y rica!', 'Pizza, pizza, quente e gostosa!', 'Pizza, pizza, chaude et délicieuse !', 'pizza'],
      ['Soup, soup, in my tummy!', '🍲', '¡Sopa, sopa, en mi pancita!', 'Sopa, sopa, na minha barriguinha!', 'Soupe, soupe, dans mon ventre !', 'soup'],
      ['Bread and cheese, more milk, please!', '🧀', '¡Pan y queso, más leche, por favor!', 'Pão e queijo, mais leite, por favor!', "Du pain, du fromage, encore du lait, s'il te plaît !", 'cheese'],
      ['Honey, honey, sweet like you!', '🍯', '¡Miel, miel, dulce como tú!', 'Mel, mel, doce como você!', 'Miel, miel, doux comme toi !', 'honey'],
    ],
  },
  clothes: {
    title: { en: 'Getting Dressed', es: 'Me visto', pt: 'Hora de se vestir', fr: "Je m'habille" },
    lines: [
      ['Socks on my feet, one, two!', '🧦', 'Calcetines en mis pies, ¡uno, dos!', 'Meias nos meus pés, um, dois!', 'Des chaussettes à mes pieds, un, deux !', 'socks'],
      ['Boots on, stomp, stomp, stomp!', '🥾', '¡Botas puestas, pum, pum, pum!', 'Botas no pé, pisa, pisa, pisa!', 'Bottes aux pieds, boum, boum, boum !', 'boots'],
      ['A warm coat and a long scarf.', '🧣', 'Un abrigo calientito y una bufanda larga.', 'Um casaco quentinho e um cachecol comprido.', 'Un manteau chaud et une longue écharpe.', 'scarf'],
      ['Gloves on my hands, now let us go!', '🧤', '¡Guantes en las manos, ahora vamos!', 'Luvas nas mãos, agora vamos!', "Des gants aux mains, et c'est parti !", 'gloves'],
    ],
  },
  home: {
    title: { en: 'Around My House', es: 'Por mi casa', pt: 'Pela minha casa', fr: 'Dans ma maison' },
    lines: [
      ['Knock, knock! Open the door!', '🚪', '¡Toc, toc! ¡Abre la puerta!', 'Toc, toc! Abra a porta!', 'Toc, toc ! Ouvre la porte !', 'door'],
      ['Turn on the light, click, click!', '💡', '¡Prende la luz, clic, clic!', 'Acenda a luz, clique, clique!', 'Allume la lumière, clic, clic !', 'light'],
      ['Look in the mirror, I see me!', '🪞', '¡Me miro en el espejo, me veo!', 'Olho no espelho, eu me vejo!', 'Je regarde dans le miroir, je me vois !', 'mirror'],
      ['Sweep, sweep, sweep with the broom!', '🧹', '¡Barre, barre, barre con la escoba!', 'Varre, varre, varre com a vassoura!', 'Balaie, balaie, balaie avec le balai !', 'broom'],
    ],
  },
  school: {
    title: { en: 'Off to School', es: 'A la escuela', pt: 'Para a escola', fr: "En route pour l'école" },
    lines: [
      ['Pack my backpack, off I go!', '🎒', '¡Preparo mi mochila y me voy!', 'Arrumo a mochila e lá vou eu!', 'Je prépare mon sac et je pars !', 'backpack'],
      ['Snip, snip, snip, the scissors go!', '✂️', '¡Tris, tras, cortan las tijeras!', 'Tic, tic, tic, cortam as tesouras!', 'Clic, clac, clic, font les ciseaux !', 'scissors'],
      ['Color with a crayon, red and blue.', '🖍️', 'Pinto con un crayón, rojo y azul.', 'Pinto com um giz de cera, vermelho e azul.', 'Je colorie avec un crayon de cire, rouge et bleu.', 'crayon'],
      ['Good morning, teacher! Good morning, school!', '🏫', '¡Buenos días, maestra! ¡Buenos días, escuela!', 'Bom dia, professora! Bom dia, escola!', "Bonjour, madame ! Bonjour, l'école !", 'teacher'],
    ],
  },
  wild: {
    title: { en: 'Animal Parade', es: 'Desfile de animales', pt: 'Desfile dos animais', fr: 'La parade des animaux' },
    lines: [
      ['Stomp like an elephant, boom, boom!', '🐘', '¡Pisa fuerte como un elefante, bum, bum!', 'Pise forte como um elefante, bum, bum!', 'Marche fort comme un éléphant, boum, boum !', 'elephant'],
      ['Hop like a kangaroo, hop, hop!', '🦘', '¡Salta como un canguro, hop, hop!', 'Pule como um canguru, hop, hop!', 'Saute comme un kangourou, hop, hop !', 'kangaroo'],
      ['Swing like a monkey, ooh, ooh!', '🐒', '¡Cuélgate como un mono, uh, uh!', 'Balance como um macaco, uh, uh!', 'Balance-toi comme un singe, ouh, ouh !', 'monkey'],
      ['Waddle like a penguin, slow, slow.', '🐧', 'Camina como un pingüino, despacio, despacio.', 'Ande como um pinguim, devagar, devagar.', 'Dandine-toi comme un pingouin, doucement, doucement.', 'penguin'],
    ],
  },
  sea: {
    title: { en: 'Splash in the Sea', es: 'Chapoteo en el mar', pt: 'Mergulho no mar', fr: 'Plouf dans la mer' },
    lines: [
      ['Swim, swim, little dolphin!', '🐬', '¡Nada, nada, delfincito!', 'Nade, nade, golfinho!', 'Nage, nage, petit dauphin !', 'dolphin'],
      ['Snap, snap, says the crab!', '🦀', '¡Clac, clac, dice el cangrejo!', 'Clac, clac, diz o caranguejo!', 'Clac, clac, fait le crabe !', 'crab'],
      ['Eight long arms on the octopus.', '🐙', 'Ocho brazos largos tiene el pulpo.', 'O polvo tem oito braços compridos.', 'La pieuvre a huit longs bras.', 'octopus'],
      ['Up and down goes the boat!', '⛵', '¡Sube y baja el barco!', 'Sobe e desce o barco!', 'Le bateau monte et descend !', 'boat'],
    ],
  },
  weather: {
    title: { en: "What's the Weather?", es: '¿Qué tiempo hace?', pt: 'Como está o tempo?', fr: 'Quel temps fait-il ?' },
    lines: [
      ['Rain, rain, drip, drop, drip!', '🌧️', '¡Lluvia, lluvia, plic, ploc, plic!', 'Chuva, chuva, pingo, pingo, pingo!', 'Pluie, pluie, plic, ploc, plic !', 'rain'],
      ['Open my umbrella, pop!', '☂️', '¡Abro mi paraguas, pop!', 'Abro meu guarda-chuva, pop!', "J'ouvre mon parapluie, pop !", 'umbrella'],
      ['Wind, wind, whoosh, whoosh, whoosh!', '🌬️', '¡Viento, viento, fiu, fiu, fiu!', 'Vento, vento, fiu, fiu, fiu!', 'Vent, vent, fiou, fiou, fiou !', 'wind'],
      ['Snow is falling, build a snowman!', '⛄', '¡Cae la nieve, haz un muñeco de nieve!', 'A neve está caindo, faça um boneco de neve!', 'La neige tombe, fais un bonhomme de neige !', 'snowman'],
    ],
  },
  nature: {
    title: { en: 'Little Bug Song', es: 'La canción de los bichitos', pt: 'A música dos bichinhos', fr: 'La chanson des petites bêtes' },
    lines: [
      ['A little ant goes march, march, march.', '🐜', 'Una hormiguita marcha, marcha, marcha.', 'Uma formiguinha marcha, marcha, marcha.', 'Une petite fourmi marche, marche, marche.', 'ant'],
      ['A little snail goes slow, slow, slow.', '🐌', 'Un caracolito va lento, lento, lento.', 'Um caracolzinho vai devagar, devagar.', 'Un petit escargot va lentement, lentement.', 'snail'],
      ['A butterfly flies to a flower.', '🦋', 'Una mariposa vuela a una flor.', 'Uma borboleta voa até uma flor.', 'Un papillon vole vers une fleur.', 'butterfly'],
      ['A spider spins, round and round.', '🕷️', 'Una araña teje, vueltas y vueltas.', 'Uma aranha tece, roda e roda.', 'Une araignée tisse, et tourne, et tourne.', 'spider'],
    ],
  },
  garden: {
    title: { en: 'Grow, Little Garden', es: 'Crece, huertito', pt: 'Cresce, hortinha', fr: 'Pousse, petit potager' },
    lines: [
      ['Dig, dig, plant a carrot!', '🥕', '¡Cava, cava, siembra una zanahoria!', 'Cave, cave, plante uma cenoura!', 'Creuse, creuse, plante une carotte !', 'carrot'],
      ['Water the tomato, grow, grow, grow!', '🍅', '¡Riega el tomate, crece, crece, crece!', 'Regue o tomate, cresce, cresce, cresce!', 'Arrose la tomate, pousse, pousse, pousse !', 'tomato'],
      ['A big orange pumpkin, wow!', '🎃', '¡Una calabaza naranja y grande, guau!', 'Uma abóbora laranja e grande, uau!', 'Une grosse citrouille orange, waouh !', 'pumpkin'],
      ['Hot, hot, hot! A red chili!', '🌶️', '¡Pica, pica, pica! ¡Un chile rojo!', 'Arde, arde, arde! Uma pimenta vermelha!', 'Ça pique, ça pique ! Un piment rouge !', 'chili'],
    ],
  },
  transport: {
    title: { en: "Beep Beep, Let's Go!", es: '¡Bip bip, vámonos!', pt: 'Bi-bi, vamos lá!', fr: "Bip bip, c'est parti !" },
    lines: [
      ['The bus goes beep, beep, beep!', '🚌', '¡El autobús hace bip, bip, bip!', 'O ônibus faz bi, bi, bi!', "L'autobus fait bip, bip, bip !", 'bus'],
      ['The train goes choo, choo, choo!', '🚂', '¡El tren hace chu, chu, chu!', 'O trem faz piuí, piuí, piuí!', 'Le train fait tchou, tchou, tchou !', 'train'],
      ['The fire truck goes nee-naw, nee-naw!', '🚒', '¡El camión de bomberos hace niinoo, niinoo!', 'O caminhão de bombeiros faz uiu, uiu!', 'Le camion de pompiers fait pin-pon, pin-pon !', 'fire truck'],
      ['Three, two, one, the rocket goes up!', '🚀', '¡Tres, dos, uno, el cohete despega!', 'Três, dois, um, o foguete sobe!', 'Trois, deux, un, la fusée décolle !', 'rocket'],
    ],
  },
  actions: {
    title: { en: 'Move and Groove', es: 'Muévete y baila', pt: 'Mexa e dance', fr: 'Bouge et danse' },
    lines: [
      ['Jump, jump, jump up high!', '🤸', '¡Salta, salta, salta alto!', 'Pule, pule, pule bem alto!', 'Saute, saute, saute très haut !', 'jump'],
      ['Dance, dance, spin around!', '💃', '¡Baila, baila, da una vuelta!', 'Dance, dance, dê uma volta!', 'Danse, danse, tourne en rond !', 'dance'],
      ['Climb, climb, up the tree!', '🧗', '¡Trepa, trepa, al árbol!', 'Suba, suba, na árvore!', "Grimpe, grimpe, dans l'arbre !", 'climb'],
      ['Shh! Now we sleep. Good night!', '😴', '¡Shh! Ahora dormimos. ¡Buenas noches!', 'Shh! Agora vamos dormir. Boa noite!', 'Chut ! Maintenant, on dort. Bonne nuit !', 'sleep'],
    ],
  },
  sports: {
    title: { en: 'Team Cheer', es: '¡Vamos, equipo!', pt: 'Vai, time!', fr: "Allez, l'équipe !" },
    lines: [
      ['Kick the ball! Soccer, soccer!', '⚽', '¡Patea la pelota! ¡Fútbol, fútbol!', 'Chute a bola! Futebol, futebol!', 'Tape dans le ballon ! Football, football !', 'soccer'],
      ['Bounce, bounce, basketball!', '🏀', '¡Bota, bota, básquetbol!', 'Quica, quica, basquete!', 'Rebondis, rebondis, basketball !', 'basketball'],
      ['Ping-pong, ping-pong, back and forth!', '🏓', '¡Ping-pong, ping-pong, de aquí para allá!', 'Pingue-pongue, pra lá e pra cá!', "Ping-pong, ping-pong, d'un côté à l'autre !", 'ping-pong'],
      ['We win a shiny trophy!', '🏆', '¡Ganamos un trofeo brillante!', 'Ganhamos um troféu brilhante!', 'On gagne un trophée brillant !', 'trophy'],
    ],
  },
  music: {
    title: { en: 'The Band Song', es: 'La canción de la banda', pt: 'A música da banda', fr: "La chanson de l'orchestre" },
    lines: [
      ['Boom, boom, boom goes the drum!', '🥁', '¡Bum, bum, bum, suena el tambor!', 'Bum, bum, bum, faz o tambor!', 'Boum, boum, boum, fait le tambour !', 'drum'],
      ['Strum, strum, strum the guitar!', '🎸', '¡Rasga, rasga, rasga la guitarra!', 'Toca, toca, toca a guitarra!', 'Gratte, gratte, gratte la guitare !', 'guitar'],
      ['Toot, toot, says the trumpet!', '🎺', '¡Tu, tu, dice la trompeta!', 'Tu, tu, diz o trompete!', 'Tut, tut, fait la trompette !', 'trumpet'],
      ['Ding, dong, ring the bell!', '🔔', '¡Din, don, toca la campana!', 'Dim, dom, toque o sino!', 'Ding, dong, sonne la cloche !', 'bell'],
    ],
  },
  shapes: {
    title: { en: 'Up and Down', es: 'Arriba y abajo', pt: 'Para cima e para baixo', fr: 'En haut, en bas' },
    lines: [
      ['Hands up, hands down!', '🙌', '¡Manos arriba, manos abajo!', 'Mãos para cima, mãos para baixo!', 'Les mains en haut, les mains en bas !', 'up'],
      ['Step left, step right!', '👣', '¡Paso a la izquierda, paso a la derecha!', 'Passo para a esquerda, passo para a direita!', 'Un pas à gauche, un pas à droite !', 'left'],
      ['Fast, fast, now slow, slow.', '🐢', 'Rápido, rápido, ahora lento, lento.', 'Rápido, rápido, agora devagar, devagar.', 'Vite, vite, puis lentement, lentement.', 'fast'],
      ['Draw a circle, draw a heart!', '⭕', '¡Dibuja un círculo, dibuja un corazón!', 'Desenhe um círculo, desenhe um coração!', 'Dessine un cercle, dessine un cœur !', 'circle'],
    ],
  },
  time: {
    title: { en: 'Four Seasons Song', es: 'La canción de las estaciones', pt: 'A música das estações', fr: 'La chanson des saisons' },
    lines: [
      ['Spring, spring, flowers grow!', '🌷', '¡Primavera, primavera, crecen las flores!', 'Primavera, primavera, as flores crescem!', 'Printemps, printemps, les fleurs poussent !', 'spring'],
      ['Summer, summer, sun and play!', '☀️', '¡Verano, verano, sol y juegos!', 'Verão, verão, sol e brincadeira!', 'Été, été, soleil et jeux !', 'summer'],
      ['Autumn leaves fall down, down, down.', '🍂', 'Las hojas de otoño caen, caen, caen.', 'As folhas do outono caem, caem, caem.', "Les feuilles d'automne tombent, tombent, tombent.", 'autumn'],
      ['Winter, winter, cold, cold, cold!', '❄️', '¡Invierno, invierno, frío, frío, frío!', 'Inverno, inverno, frio, frio, frio!', 'Hiver, hiver, froid, froid, froid !', 'winter'],
    ],
  },
  jobs: {
    title: { en: 'When I Grow Up', es: 'Cuando sea grande', pt: 'Quando eu crescer', fr: 'Quand je serai grand' },
    lines: [
      ['I can be a pilot and fly up high!', '✈️', '¡Puedo ser piloto y volar muy alto!', 'Eu posso ser piloto e voar bem alto!', 'Je peux être pilote et voler très haut !', 'pilot'],
      ['I can be a chef and cook a pie!', '🧑‍🍳', '¡Puedo ser chef y cocinar un pastel!', 'Eu posso ser chef e fazer uma torta!', 'Je peux être chef et faire une tarte !', 'chef'],
      ['I can be an astronaut in space!', '🧑‍🚀', '¡Puedo ser astronauta en el espacio!', 'Eu posso ser astronauta no espaço!', "Je peux être astronaute dans l'espace !", 'astronaut'],
      ['I can be a superhero and save the day!', '🦸', '¡Puedo ser superhéroe y salvar el día!', 'Eu posso ser super-herói e salvar o dia!', 'Je peux être un super-héros et sauver le monde !', 'superhero'],
    ],
  },
  places: {
    title: { en: 'Walk Around Town', es: 'Paseo por la ciudad', pt: 'Passeio pela cidade', fr: 'Balade en ville' },
    lines: [
      ["Let's go to the zoo today!", '🦁', '¡Vamos al zoológico hoy!', 'Vamos ao zoológico hoje!', "Allons au zoo aujourd'hui !", 'zoo'],
      ['Read a book at the library.', '📚', 'Lee un libro en la biblioteca.', 'Leia um livro na biblioteca.', 'Lis un livre à la bibliothèque.', 'library'],
      ['Cross the bridge, step, step, step!', '🌉', '¡Cruza el puente, paso, paso, paso!', 'Atravesse a ponte, passo, passo, passo!', 'Traverse le pont, pas à pas, pas à pas !', 'bridge'],
      ['Hello, hello, my big city!', '🏙️', '¡Hola, hola, mi gran ciudad!', 'Olá, olá, minha cidade grande!', 'Bonjour, bonjour, ma grande ville !', 'city'],
    ],
  },
  fantasy: {
    title: { en: 'Magic Land Chant', es: 'Canción de la tierra mágica', pt: 'Canção da terra mágica', fr: 'La chanson du pays magique' },
    lines: [
      ['Roar, roar, says the dragon!', '🐉', '¡Grrr, grrr, dice el dragón!', 'Rrrr, rrrr, diz o dragão!', 'Grrr, grrr, fait le dragon !', 'dragon'],
      ['Boo, boo, says the ghost!', '👻', '¡Buu, buu, dice el fantasma!', 'Buu, buu, diz o fantasma!', 'Bouh, bouh, fait le fantôme !', 'ghost'],
      ['Wave your wand, little fairy!', '🧚', '¡Mueve tu varita, pequeña hada!', 'Balance a varinha, fadinha!', 'Agite ta baguette, petite fée !', 'fairy'],
      ['Follow the map and find the treasure!', '💰', '¡Sigue el mapa y encuentra el tesoro!', 'Siga o mapa e encontre o tesouro!', 'Suis la carte et trouve le trésor !', 'treasure'],
    ],
  },
  countries: {
    title: { en: 'Hello, World!', es: '¡Hola, mundo!', pt: 'Olá, mundo!', fr: 'Bonjour, le monde !' },
    lines: [
      ['Hola from Mexico and Spain!', '🇲🇽', '¡Hola desde México y España!', 'Hola do México e da Espanha!', "Hola du Mexique et d'Espagne !", 'Mexico'],
      ['Olá from Brazil, samba time!', '🇧🇷', '¡Olá desde Brasil, hora de samba!', 'Olá do Brasil, hora do samba!', "Olá du Brésil, c'est l'heure de la samba !", 'Brazil'],
      ['Bonjour from France and Canada!', '🇫🇷', '¡Bonjour desde Francia y Canadá!', 'Bonjour da França e do Canadá!', 'Bonjour de France et du Canada !', 'France'],
      ['Konnichiwa from Japan!', '🇯🇵', '¡Konnichiwa desde Japón!', 'Konnichiwa do Japão!', 'Konnichiwa du Japon !', 'Japan'],
    ],
  },
  birds: {
    title: { en: 'Early Bird Song', es: 'La canción de los pájaros', pt: 'A música dos passarinhos', fr: 'La chanson des oiseaux du matin' },
    lines: [
      ['Cock-a-doodle-doo! The rooster wakes me up.', '🐓', '¡Quiquiriquí! El gallo me despierta.', 'Cocoricó! O galo me acorda.', 'Cocorico ! Le coq me réveille.', 'rooster'],
      ['The flamingo stands on one leg.', '🦩', 'El flamenco se para en una pata.', 'O flamingo fica numa perna só.', 'Le flamant rose tient sur une patte.', 'flamingo'],
      ['Chirp, chirp, sings the cricket.', '🦗', 'Cri, cri, canta el grillo.', 'Cri, cri, canta o grilo.', 'Cri, cri, chante le grillon.', 'cricket'],
      ['The eagle flies over the hill.', '🦅', 'El águila vuela sobre la colina.', 'A águia voa sobre o morro.', "L'aigle vole au-dessus de la colline.", 'eagle'],
    ],
  },
  sweets: {
    title: { en: 'Sweet Treats', es: 'Dulces delicias', pt: 'Doces delícias', fr: 'Les douceurs' },
    lines: [
      ['Pop, pop, pop goes the popcorn!', '🍿', '¡Pop, pop, pop, hacen las palomitas!', 'Pop, pop, pop, faz a pipoca!', 'Pop, pop, pop, fait le pop-corn !', 'popcorn'],
      ['Flip, flip, flip the pancake!', '🥞', '¡Voltea, voltea, voltea el panqueque!', 'Vira, vira, vira a panqueca!', 'Hop, hop, hop, on retourne la crêpe !', 'pancake'],
      ['Lick, lick, my lollipop!', '🍭', '¡Lame, lame, mi paleta!', 'Lambe, lambe, meu pirulito!', 'Lèche, lèche, ma sucette !', 'lollipop'],
      ['Just one cupcake, then brush your teeth!', '🧁', 'Solo un pastelito, ¡y luego a cepillarte los dientes!', 'Só um cupcake, depois escove os dentes!', 'Juste un petit gâteau, puis brosse-toi les dents !', 'cupcake'],
    ],
  },
  kitchen: {
    title: { en: 'Set the Table', es: 'Pon la mesa', pt: 'Ponha a mesa', fr: 'Mets la table' },
    lines: [
      ['A plate for you, a plate for me.', '🍽️', 'Un plato para ti, un plato para mí.', 'Um prato para você, um prato para mim.', 'Une assiette pour toi, une assiette pour moi.', 'plate'],
      ['A fork, a spoon and a cup of tea.', '🥄', 'Un tenedor, una cuchara y una taza de té.', 'Um garfo, uma colher e uma xícara de chá.', 'Une fourchette, une cuillère et une tasse de thé.', 'spoon'],
      ['Chopsticks, click, click, rice in the bowl.', '🥢', 'Palitos, clic, clic, arroz en el tazón.', 'Hashis, clique, clique, arroz na tigela.', 'Baguettes, clic, clic, du riz dans le bol.', 'chopsticks'],
      ['The teapot sings: whistle, whee!', '🫖', 'La tetera canta: ¡fiuuu!', 'A chaleira canta: fiuuu!', 'La théière chante : fiou, fiou !', 'teapot'],
    ],
  },
  health: {
    title: { en: 'Healthy Habits', es: 'Hábitos sanos', pt: 'Hábitos saudáveis', fr: 'Les bonnes habitudes' },
    lines: [
      ['Scrub, scrub, soap and water!', '🧼', '¡Talla, talla, agua y jabón!', 'Esfrega, esfrega, água e sabão!', "Frotte, frotte, de l'eau et du savon !", 'soap'],
      ['Brush, brush, with my toothbrush!', '🪥', '¡Cepilla, cepilla, con mi cepillo de dientes!', 'Escova, escova, com a minha escova de dentes!', 'Brosse, brosse, avec ma brosse à dents !', 'toothbrush'],
      ['Achoo! Sneeze into your arm.', '🤧', '¡Achú! Estornuda en tu brazo.', 'Atchim! Espirre no braço.', 'Atchoum ! Éternue dans ton coude.', 'sneeze'],
      ['Exercise makes me strong!', '💪', '¡El ejercicio me hace fuerte!', 'O exercício me deixa forte!', "L'exercice me rend fort !", 'exercise'],
    ],
  },
  tools: {
    title: { en: 'Builder Beat', es: 'Ritmo de constructor', pt: 'Ritmo de construtor', fr: 'Le rythme du bâtisseur' },
    lines: [
      ['Bang, bang, bang with the hammer!', '🔨', '¡Pum, pum, pum con el martillo!', 'Bate, bate, bate com o martelo!', 'Boum, boum, boum avec le marteau !', 'hammer'],
      ['Back and forth goes the saw!', '🪚', '¡Para atrás y para adelante va el serrucho!', 'Pra lá e pra cá vai o serrote!', 'La scie va et vient !', 'saw'],
      ['Brick on brick, we build a wall!', '🧱', '¡Ladrillo sobre ladrillo, hacemos un muro!', 'Tijolo sobre tijolo, fazemos um muro!', 'Brique sur brique, on construit un mur !', 'brick'],
      ['Climb the ladder, step by step.', '🪜', 'Sube la escalera, paso a paso.', 'Suba a escada, degrau por degrau.', "Monte à l'échelle, marche après marche.", 'ladder'],
    ],
  },
  celebrations: {
    title: { en: 'Party Song', es: 'Canción de fiesta', pt: 'Música de festa', fr: 'La chanson de la fête' },
    lines: [
      ['Hit the piñata, one, two, three!', '🪅', '¡Pégale a la piñata, uno, dos, tres!', 'Bata na piñata, um, dois, três!', 'Tape la piñata, un, deux, trois !', 'piñata'],
      ['Blow out the candle and make a wish!', '🕯️', '¡Sopla la vela y pide un deseo!', 'Assopre a vela e faça um pedido!', 'Souffle la bougie et fais un vœu !', 'candle'],
      ['Fireworks! Boom! Up in the sky!', '🎆', '¡Fuegos artificiales! ¡Bum! ¡Allá en el cielo!', 'Fogos de artifício! Bum! Lá no céu!', "Feux d'artifice ! Boum ! Là-haut dans le ciel !", 'fireworks'],
      ['Throw confetti, hip, hip, hooray!', '🎊', '¡Lanza confeti, hip, hip, hurra!', 'Jogue confete, hip, hip, hurra!', 'Lance des confettis, hip, hip, hourra !', 'confetti'],
    ],
  },
  tech: {
    title: { en: 'Gadget Groove', es: 'Ritmo de aparatos', pt: 'Ritmo dos aparelhos', fr: 'Le rythme des gadgets' },
    lines: [
      ['Tap, tap, tap on the keyboard!', '⌨️', '¡Tap, tap, tap en el teclado!', 'Tec, tec, tec no teclado!', 'Tap, tap, tap sur le clavier !', 'keyboard'],
      ['Look at the stars with a telescope!', '🔭', '¡Mira las estrellas con un telescopio!', 'Olhe as estrelas com um telescópio!', 'Regarde les étoiles avec un télescope !', 'telescope'],
      ['Click! The flashlight shines in the dark.', '🔦', '¡Clic! La linterna brilla en la oscuridad.', 'Clique! A lanterna brilha no escuro.', 'Clic ! La lampe de poche brille dans le noir.', 'flashlight'],
      ['Tick, tock, look at my watch!', '⌚', '¡Tic, tac, mira mi reloj!', 'Tic, tac, olhe o meu relógio!', 'Tic, tac, regarde ma montre !', 'watch'],
    ],
  },
  manners: {
    title: { en: 'Magic Words Song', es: 'La canción de las palabras mágicas', pt: 'A música das palavras mágicas', fr: 'La chanson des mots magiques' },
    lines: [
      ['Please, please, say please!', '🥺', '¡Por favor, por favor, di por favor!', 'Por favor, por favor, diga por favor!', "S'il te plaît, s'il te plaît, dis s'il te plaît\u00a0!", 'please'],
      ['Thank you, thank you, thank you!', '🙏', '¡Gracias, gracias, gracias!', 'Obrigado, obrigado, obrigado!', 'Merci, merci, merci\u00a0!', 'thank you'],
      ['Sorry, sorry, I am sorry.', '😔', 'Perdón, perdón, lo siento.', 'Desculpa, desculpa, me desculpe.', 'Pardon, pardon, je suis désolé.', 'sorry'],
      ['Goodbye, goodbye, see you soon!', '👋', '¡Adiós, adiós, hasta pronto!', 'Tchau, tchau, até logo!', 'Au revoir, au revoir, à bientôt\u00a0!', 'goodbye'],
    ],
  },
  routine: {
    title: { en: 'Up and Ready', es: '¡Arriba y listos!', pt: 'De pé e prontos!', fr: 'Debout, on est prêts\u00a0!' },
    lines: [
      ['Wake up, wake up, the sun is up!', '🥱', '¡Despierta, despierta, ya salió el sol!', 'Acorda, acorda, o sol já nasceu!', 'Réveille-toi, réveille-toi, le soleil est levé\u00a0!', 'wake up'],
      ['Brush my teeth, brush my teeth, clean and white!', '🪥', '¡Me cepillo los dientes, limpios y blancos!', 'Escovo os dentes, limpinhos e brancos!', 'Je me brosse les dents, propres et blanches\u00a0!', 'brush my teeth'],
      ['Wash my hands, wash my hands, scrub, scrub, scrub!', '🧼', '¡Me lavo las manos, tallo, tallo, tallo!', 'Lavo as mãos, esfrego, esfrego, esfrego!', 'Je me lave les mains, frotte, frotte, frotte\u00a0!', 'wash my hands'],
      ['Go to bed, go to bed, sleep tight!', '🛌', '¡A la cama, a la cama, que duermas bien!', 'Pra cama, pra cama, durma bem!', 'Au lit, au lit, fais de beaux rêves\u00a0!', 'go to bed'],
    ],
  },
  shopping: {
    title: { en: 'The Shopping Song', es: 'La canción de las compras', pt: 'A música das compras', fr: 'La chanson des courses' },
    lines: [
      ['Push the cart, push the cart, round and round!', '🛒', '¡Empuja el carrito, da vueltas y vueltas!', 'Empurra o carrinho, roda, roda!', 'Pousse le chariot, et on tourne, on tourne\u00a0!', 'cart'],
      ['Coin, coin, in my hand!', '🪙', '¡Moneda, moneda, en mi mano!', 'Moeda, moeda, na minha mão!', 'Pièce, pièce, dans ma main\u00a0!', 'coin'],
      ['Money, money, in my wallet!', '👛', '¡Dinero, dinero, en mi cartera!', 'Dinheiro, dinheiro, na carteira!', "De l'argent, de l'argent, dans mon portefeuille\u00a0!", 'wallet'],
      ['Shopping bag, shopping bag, full of fun!', '🛍️', '¡Bolsa de compras, llena de diversión!', 'Sacola de compras, cheia de diversão!', 'Sac de courses, plein de surprises\u00a0!', 'shopping bag'],
    ],
  },
  emotions: {
    title: { en: 'The Feelings Song', es: 'La canción de los sentimientos', pt: 'A música dos sentimentos', fr: 'La chanson des émotions' },
    lines: [
      ['Excited, excited, jump up and down!', '🤩', '¡Emocionado, emocionado, salta y salta!', 'Animado, animado, pula sem parar!', 'Enthousiaste, enthousiaste, saute et saute\u00a0!', 'excited'],
      ['Nervous, nervous, take a deep breath.', '😬', 'Nervioso, nervioso, respira hondo.', 'Nervoso, nervoso, respire fundo.', 'Nerveux, nerveux, respire profondément.', 'nervous'],
      ['Silly, silly, make a funny face!', '🤪', '¡Travieso, travieso, haz una cara chistosa!', 'Bobinho, bobinho, faça uma careta!', 'Rigolo, rigolo, fais une grimace\u00a0!', 'silly'],
      ['Kind, kind, kind to everyone!', '🥰', '¡Amable, amable, amable con todos!', 'Gentil, gentil, gentil com todos!', 'Gentil, gentil, gentil avec tout le monde\u00a0!', 'kind'],
    ],
  },
};
