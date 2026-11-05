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
    title: { en: 'How Do You Feel?', es: '¿Cómo te sientes?', pt: 'Como você se sente?' },
    lines: [
      ['Happy, happy, clap your hands!', '😀', '¡Feliz, feliz, aplaude!', 'Feliz, feliz, bata palmas!', 'happy'],
      ['Sad, sad, give a hug.', '😢', 'Triste, triste, da un abrazo.', 'Triste, triste, dê um abraço.', 'sad'],
      ['Angry, angry, breathe in slow.', '😠', 'Enojado, enojado, respira despacio.', 'Bravo, bravo, respire devagar.', 'angry'],
      ['Calm, calm, now I feel calm.', '😌', 'Tranquilo, tranquilo, ahora estoy tranquilo.', 'Calmo, calmo, agora estou calmo.', 'calm'],
    ],
  },
  colors: {
    title: { en: 'Color Chant', es: 'Canción de colores', pt: 'Canção das cores' },
    lines: [
      ['Purple, purple, I see purple!', '🟣', '¡Morado, morado, veo morado!', 'Roxo, roxo, eu vejo roxo!', 'purple'],
      ['Orange, orange, like the sun!', '🟠', '¡Naranja, naranja, como el sol!', 'Laranja, laranja, como o sol!', 'orange'],
      ['Pink and white and black and brown.', '🎨', 'Rosa y blanco y negro y café.', 'Rosa e branco e preto e marrom.', 'black'],
      ['Every color, one big rainbow!', '🌈', '¡Todos los colores, un gran arcoíris!', 'Todas as cores, um grande arco-íris!', 'color'],
    ],
  },
  numbers: {
    title: { en: 'Count With Ziggy', es: 'Cuenta con Ziggy', pt: 'Conte com o Ziggy' },
    lines: [
      ['One, two, three, four, tap the floor!', '4️⃣', '¡Uno, dos, tres, cuatro, toca el piso!', 'Um, dois, três, quatro, bata no chão!', 'four'],
      ['Five, six, seven, eight, do not be late!', '8️⃣', '¡Cinco, seis, siete, ocho, no llegues tarde!', 'Cinco, seis, sete, oito, não se atrase!', 'eight'],
      ['Nine and ten, let us count again!', '🔟', '¡Nueve y diez, contemos otra vez!', 'Nove e dez, vamos contar outra vez!', 'nine'],
      ['Zero, zero, back to zero!', '0️⃣', '¡Cero, cero, otra vez al cero!', 'Zero, zero, de volta ao zero!', 'zero'],
    ],
  },
  farm: {
    title: { en: 'Down on the Farm', es: 'En la granja', pt: 'Lá na fazenda' },
    lines: [
      ['The sheep says baa, baa, baa!', '🐑', '¡La oveja dice bee, bee, bee!', 'A ovelha faz mé, mé, mé!', 'sheep'],
      ['The frog says ribbit, ribbit!', '🐸', '¡La rana dice croac, croac!', 'O sapo faz croac, croac!', 'frog'],
      ['The chicken says cluck, cluck, cluck!', '🐔', '¡La gallina dice coc, coc, coc!', 'A galinha faz có, có, có!', 'chicken'],
      ['The bee says buzz, buzz, buzz!', '🐝', '¡La abeja dice bzz, bzz, bzz!', 'A abelha faz zum, zum, zum!', 'bee'],
    ],
  },
  fruits: {
    title: { en: 'Yummy Fruit Chant', es: 'Canción de frutas ricas', pt: 'Canção das frutas gostosas' },
    lines: [
      ['Mango, mango, sweet and yellow!', '🥭', '¡Mango, mango, dulce y amarillo!', 'Manga, manga, doce e amarela!', 'mango'],
      ['Lemon, lemon, sour, sour!', '🍋', '¡Limón, limón, ácido, ácido!', 'Limão, limão, azedo, azedo!', 'lemon'],
      ['Pineapple, pear and a peach.', '🍍', 'Piña, pera y un durazno.', 'Abacaxi, pera e um pêssego.', 'pineapple'],
      ['Coconut! Crack! I love fruit!', '🥥', '¡Coco! ¡Crac! ¡Me encanta la fruta!', 'Coco! Crac! Eu amo frutas!', 'coconut'],
    ],
  },
  family: {
    title: { en: 'My Family Song', es: 'La canción de mi familia', pt: 'A música da minha família' },
    lines: [
      ['Grandpa, Grandpa, tell a story.', '👴', 'Abuelo, abuelo, cuenta un cuento.', 'Vovô, vovô, conta uma história.', 'grandpa'],
      ['Sister, sister, let us play.', '👧', 'Hermana, hermana, vamos a jugar.', 'Irmã, irmã, vamos brincar.', 'sister'],
      ['Baby, baby, time to sleep.', '👶', 'Bebé, bebé, hora de dormir.', 'Bebê, bebê, hora de dormir.', 'baby'],
      ['My family, my home, my heart!', '🏠', '¡Mi familia, mi casa, mi corazón!', 'Minha família, minha casa, meu coração!', 'family'],
    ],
  },
  body: {
    title: { en: 'Wiggle Your Body', es: 'Mueve tu cuerpo', pt: 'Mexa o corpo' },
    lines: [
      ['Touch your face, touch your hair.', '🙂', 'Toca tu cara, toca tu pelo.', 'Toque o rosto, toque o cabelo.', 'hair'],
      ['Wiggle one finger in the air.', '☝️', 'Mueve un dedo en el aire.', 'Mexa um dedo no ar.', 'finger'],
      ['Shake a leg and stamp your feet.', '🦵', 'Sacude una pierna y zapatea.', 'Balance a perna e bata os pés.', 'leg'],
      ['Point to your eye, point to your ear!', '👂', '¡Señala tu ojo, señala tu oreja!', 'Aponte o olho, aponte a orelha!', 'ear'],
    ],
  },
  toys: {
    title: { en: 'Toy Box Song', es: 'La canción de los juguetes', pt: 'A música dos brinquedos' },
    lines: [
      ['Up, up, up goes my kite!', '🪁', '¡Arriba, arriba, sube mi cometa!', 'Sobe, sobe, sobe minha pipa!', 'kite'],
      ['Roll the dice, one, two, three!', '🎲', '¡Tira el dado, uno, dos, tres!', 'Jogue o dado, um, dois, três!', 'dice'],
      ['Beep, beep, dance, my robot!', '🤖', '¡Bip, bip, baila, mi robot!', 'Bip, bip, dança, meu robô!', 'robot'],
      ['Hug my teddy bear, good night.', '🧸', 'Abrazo a mi osito, buenas noches.', 'Abraço meu ursinho, boa noite.', 'teddy bear'],
    ],
  },
  food: {
    title: { en: 'Lunchtime Chant', es: 'Canción de la comida', pt: 'Canção do almoço' },
    lines: [
      ['Pizza, pizza, hot and yummy!', '🍕', '¡Pizza, pizza, caliente y rica!', 'Pizza, pizza, quente e gostosa!', 'pizza'],
      ['Soup, soup, in my tummy!', '🍲', '¡Sopa, sopa, en mi pancita!', 'Sopa, sopa, na minha barriguinha!', 'soup'],
      ['Bread and cheese, more milk, please!', '🧀', '¡Pan y queso, más leche, por favor!', 'Pão e queijo, mais leite, por favor!', 'cheese'],
      ['Honey, honey, sweet like you!', '🍯', '¡Miel, miel, dulce como tú!', 'Mel, mel, doce como você!', 'honey'],
    ],
  },
  clothes: {
    title: { en: 'Getting Dressed', es: 'Me visto', pt: 'Hora de se vestir' },
    lines: [
      ['Socks on my feet, one, two!', '🧦', 'Calcetines en mis pies, ¡uno, dos!', 'Meias nos meus pés, um, dois!', 'socks'],
      ['Boots on, stomp, stomp, stomp!', '🥾', '¡Botas puestas, pum, pum, pum!', 'Botas no pé, pisa, pisa, pisa!', 'boots'],
      ['A warm coat and a long scarf.', '🧣', 'Un abrigo calientito y una bufanda larga.', 'Um casaco quentinho e um cachecol comprido.', 'scarf'],
      ['Gloves on my hands, now let us go!', '🧤', '¡Guantes en las manos, ahora vamos!', 'Luvas nas mãos, agora vamos!', 'gloves'],
    ],
  },
  home: {
    title: { en: 'Around My House', es: 'Por mi casa', pt: 'Pela minha casa' },
    lines: [
      ['Knock, knock! Open the door!', '🚪', '¡Toc, toc! ¡Abre la puerta!', 'Toc, toc! Abra a porta!', 'door'],
      ['Turn on the light, click, click!', '💡', '¡Prende la luz, clic, clic!', 'Acenda a luz, clique, clique!', 'light'],
      ['Look in the mirror, I see me!', '🪞', '¡Me miro en el espejo, me veo!', 'Olho no espelho, eu me vejo!', 'mirror'],
      ['Sweep, sweep, sweep with the broom!', '🧹', '¡Barre, barre, barre con la escoba!', 'Varre, varre, varre com a vassoura!', 'broom'],
    ],
  },
  school: {
    title: { en: 'Off to School', es: 'A la escuela', pt: 'Para a escola' },
    lines: [
      ['Pack my backpack, off I go!', '🎒', '¡Preparo mi mochila y me voy!', 'Arrumo a mochila e lá vou eu!', 'backpack'],
      ['Snip, snip, snip, the scissors go!', '✂️', '¡Tris, tras, cortan las tijeras!', 'Tic, tic, tic, cortam as tesouras!', 'scissors'],
      ['Color with a crayon, red and blue.', '🖍️', 'Pinto con un crayón, rojo y azul.', 'Pinto com um giz de cera, vermelho e azul.', 'crayon'],
      ['Good morning, teacher! Good morning, school!', '🏫', '¡Buenos días, maestra! ¡Buenos días, escuela!', 'Bom dia, professora! Bom dia, escola!', 'teacher'],
    ],
  },
  wild: {
    title: { en: 'Animal Parade', es: 'Desfile de animales', pt: 'Desfile dos animais' },
    lines: [
      ['Stomp like an elephant, boom, boom!', '🐘', '¡Pisa fuerte como un elefante, bum, bum!', 'Pise forte como um elefante, bum, bum!', 'elephant'],
      ['Hop like a kangaroo, hop, hop!', '🦘', '¡Salta como un canguro, hop, hop!', 'Pule como um canguru, hop, hop!', 'kangaroo'],
      ['Swing like a monkey, ooh, ooh!', '🐒', '¡Cuélgate como un mono, uh, uh!', 'Balance como um macaco, uh, uh!', 'monkey'],
      ['Waddle like a penguin, slow, slow.', '🐧', 'Camina como un pingüino, despacio, despacio.', 'Ande como um pinguim, devagar, devagar.', 'penguin'],
    ],
  },
  sea: {
    title: { en: 'Splash in the Sea', es: 'Chapoteo en el mar', pt: 'Mergulho no mar' },
    lines: [
      ['Swim, swim, little dolphin!', '🐬', '¡Nada, nada, delfincito!', 'Nade, nade, golfinho!', 'dolphin'],
      ['Snap, snap, says the crab!', '🦀', '¡Clac, clac, dice el cangrejo!', 'Clac, clac, diz o caranguejo!', 'crab'],
      ['Eight long arms on the octopus.', '🐙', 'Ocho brazos largos tiene el pulpo.', 'O polvo tem oito braços compridos.', 'octopus'],
      ['Up and down goes the boat!', '⛵', '¡Sube y baja el barco!', 'Sobe e desce o barco!', 'boat'],
    ],
  },
  weather: {
    title: { en: "What's the Weather?", es: '¿Qué tiempo hace?', pt: 'Como está o tempo?' },
    lines: [
      ['Rain, rain, drip, drop, drip!', '🌧️', '¡Lluvia, lluvia, plic, ploc, plic!', 'Chuva, chuva, pingo, pingo, pingo!', 'rain'],
      ['Open my umbrella, pop!', '☂️', '¡Abro mi paraguas, pop!', 'Abro meu guarda-chuva, pop!', 'umbrella'],
      ['Wind, wind, whoosh, whoosh, whoosh!', '🌬️', '¡Viento, viento, fiu, fiu, fiu!', 'Vento, vento, fiu, fiu, fiu!', 'wind'],
      ['Snow is falling, build a snowman!', '⛄', '¡Cae la nieve, haz un muñeco de nieve!', 'A neve está caindo, faça um boneco de neve!', 'snowman'],
    ],
  },
  nature: {
    title: { en: 'Little Bug Song', es: 'La canción de los bichitos', pt: 'A música dos bichinhos' },
    lines: [
      ['A little ant goes march, march, march.', '🐜', 'Una hormiguita marcha, marcha, marcha.', 'Uma formiguinha marcha, marcha, marcha.', 'ant'],
      ['A little snail goes slow, slow, slow.', '🐌', 'Un caracolito va lento, lento, lento.', 'Um caracolzinho vai devagar, devagar.', 'snail'],
      ['A butterfly flies to a flower.', '🦋', 'Una mariposa vuela a una flor.', 'Uma borboleta voa até uma flor.', 'butterfly'],
      ['A spider spins, round and round.', '🕷️', 'Una araña teje, vueltas y vueltas.', 'Uma aranha tece, roda e roda.', 'spider'],
    ],
  },
  garden: {
    title: { en: 'Grow, Little Garden', es: 'Crece, huertito', pt: 'Cresce, hortinha' },
    lines: [
      ['Dig, dig, plant a carrot!', '🥕', '¡Cava, cava, siembra una zanahoria!', 'Cave, cave, plante uma cenoura!', 'carrot'],
      ['Water the tomato, grow, grow, grow!', '🍅', '¡Riega el tomate, crece, crece, crece!', 'Regue o tomate, cresce, cresce, cresce!', 'tomato'],
      ['A big orange pumpkin, wow!', '🎃', '¡Una calabaza naranja y grande, guau!', 'Uma abóbora laranja e grande, uau!', 'pumpkin'],
      ['Hot, hot, hot! A red chili!', '🌶️', '¡Pica, pica, pica! ¡Un chile rojo!', 'Arde, arde, arde! Uma pimenta vermelha!', 'chili'],
    ],
  },
  transport: {
    title: { en: "Beep Beep, Let's Go!", es: '¡Bip bip, vámonos!', pt: 'Bi-bi, vamos lá!' },
    lines: [
      ['The bus goes beep, beep, beep!', '🚌', '¡El autobús hace bip, bip, bip!', 'O ônibus faz bi, bi, bi!', 'bus'],
      ['The train goes choo, choo, choo!', '🚂', '¡El tren hace chu, chu, chu!', 'O trem faz piuí, piuí, piuí!', 'train'],
      ['The fire truck goes nee-naw, nee-naw!', '🚒', '¡El camión de bomberos hace niinoo, niinoo!', 'O caminhão de bombeiros faz uiu, uiu!', 'fire truck'],
      ['Three, two, one, the rocket goes up!', '🚀', '¡Tres, dos, uno, el cohete despega!', 'Três, dois, um, o foguete sobe!', 'rocket'],
    ],
  },
  actions: {
    title: { en: 'Move and Groove', es: 'Muévete y baila', pt: 'Mexa e dance' },
    lines: [
      ['Jump, jump, jump up high!', '🤸', '¡Salta, salta, salta alto!', 'Pule, pule, pule bem alto!', 'jump'],
      ['Dance, dance, spin around!', '💃', '¡Baila, baila, da una vuelta!', 'Dance, dance, dê uma volta!', 'dance'],
      ['Climb, climb, up the tree!', '🧗', '¡Trepa, trepa, al árbol!', 'Suba, suba, na árvore!', 'climb'],
      ['Shh! Now we sleep. Good night!', '😴', '¡Shh! Ahora dormimos. ¡Buenas noches!', 'Shh! Agora vamos dormir. Boa noite!', 'sleep'],
    ],
  },
  sports: {
    title: { en: 'Team Cheer', es: '¡Vamos, equipo!', pt: 'Vai, time!' },
    lines: [
      ['Kick the ball! Soccer, soccer!', '⚽', '¡Patea la pelota! ¡Fútbol, fútbol!', 'Chute a bola! Futebol, futebol!', 'soccer'],
      ['Bounce, bounce, basketball!', '🏀', '¡Bota, bota, básquetbol!', 'Quica, quica, basquete!', 'basketball'],
      ['Ping-pong, ping-pong, back and forth!', '🏓', '¡Ping-pong, ping-pong, de aquí para allá!', 'Pingue-pongue, pra lá e pra cá!', 'ping-pong'],
      ['We win a shiny trophy!', '🏆', '¡Ganamos un trofeo brillante!', 'Ganhamos um troféu brilhante!', 'trophy'],
    ],
  },
  music: {
    title: { en: 'The Band Song', es: 'La canción de la banda', pt: 'A música da banda' },
    lines: [
      ['Boom, boom, boom goes the drum!', '🥁', '¡Bum, bum, bum, suena el tambor!', 'Bum, bum, bum, faz o tambor!', 'drum'],
      ['Strum, strum, strum the guitar!', '🎸', '¡Rasga, rasga, rasga la guitarra!', 'Toca, toca, toca a guitarra!', 'guitar'],
      ['Toot, toot, says the trumpet!', '🎺', '¡Tu, tu, dice la trompeta!', 'Tu, tu, diz o trompete!', 'trumpet'],
      ['Ding, dong, ring the bell!', '🔔', '¡Din, don, toca la campana!', 'Dim, dom, toque o sino!', 'bell'],
    ],
  },
  shapes: {
    title: { en: 'Up and Down', es: 'Arriba y abajo', pt: 'Para cima e para baixo' },
    lines: [
      ['Hands up, hands down!', '🙌', '¡Manos arriba, manos abajo!', 'Mãos para cima, mãos para baixo!', 'up'],
      ['Step left, step right!', '👣', '¡Paso a la izquierda, paso a la derecha!', 'Passo para a esquerda, passo para a direita!', 'left'],
      ['Fast, fast, now slow, slow.', '🐢', 'Rápido, rápido, ahora lento, lento.', 'Rápido, rápido, agora devagar, devagar.', 'fast'],
      ['Draw a circle, draw a heart!', '⭕', '¡Dibuja un círculo, dibuja un corazón!', 'Desenhe um círculo, desenhe um coração!', 'circle'],
    ],
  },
  time: {
    title: { en: 'Four Seasons Song', es: 'La canción de las estaciones', pt: 'A música das estações' },
    lines: [
      ['Spring, spring, flowers grow!', '🌷', '¡Primavera, primavera, crecen las flores!', 'Primavera, primavera, as flores crescem!', 'spring'],
      ['Summer, summer, sun and play!', '☀️', '¡Verano, verano, sol y juegos!', 'Verão, verão, sol e brincadeira!', 'summer'],
      ['Autumn leaves fall down, down, down.', '🍂', 'Las hojas de otoño caen, caen, caen.', 'As folhas do outono caem, caem, caem.', 'autumn'],
      ['Winter, winter, cold, cold, cold!', '❄️', '¡Invierno, invierno, frío, frío, frío!', 'Inverno, inverno, frio, frio, frio!', 'winter'],
    ],
  },
  jobs: {
    title: { en: 'When I Grow Up', es: 'Cuando sea grande', pt: 'Quando eu crescer' },
    lines: [
      ['I can be a pilot and fly up high!', '✈️', '¡Puedo ser piloto y volar muy alto!', 'Eu posso ser piloto e voar bem alto!', 'pilot'],
      ['I can be a chef and cook a pie!', '🧑‍🍳', '¡Puedo ser chef y cocinar un pastel!', 'Eu posso ser chef e fazer uma torta!', 'chef'],
      ['I can be an astronaut in space!', '🧑‍🚀', '¡Puedo ser astronauta en el espacio!', 'Eu posso ser astronauta no espaço!', 'astronaut'],
      ['I can be a superhero and save the day!', '🦸', '¡Puedo ser superhéroe y salvar el día!', 'Eu posso ser super-herói e salvar o dia!', 'superhero'],
    ],
  },
  places: {
    title: { en: 'Walk Around Town', es: 'Paseo por la ciudad', pt: 'Passeio pela cidade' },
    lines: [
      ["Let's go to the zoo today!", '🦁', '¡Vamos al zoológico hoy!', 'Vamos ao zoológico hoje!', 'zoo'],
      ['Read a book at the library.', '📚', 'Lee un libro en la biblioteca.', 'Leia um livro na biblioteca.', 'library'],
      ['Cross the bridge, step, step, step!', '🌉', '¡Cruza el puente, paso, paso, paso!', 'Atravesse a ponte, passo, passo, passo!', 'bridge'],
      ['Hello, hello, my big city!', '🏙️', '¡Hola, hola, mi gran ciudad!', 'Olá, olá, minha cidade grande!', 'city'],
    ],
  },
  fantasy: {
    title: { en: 'Magic Land Chant', es: 'Canción de la tierra mágica', pt: 'Canção da terra mágica' },
    lines: [
      ['Roar, roar, says the dragon!', '🐉', '¡Grrr, grrr, dice el dragón!', 'Rrrr, rrrr, diz o dragão!', 'dragon'],
      ['Boo, boo, says the ghost!', '👻', '¡Buu, buu, dice el fantasma!', 'Buu, buu, diz o fantasma!', 'ghost'],
      ['Wave your wand, little fairy!', '🧚', '¡Mueve tu varita, pequeña hada!', 'Balance a varinha, fadinha!', 'fairy'],
      ['Follow the map and find the treasure!', '💰', '¡Sigue el mapa y encuentra el tesoro!', 'Siga o mapa e encontre o tesouro!', 'treasure'],
    ],
  },
  countries: {
    title: { en: 'Hello, World!', es: '¡Hola, mundo!', pt: 'Olá, mundo!' },
    lines: [
      ['Hola from Mexico and Spain!', '🇲🇽', '¡Hola desde México y España!', 'Hola do México e da Espanha!', 'Mexico'],
      ['Olá from Brazil, samba time!', '🇧🇷', '¡Olá desde Brasil, hora de samba!', 'Olá do Brasil, hora do samba!', 'Brazil'],
      ['Bonjour from France and Canada!', '🇫🇷', '¡Bonjour desde Francia y Canadá!', 'Bonjour da França e do Canadá!', 'France'],
      ['Konnichiwa from Japan!', '🇯🇵', '¡Konnichiwa desde Japón!', 'Konnichiwa do Japão!', 'Japan'],
    ],
  },
  birds: {
    title: { en: 'Early Bird Song', es: 'La canción de los pájaros', pt: 'A música dos passarinhos' },
    lines: [
      ['Cock-a-doodle-doo! The rooster wakes me up.', '🐓', '¡Quiquiriquí! El gallo me despierta.', 'Cocoricó! O galo me acorda.', 'rooster'],
      ['The flamingo stands on one leg.', '🦩', 'El flamenco se para en una pata.', 'O flamingo fica numa perna só.', 'flamingo'],
      ['Chirp, chirp, sings the cricket.', '🦗', 'Cri, cri, canta el grillo.', 'Cri, cri, canta o grilo.', 'cricket'],
      ['The eagle flies over the hill.', '🦅', 'El águila vuela sobre la colina.', 'A águia voa sobre o morro.', 'eagle'],
    ],
  },
  sweets: {
    title: { en: 'Sweet Treats', es: 'Dulces delicias', pt: 'Doces delícias' },
    lines: [
      ['Pop, pop, pop goes the popcorn!', '🍿', '¡Pop, pop, pop, hacen las palomitas!', 'Pop, pop, pop, faz a pipoca!', 'popcorn'],
      ['Flip, flip, flip the pancake!', '🥞', '¡Voltea, voltea, voltea el panqueque!', 'Vira, vira, vira a panqueca!', 'pancake'],
      ['Lick, lick, my lollipop!', '🍭', '¡Lame, lame, mi paleta!', 'Lambe, lambe, meu pirulito!', 'lollipop'],
      ['Just one cupcake, then brush your teeth!', '🧁', 'Solo un pastelito, ¡y luego a cepillarte los dientes!', 'Só um cupcake, depois escove os dentes!', 'cupcake'],
    ],
  },
  kitchen: {
    title: { en: 'Set the Table', es: 'Pon la mesa', pt: 'Ponha a mesa' },
    lines: [
      ['A plate for you, a plate for me.', '🍽️', 'Un plato para ti, un plato para mí.', 'Um prato para você, um prato para mim.', 'plate'],
      ['A fork, a spoon and a cup of tea.', '🥄', 'Un tenedor, una cuchara y una taza de té.', 'Um garfo, uma colher e uma xícara de chá.', 'spoon'],
      ['Chopsticks, click, click, rice in the bowl.', '🥢', 'Palitos, clic, clic, arroz en el tazón.', 'Hashis, clique, clique, arroz na tigela.', 'chopsticks'],
      ['The teapot sings: whistle, whee!', '🫖', 'La tetera canta: ¡fiuuu!', 'A chaleira canta: fiuuu!', 'teapot'],
    ],
  },
  health: {
    title: { en: 'Healthy Habits', es: 'Hábitos sanos', pt: 'Hábitos saudáveis' },
    lines: [
      ['Scrub, scrub, soap and water!', '🧼', '¡Talla, talla, agua y jabón!', 'Esfrega, esfrega, água e sabão!', 'soap'],
      ['Brush, brush, with my toothbrush!', '🪥', '¡Cepilla, cepilla, con mi cepillo de dientes!', 'Escova, escova, com a minha escova de dentes!', 'toothbrush'],
      ['Achoo! Sneeze into your arm.', '🤧', '¡Achú! Estornuda en tu brazo.', 'Atchim! Espirre no braço.', 'sneeze'],
      ['Exercise makes me strong!', '💪', '¡El ejercicio me hace fuerte!', 'O exercício me deixa forte!', 'exercise'],
    ],
  },
  tools: {
    title: { en: 'Builder Beat', es: 'Ritmo de constructor', pt: 'Ritmo de construtor' },
    lines: [
      ['Bang, bang, bang with the hammer!', '🔨', '¡Pum, pum, pum con el martillo!', 'Bate, bate, bate com o martelo!', 'hammer'],
      ['Back and forth goes the saw!', '🪚', '¡Para atrás y para adelante va el serrucho!', 'Pra lá e pra cá vai o serrote!', 'saw'],
      ['Brick on brick, we build a wall!', '🧱', '¡Ladrillo sobre ladrillo, hacemos un muro!', 'Tijolo sobre tijolo, fazemos um muro!', 'brick'],
      ['Climb the ladder, step by step.', '🪜', 'Sube la escalera, paso a paso.', 'Suba a escada, degrau por degrau.', 'ladder'],
    ],
  },
  celebrations: {
    title: { en: 'Party Song', es: 'Canción de fiesta', pt: 'Música de festa' },
    lines: [
      ['Hit the piñata, one, two, three!', '🪅', '¡Pégale a la piñata, uno, dos, tres!', 'Bata na piñata, um, dois, três!', 'piñata'],
      ['Blow out the candle and make a wish!', '🕯️', '¡Sopla la vela y pide un deseo!', 'Assopre a vela e faça um pedido!', 'candle'],
      ['Fireworks! Boom! Up in the sky!', '🎆', '¡Fuegos artificiales! ¡Bum! ¡Allá en el cielo!', 'Fogos de artifício! Bum! Lá no céu!', 'fireworks'],
      ['Throw confetti, hip, hip, hooray!', '🎊', '¡Lanza confeti, hip, hip, hurra!', 'Jogue confete, hip, hip, hurra!', 'confetti'],
    ],
  },
  tech: {
    title: { en: 'Gadget Groove', es: 'Ritmo de aparatos', pt: 'Ritmo dos aparelhos' },
    lines: [
      ['Tap, tap, tap on the keyboard!', '⌨️', '¡Tap, tap, tap en el teclado!', 'Tec, tec, tec no teclado!', 'keyboard'],
      ['Look at the stars with a telescope!', '🔭', '¡Mira las estrellas con un telescopio!', 'Olhe as estrelas com um telescópio!', 'telescope'],
      ['Click! The flashlight shines in the dark.', '🔦', '¡Clic! La linterna brilla en la oscuridad.', 'Clique! A lanterna brilha no escuro.', 'flashlight'],
      ['Tick, tock, look at my watch!', '⌚', '¡Tic, tac, mira mi reloj!', 'Tic, tac, olhe o meu relógio!', 'watch'],
    ],
  },
};
