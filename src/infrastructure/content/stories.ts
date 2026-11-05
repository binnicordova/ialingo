import type { StorySource } from './define-world';

/**
 * One short picture story per world (5 pages). Each page is read aloud by the
 * guide and is about one of the world's words (the last column), so the
 * comprehension questions are generated from the words just heard in context.
 * Simple present tense and A1 sentences, at most about 9 words.
 */
export const STORIES: Readonly<Record<string, StorySource>> = {
  feelings: {
    title: { en: "Luna's Happy Day", es: 'El día feliz de Luna', pt: 'O dia feliz da Luna' },
    lines: [
      ['Luna wakes up. She is happy.', '😀', 'Luna se despierta. Está feliz.', 'A Luna acorda. Ela está feliz.', 'happy'],
      ['Her friend Pip is sad.', '😢', 'Su amiga Pip está triste.', 'A amiga dela, Pip, está triste.', 'sad'],
      ['Luna says hello and smiles.', '👋', 'Luna dice hola y sonríe.', 'A Luna diz olá e sorri.', 'hello'],
      ['They tell a funny joke.', '😂', 'Cuentan un chiste gracioso.', 'Elas contam uma piada engraçada.', 'funny'],
      ['Now Pip is happy too. I love my friends!', '❤️', 'Ahora Pip también está feliz. ¡Quiero a mis amigos!', 'Agora a Pip também está feliz. Eu amo meus amigos!', 'love'],
    ],
  },
  colors: {
    title: { en: 'The Rainbow Painting', es: 'La pintura arcoíris', pt: 'A pintura arco-íris' },
    lines: [
      ['Pip has red paint.', '🔴', 'Pip tiene pintura roja.', 'A Pip tem tinta vermelha.', 'red'],
      ['She paints a blue sky.', '🔵', 'Pinta un cielo azul.', 'Ela pinta um céu azul.', 'blue'],
      ['She paints a yellow sun.', '🟡', 'Pinta un sol amarillo.', 'Ela pinta um sol amarelo.', 'yellow'],
      ['She paints green grass.', '🟢', 'Pinta pasto verde.', 'Ela pinta grama verde.', 'green'],
      ['Look! A big rainbow!', '🌈', '¡Mira! ¡Un gran arcoíris!', 'Olha! Um grande arco-íris!', 'rainbow'],
    ],
  },
  numbers: {
    title: { en: 'Ziggy Counts', es: 'Ziggy cuenta', pt: 'O Ziggy conta' },
    lines: [
      ['Ziggy sees one cat.', '🐱', 'Ziggy ve un gato.', 'O Ziggy vê um gato.', 'one'],
      ['Now he sees two birds.', '🐦', 'Ahora ve dos pájaros.', 'Agora ele vê dois pássaros.', 'two'],
      ['Three fish swim by.', '🐟', 'Pasan nadando tres peces.', 'Três peixes passam nadando.', 'three'],
      ['Five stars shine at night.', '⭐', 'Cinco estrellas brillan de noche.', 'Cinco estrelas brilham à noite.', 'five'],
      ['Ten friends say: Beep boop!', '🤖', 'Diez amigos dicen: ¡Bip bop!', 'Dez amigos dizem: Bip bop!', 'ten'],
    ],
  },
  farm: {
    title: { en: 'Morning on the Farm', es: 'Mañana en la granja', pt: 'Manhã na fazenda' },
    lines: [
      ['The cow says moo.', '🐮', 'La vaca dice mu.', 'A vaca faz mu.', 'cow'],
      ['The duck swims in the pond.', '🦆', 'El pato nada en el estanque.', 'O pato nada no lago.', 'duck'],
      ['The pig plays in the mud.', '🐷', 'El cerdo juega en el lodo.', 'O porco brinca na lama.', 'pig'],
      ['The horse runs fast.', '🐴', 'El caballo corre rápido.', 'O cavalo corre rápido.', 'horse'],
      ['The dog wants to play!', '🐶', '¡El perro quiere jugar!', 'O cachorro quer brincar!', 'dog'],
    ],
  },
  fruits: {
    title: { en: "Coco's Fruit Salad", es: 'La ensalada de frutas de Coco', pt: 'A salada de frutas do Coco' },
    lines: [
      ['Coco cuts a red apple.', '🍎', 'Coco corta una manzana roja.', 'O Coco corta uma maçã vermelha.', 'apple'],
      ['He adds a yellow banana.', '🍌', 'Agrega un plátano amarillo.', 'Ele coloca uma banana amarela.', 'banana'],
      ['Then some sweet grapes.', '🍇', 'Luego unas uvas dulces.', 'Depois umas uvas doces.', 'grapes'],
      ['And a big strawberry.', '🍓', 'Y una fresa grande.', 'E um morango grande.', 'strawberry'],
      ['We share a big watermelon!', '🍉', '¡Compartimos una sandía grande!', 'Nós dividimos uma melancia grande!', 'watermelon'],
    ],
  },
  family: {
    title: { en: "Grandma's Visit", es: 'La visita de la abuela', pt: 'A visita da vovó' },
    lines: [
      ['Grandma comes to our home.', '👵', 'La abuela viene a casa.', 'A vovó vem para casa.', 'grandma'],
      ['Mom makes a big cake.', '👩', 'Mamá hace un pastel grande.', 'A mamãe faz um bolo grande.', 'mom'],
      ['Dad plays with the baby.', '👨', 'Papá juega con el bebé.', 'O papai brinca com o bebê.', 'dad'],
      ['My brother gives Grandma a kiss.', '😘', 'Mi hermano le da un beso a la abuela.', 'Meu irmão dá um beijo na vovó.', 'kiss'],
      ['We all have a family hug!', '🤗', '¡Todos nos damos un abrazo!', 'Todos damos um abraço em família!', 'hug'],
    ],
  },
  body: {
    title: { en: "Rafa's Warm-Up", es: 'El calentamiento de Rafa', pt: 'O aquecimento do Rafa' },
    lines: [
      ['Rafa raises his arms.', '💪', 'Rafa levanta los brazos.', 'O Rafa levanta os braços.', 'arm'],
      ['He shakes his hands.', '✋', 'Sacude las manos.', 'Ele balança as mãos.', 'hand'],
      ['He stands on one foot.', '🦶', 'Se para en un pie.', 'Ele fica num pé só.', 'foot'],
      ['He touches his nose.', '👃', 'Se toca la nariz.', 'Ele toca o nariz.', 'nose'],
      ['Great! Now smile with your mouth!', '👄', '¡Genial! ¡Ahora sonríe con la boca!', 'Ótimo! Agora sorria com a boca!', 'mouth'],
    ],
  },
  toys: {
    title: { en: 'The Toy Party', es: 'La fiesta de juguetes', pt: 'A festa dos brinquedos' },
    lines: [
      ['Teddy bear has a party.', '🧸', 'El osito tiene una fiesta.', 'O ursinho faz uma festa.', 'teddy bear'],
      ['The robot brings a balloon.', '🎈', 'El robot trae un globo.', 'O robô traz um balão.', 'balloon'],
      ['The doll brings a gift.', '🎁', 'La muñeca trae un regalo.', 'A boneca traz um presente.', 'gift'],
      ['They play with a ball.', '🏐', 'Juegan con una pelota.', 'Eles brincam com uma bola.', 'ball'],
      ['What a fun party!', '🎉', '¡Qué fiesta tan divertida!', 'Que festa divertida!', 'party'],
    ],
  },
  food: {
    title: { en: 'Lunch Time', es: 'La hora de comer', pt: 'Hora do almoço' },
    lines: [
      ['I want soup and bread.', '🍲', 'Quiero sopa y pan.', 'Eu quero sopa e pão.', 'soup'],
      ['Mom gives me rice and meat.', '🍚', 'Mamá me da arroz y carne.', 'A mamãe me dá arroz e carne.', 'rice'],
      ['I drink a glass of milk.', '🥛', 'Tomo un vaso de leche.', 'Eu bebo um copo de leite.', 'milk'],
      ['For dessert, ice cream!', '🍦', '¡De postre, helado!', 'De sobremesa, sorvete!', 'ice cream'],
      ['Tomorrow we eat pizza!', '🍕', '¡Mañana comemos pizza!', 'Amanhã comemos pizza!', 'pizza'],
    ],
  },
  clothes: {
    title: { en: 'Getting Dressed', es: 'A vestirse', pt: 'Hora de se vestir' },
    lines: [
      ['It is cold. I put on my coat.', '🧥', 'Hace frío. Me pongo el abrigo.', 'Está frio. Eu visto o casaco.', 'coat'],
      ['I wear a warm scarf.', '🧣', 'Uso una bufanda calientita.', 'Eu uso um cachecol quentinho.', 'scarf'],
      ['I put on my socks and boots.', '👢', 'Me pongo los calcetines y las botas.', 'Eu calço as meias e as botas.', 'boots'],
      ['My gloves are blue.', '🧤', 'Mis guantes son azules.', 'Minhas luvas são azuis.', 'gloves'],
      ['And a hat! I am ready!', '🎩', '¡Y un sombrero! ¡Estoy listo!', 'E um chapéu! Estou pronto!', 'hat'],
    ],
  },
  home: {
    title: { en: 'Bedtime at Home', es: 'Hora de dormir', pt: 'Hora de dormir' },
    lines: [
      ['I open the door of my house.', '🚪', 'Abro la puerta de mi casa.', 'Eu abro a porta da minha casa.', 'door'],
      ['I take a shower.', '🚿', 'Me doy una ducha.', 'Eu tomo um banho de chuveiro.', 'shower'],
      ['I look in the mirror.', '🪞', 'Me miro en el espejo.', 'Eu me olho no espelho.', 'mirror'],
      ['I turn off the light.', '💡', 'Apago la luz.', 'Eu apago a luz.', 'light'],
      ['Good night, bed!', '🛏️', '¡Buenas noches, cama!', 'Boa noite, cama!', 'bed'],
    ],
  },
  school: {
    title: { en: 'A Day at School', es: 'Un día en la escuela', pt: 'Um dia na escola' },
    lines: [
      ['I go to school with my backpack.', '🎒', 'Voy a la escuela con mi mochila.', 'Eu vou para a escola com a minha mochila.', 'backpack'],
      ['The teacher says good morning.', '👩‍🏫', 'La maestra dice buenos días.', 'A professora diz bom dia.', 'teacher'],
      ['I draw with a crayon.', '🖍️', 'Dibujo con un crayón.', 'Eu desenho com um giz de cera.', 'crayon'],
      ['I read a book.', '📕', 'Leo un libro.', 'Eu leio um livro.', 'book'],
      ['I cut paper with scissors.', '✂️', 'Corto papel con tijeras.', 'Eu corto papel com a tesoura.', 'scissors'],
    ],
  },
  wild: {
    title: { en: 'Safari Trip', es: 'Viaje de safari', pt: 'Viagem de safári' },
    lines: [
      ['Bolt sees a big lion.', '🦁', 'Bolt ve un león grande.', 'O Bolt vê um leão grande.', 'lion'],
      ['A giraffe eats leaves.', '🦒', 'Una jirafa come hojas.', 'Uma girafa come folhas.', 'giraffe'],
      ['The monkey jumps in a tree.', '🐵', 'El mono salta en un árbol.', 'O macaco pula numa árvore.', 'monkey'],
      ['The elephant drinks water.', '🐘', 'El elefante toma agua.', 'O elefante bebe água.', 'elephant'],
      ['Shh! The tiger is sleeping.', '🐯', '¡Shh! El tigre está durmiendo.', 'Psiu! O tigre está dormindo.', 'tiger'],
    ],
  },
  sea: {
    title: { en: 'Mara Dives Down', es: 'Mara se sumerge', pt: 'A Mara mergulha' },
    lines: [
      ['Mara jumps over a wave.', '🌊', 'Mara salta sobre una ola.', 'A Mara pula uma onda.', 'wave'],
      ['She sees a happy dolphin.', '🐬', 'Ve un delfín feliz.', 'Ela vê um golfinho feliz.', 'dolphin'],
      ['An octopus waves hello.', '🐙', 'Un pulpo la saluda.', 'Um polvo dá oi.', 'octopus'],
      ['A crab hides in a shell.', '🦀', 'Un cangrejo se esconde en una concha.', 'Um caranguejo se esconde numa concha.', 'crab'],
      ['A big whale sings a song.', '🐳', 'Una ballena grande canta una canción.', 'Uma baleia grande canta uma canção.', 'whale'],
    ],
  },
  weather: {
    title: { en: "Nubi's Weather Week", es: 'La semana del clima de Nubi', pt: 'A semana do tempo da Nubi' },
    lines: [
      ['On Monday, the sun is hot.', '☀️', 'El lunes, el sol está caliente.', 'Na segunda, o sol está quente.', 'sun'],
      ['On Tuesday, there is a lot of wind.', '💨', 'El martes hay mucho viento.', 'Na terça, venta muito.', 'wind'],
      ['On Wednesday, there is rain.', '🌧️', 'El miércoles llueve.', 'Na quarta, chove.', 'rain'],
      ['On Thursday, I use my umbrella.', '☂️', 'El jueves uso mi paraguas.', 'Na quinta, eu uso meu guarda-chuva.', 'umbrella'],
      ['On Friday, we make a snowman!', '⛄', '¡El viernes hacemos un muñeco de nieve!', 'Na sexta, fazemos um boneco de neve!', 'snowman'],
    ],
  },
  nature: {
    title: { en: 'A Walk in the Forest', es: 'Un paseo por el bosque', pt: 'Um passeio na floresta' },
    lines: [
      ['We walk in the forest.', '🌲', 'Caminamos por el bosque.', 'Nós andamos na floresta.', 'forest'],
      ['A butterfly flies by.', '🦋', 'Pasa volando una mariposa.', 'Uma borboleta passa voando.', 'butterfly'],
      ['Ants carry a leaf.', '🍃', 'Las hormigas cargan una hoja.', 'As formigas carregam uma folha.', 'leaf'],
      ['A snail is very slow.', '🐌', 'Un caracol es muy lento.', 'Um caracol é muito lento.', 'snail'],
      ['We see a big mountain.', '⛰️', 'Vemos una montaña grande.', 'Nós vemos uma montanha grande.', 'mountain'],
    ],
  },
  garden: {
    title: { en: "Coco's Garden", es: 'El huerto de Coco', pt: 'A horta do Coco' },
    lines: [
      ['Coco plants a carrot.', '🥕', 'Coco siembra una zanahoria.', 'O Coco planta uma cenoura.', 'carrot'],
      ['The tomato is red and round.', '🍅', 'El tomate es rojo y redondo.', 'O tomate é vermelho e redondo.', 'tomato'],
      ['The corn is very tall.', '🌽', 'El maíz es muy alto.', 'O milho é muito alto.', 'corn'],
      ['A big pumpkin grows.', '🎃', 'Crece una calabaza grande.', 'Uma abóbora grande cresce.', 'pumpkin'],
      ["Let's make a salad!", '🥗', '¡Hagamos una ensalada!', 'Vamos fazer uma salada!', 'salad'],
    ],
  },
  transport: {
    title: { en: 'Going to the City', es: 'Vamos a la ciudad', pt: 'Indo para a cidade' },
    lines: [
      ['We take the bus.', '🚌', 'Tomamos el autobús.', 'Nós pegamos o ônibus.', 'bus'],
      ['A red car goes fast.', '🚗', 'Un carro rojo va rápido.', 'Um carro vermelho vai rápido.', 'car'],
      ['The train goes choo choo!', '🚂', '¡El tren hace chu chu!', 'O trem faz piuí!', 'train'],
      ['A plane flies in the sky.', '✈️', 'Un avión vuela en el cielo.', 'Um avião voa no céu.', 'plane'],
      ['I ride my bike home.', '🚲', 'Regreso a casa en bicicleta.', 'Eu volto para casa de bicicleta.', 'bike'],
    ],
  },
  actions: {
    title: { en: 'The Animal Games', es: 'Los juegos de los animales', pt: 'Os jogos dos animais' },
    lines: [
      ['The rabbit can jump high.', '🐰', 'El conejo puede saltar alto.', 'O coelho pode pular alto.', 'jump'],
      ['The fish can swim fast.', '🐟', 'El pez puede nadar rápido.', 'O peixe pode nadar rápido.', 'swim'],
      ['The bird can fly far.', '🐦', 'El pájaro puede volar lejos.', 'O pássaro pode voar longe.', 'fly'],
      ['The monkey can climb.', '🐵', 'El mono puede escalar.', 'O macaco pode escalar.', 'climb'],
      ['And I can dance!', '💃', '¡Y yo puedo bailar!', 'E eu posso dançar!', 'dance'],
    ],
  },
  sports: {
    title: { en: 'The Big Game', es: 'El gran partido', pt: 'O grande jogo' },
    lines: [
      ['Today we play soccer.', '⚽', 'Hoy jugamos fútbol.', 'Hoje jogamos futebol.', 'soccer'],
      ['Rafa kicks and... goal!', '🥅', 'Rafa patea y... ¡gol!', 'O Rafa chuta e... gol!', 'goal'],
      ['Our team wins a medal.', '🏅', 'Nuestro equipo gana una medalla.', 'Nosso time ganha uma medalha.', 'medal'],
      ['We hold a gold trophy.', '🏆', 'Levantamos un trofeo dorado.', 'Levantamos um troféu dourado.', 'trophy'],
      ['Tomorrow we play tennis!', '🎾', '¡Mañana jugamos tenis!', 'Amanhã jogamos tênis!', 'tennis'],
    ],
  },
  music: {
    title: { en: 'The Little Band', es: 'La pequeña banda', pt: 'A pequena banda' },
    lines: [
      ['Pip plays the guitar.', '🎸', 'Pip toca la guitarra.', 'A Pip toca violão.', 'guitar'],
      ['Ziggy plays the drum.', '🥁', 'Ziggy toca el tambor.', 'O Ziggy toca tambor.', 'drum'],
      ['Luna plays the piano.', '🎹', 'Luna toca el piano.', 'A Luna toca piano.', 'piano'],
      ['Bolt sings into the microphone.', '🎤', 'Bolt canta con el micrófono.', 'O Bolt canta no microfone.', 'microphone'],
      ['Everyone loves the music!', '🎵', '¡A todos les encanta la música!', 'Todo mundo ama a música!', 'music'],
    ],
  },
  shapes: {
    title: { en: "Ziggy's Shape Hunt", es: 'Ziggy busca formas', pt: 'O Ziggy caça formas' },
    lines: [
      ['The sun is a big circle.', '☀️', 'El sol es un círculo grande.', 'O sol é um círculo grande.', 'circle'],
      ['The window is a square.', '🪟', 'La ventana es un cuadrado.', 'A janela é um quadrado.', 'square'],
      ['The pizza slice is a triangle.', '🍕', 'La rebanada de pizza es un triángulo.', 'A fatia de pizza é um triângulo.', 'triangle'],
      ['The kite is a diamond.', '🪁', 'La cometa es un rombo.', 'A pipa é um losango.', 'diamond'],
      ['I love you! Here is a heart.', '♥️', '¡Te quiero! Aquí tienes un corazón.', 'Eu te amo! Aqui está um coração.', 'heart'],
    ],
  },
  time: {
    title: { en: 'My Day', es: 'Mi día', pt: 'O meu dia' },
    lines: [
      ['In the morning, I wake up.', '🌅', 'En la mañana, me despierto.', 'De manhã, eu acordo.', 'morning'],
      ['I eat breakfast.', '🥞', 'Desayuno.', 'Eu tomo café da manhã.', 'breakfast'],
      ['At noon, I eat lunch.', '🍱', 'Al mediodía, almuerzo.', 'Ao meio-dia, eu almoço.', 'lunch'],
      ['In the afternoon, I play.', '🌇', 'En la tarde, juego.', 'À tarde, eu brinco.', 'afternoon'],
      ['At night, I sleep. Good night!', '🌃', 'En la noche, duermo. ¡Buenas noches!', 'À noite, eu durmo. Boa noite!', 'night'],
    ],
  },
  jobs: {
    title: { en: 'What Will I Be?', es: '¿Qué voy a ser?', pt: 'O que eu vou ser?' },
    lines: [
      ['Maybe a doctor who helps people.', '👩‍⚕️', 'Tal vez una doctora que ayuda a la gente.', 'Talvez uma médica que ajuda as pessoas.', 'doctor'],
      ['Maybe a brave firefighter.', '👩‍🚒', 'Tal vez una bombera valiente.', 'Talvez uma bombeira corajosa.', 'firefighter'],
      ['Maybe an astronaut in space.', '👩‍🚀', 'Tal vez una astronauta en el espacio.', 'Talvez uma astronauta no espaço.', 'astronaut'],
      ['Maybe a chef who cooks pizza.', '👨‍🍳', 'Tal vez un chef que cocina pizza.', 'Talvez um chef que faz pizza.', 'chef'],
      ['Or a superhero! I can be anything!', '🦸', '¡O un superhéroe! ¡Puedo ser lo que quiera!', 'Ou um super-herói! Eu posso ser o que quiser!', 'superhero'],
    ],
  },
  places: {
    title: { en: "Mara's City Tour", es: 'El paseo de Mara', pt: 'O passeio da Mara' },
    lines: [
      ['First, we go to the park.', '🏞️', 'Primero vamos al parque.', 'Primeiro, vamos ao parque.', 'park'],
      ['Then we visit the zoo.', '🦓', 'Luego visitamos el zoológico.', 'Depois visitamos o zoológico.', 'zoo'],
      ['We read at the library.', '📚', 'Leemos en la biblioteca.', 'Nós lemos na biblioteca.', 'library'],
      ['We eat at a restaurant.', '🍽️', 'Comemos en un restaurante.', 'Nós comemos num restaurante.', 'restaurant'],
      ['We sleep in a hotel.', '🏨', 'Dormimos en un hotel.', 'Nós dormimos num hotel.', 'hotel'],
    ],
  },
  fantasy: {
    title: { en: "The Dragon's Treasure", es: 'El tesoro del dragón', pt: 'O tesouro do dragão' },
    lines: [
      ['A little dragon finds a map.', '🗺️', 'Un dragoncito encuentra un mapa.', 'Um dragãozinho encontra um mapa.', 'map'],
      ['A fairy shows the way.', '🧚', 'Un hada le muestra el camino.', 'Uma fada mostra o caminho.', 'fairy'],
      ['A friendly ghost says boo!', '👻', '¡Un fantasma amigable dice bu!', 'Um fantasma amigo diz bu!', 'ghost'],
      ['A wizard opens a door.', '🧙', 'Un mago abre una puerta.', 'Um mago abre uma porta.', 'wizard'],
      ['They find the treasure!', '💎', '¡Encuentran el tesoro!', 'Eles encontram o tesouro!', 'treasure'],
    ],
  },
  countries: {
    title: { en: 'Kiki Flies Around the World', es: 'Kiki vuela por el mundo', pt: 'O Kiki voa pelo mundo' },
    lines: [
      ['Kiki starts in Mexico.', '🇲🇽', 'Kiki empieza en México.', 'O Kiki começa no México.', 'Mexico'],
      ['He flies to Brazil.', '🇧🇷', 'Vuela a Brasil.', 'Ele voa para o Brasil.', 'Brazil'],
      ['He eats pizza in Italy.', '🇮🇹', 'Come pizza en Italia.', 'Ele come pizza na Itália.', 'Italy'],
      ['He sees snow in Canada.', '🇨🇦', 'Ve nieve en Canadá.', 'Ele vê neve no Canadá.', 'Canada'],
      ['He says hello in Japan.', '🇯🇵', 'Dice hola en Japón.', 'Ele diz olá no Japão.', 'Japan'],
    ],
  },
  birds: {
    title: { en: 'The Bird Concert', es: 'El concierto de los pájaros', pt: 'O concerto dos pássaros' },
    lines: [
      ['The parrot sings first.', '🦜', 'El loro canta primero.', 'O papagaio canta primeiro.', 'parrot'],
      ['The rooster says cock-a-doodle-doo!', '🐓', '¡El gallo dice quiquiriquí!', 'O galo faz cocoricó!', 'rooster'],
      ['The cricket plays music at night.', '🦗', 'El grillo toca música de noche.', 'O grilo toca música à noite.', 'cricket'],
      ['The peacock shows its feathers.', '🦚', 'El pavo real muestra sus plumas.', 'O pavão mostra suas penas.', 'peacock'],
      ['The eagle flies over everyone.', '🦅', 'El águila vuela sobre todos.', 'A águia voa sobre todos.', 'eagle'],
    ],
  },
  sweets: {
    title: { en: 'The Sweet Shop', es: 'La dulcería', pt: 'A doceria' },
    lines: [
      ['Coco makes a pink donut.', '🍩', 'Coco hace una dona rosa.', 'O Coco faz uma rosquinha rosa.', 'donut'],
      ['He melts some chocolate.', '🍫', 'Derrite un poco de chocolate.', 'Ele derrete um pouco de chocolate.', 'chocolate'],
      ['The popcorn goes pop!', '🍿', '¡Las palomitas hacen pop!', 'A pipoca faz pop!', 'popcorn'],
      ['A child buys a lollipop.', '🍭', 'Un niño compra una paleta.', 'Uma criança compra um pirulito.', 'lollipop'],
      ['Share a cupcake with a friend!', '🧁', '¡Comparte un pastelito con un amigo!', 'Divida um cupcake com um amigo!', 'cupcake'],
    ],
  },
  kitchen: {
    title: { en: 'Helping in the Kitchen', es: 'Ayudo en la cocina', pt: 'Ajudando na cozinha' },
    lines: [
      ['I put the plates on the table.', '🍽️', 'Pongo los platos en la mesa.', 'Eu coloco os pratos na mesa.', 'plate'],
      ['A fork and a spoon for everyone.', '🥄', 'Un tenedor y una cuchara para todos.', 'Um garfo e uma colher para todos.', 'spoon'],
      ['Grandpa makes tea in the teapot.', '🫖', 'El abuelo prepara té en la tetera.', 'O vovô faz chá no bule.', 'teapot'],
      ['I pour milk into a glass.', '🥃', 'Sirvo leche en un vaso.', 'Eu coloco leite no copo.', 'glass'],
      ['We eat noodles with chopsticks!', '🥢', '¡Comemos fideos con palillos!', 'Comemos macarrão com hashis!', 'chopsticks'],
    ],
  },
  health: {
    title: { en: 'Staying Healthy', es: 'Me mantengo sano', pt: 'Ficando saudável' },
    lines: [
      ['I wash my hands with soap.', '🧼', 'Me lavo las manos con jabón.', 'Eu lavo as mãos com sabonete.', 'soap'],
      ['I brush my teeth with my toothbrush.', '🪥', 'Me lavo los dientes con mi cepillo.', 'Eu escovo os dentes com a minha escova.', 'toothbrush'],
      ['Achoo! I sneeze into my arm.', '🤧', '¡Achís! Estornudo en mi brazo.', 'Atchim! Eu espirro no braço.', 'sneeze'],
      ['A bandage helps my knee.', '🩹', 'Una curita ayuda a mi rodilla.', 'Um curativo ajuda o meu joelho.', 'bandage'],
      ['I do exercise every day.', '🏋️', 'Hago ejercicio todos los días.', 'Eu faço exercício todo dia.', 'exercise'],
    ],
  },
  tools: {
    title: { en: 'Bruno Builds a Treehouse', es: 'Bruno construye una casita', pt: 'O Bruno constrói uma casinha' },
    lines: [
      ['Bruno opens his toolbox.', '🧰', 'Bruno abre su caja de herramientas.', 'O Bruno abre sua caixa de ferramentas.', 'toolbox'],
      ['He cuts wood with a saw.', '🪚', 'Corta madera con un serrucho.', 'Ele corta madeira com um serrote.', 'saw'],
      ['Bang, bang! goes the hammer.', '🔨', '¡Pum, pum! hace el martillo.', 'Pou, pou! faz o martelo.', 'hammer'],
      ['He climbs up the ladder.', '🪜', 'Sube por la escalera.', 'Ele sobe a escada.', 'ladder'],
      ['He pulls up a bucket with a rope.', '🪣', 'Sube un balde con una cuerda.', 'Ele puxa um balde com uma corda.', 'bucket'],
    ],
  },
  celebrations: {
    title: { en: 'A Year of Parties', es: 'Un año de fiestas', pt: 'Um ano de festas' },
    lines: [
      ['In December, we decorate the Christmas tree.', '🎄', 'En diciembre decoramos el árbol de Navidad.', 'Em dezembro, enfeitamos a árvore de Natal.', 'Christmas tree'],
      ['At New Year, we watch fireworks.', '🎆', 'En Año Nuevo vemos fuegos artificiales.', 'No Ano Novo, vemos fogos de artifício.', 'fireworks'],
      ['On my birthday, I hit the piñata.', '🪅', 'En mi cumpleaños le pego a la piñata.', 'No meu aniversário, eu bato na piñata.', 'piñata'],
      ['We light a candle.', '🕯️', 'Encendemos una vela.', 'Acendemos uma vela.', 'candle'],
      ['Confetti everywhere! Hooray!', '🎊', '¡Confeti por todas partes! ¡Hurra!', 'Confete por todo lado! Viva!', 'confetti'],
    ],
  },
  tech: {
    title: { en: 'The Little Inventor', es: 'El pequeño inventor', pt: 'O pequeno inventor' },
    lines: [
      ['Bruno has a new laptop.', '💻', 'Bruno tiene una laptop nueva.', 'O Bruno tem um laptop novo.', 'laptop'],
      ['He types on the keyboard.', '⌨️', 'Escribe en el teclado.', 'Ele digita no teclado.', 'keyboard'],
      ['He puts a battery in the robot.', '🔋', 'Le pone una batería al robot.', 'Ele coloca uma bateria no robô.', 'battery'],
      ['He looks with a magnifying glass.', '🔍', 'Mira con una lupa.', 'Ele olha com uma lupa.', 'magnifying glass'],
      ['At night, they look at stars with a telescope.', '🔭', 'De noche miran las estrellas con un telescopio.', 'À noite, eles olham as estrelas com um telescópio.', 'telescope'],
    ],
  },
};
