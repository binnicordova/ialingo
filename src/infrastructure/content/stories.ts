import type { StorySource } from './define-world';

/**
 * One short picture story per world (5 pages). Each page is read aloud by the
 * guide and is about one of the world's words (the last column), so the
 * comprehension questions are generated from the words just heard in context.
 * Simple present tense and A1 sentences, at most about 9 words.
 */
export const STORIES: Readonly<Record<string, StorySource>> = {
  feelings: {
    title: { en: "Luna's Happy Day", es: 'El día feliz de Luna', pt: 'O dia feliz da Luna', fr: 'La belle journée de Luna' },
    lines: [
      ['Luna wakes up. She is happy.', '😀', 'Luna se despierta. Está feliz.', 'A Luna acorda. Ela está feliz.', 'Luna se réveille. Elle est contente.', 'happy'],
      ['Her friend Pip is sad.', '😢', 'Su amiga Pip está triste.', 'A amiga dela, Pip, está triste.', 'Son amie Pip est triste.', 'sad'],
      ['Luna says hello and smiles.', '👋', 'Luna dice hola y sonríe.', 'A Luna diz olá e sorri.', 'Luna dit bonjour et sourit.', 'hello'],
      ['They tell a funny joke.', '😂', 'Cuentan un chiste gracioso.', 'Elas contam uma piada engraçada.', 'Elles racontent une blague drôle.', 'funny'],
      ['Now Pip is happy too. I love my friends!', '❤️', 'Ahora Pip también está feliz. ¡Quiero a mis amigos!', 'Agora a Pip também está feliz. Eu amo meus amigos!', "Maintenant, Pip est contente aussi. J'aime mes amis !", 'love'],
    ],
  },
  colors: {
    title: { en: 'The Rainbow Painting', es: 'La pintura arcoíris', pt: 'A pintura arco-íris', fr: 'Le tableau arc-en-ciel' },
    lines: [
      ['Pip has red paint.', '🔴', 'Pip tiene pintura roja.', 'A Pip tem tinta vermelha.', 'Pip a de la peinture rouge.', 'red'],
      ['She paints a blue sky.', '🔵', 'Pinta un cielo azul.', 'Ela pinta um céu azul.', 'Elle peint un ciel bleu.', 'blue'],
      ['She paints a yellow sun.', '🟡', 'Pinta un sol amarillo.', 'Ela pinta um sol amarelo.', 'Elle peint un soleil jaune.', 'yellow'],
      ['She paints green grass.', '🟢', 'Pinta pasto verde.', 'Ela pinta grama verde.', "Elle peint de l'herbe verte.", 'green'],
      ['Look! A big rainbow!', '🌈', '¡Mira! ¡Un gran arcoíris!', 'Olha! Um grande arco-íris!', 'Regarde ! Un grand arc-en-ciel !', 'rainbow'],
    ],
  },
  numbers: {
    title: { en: 'Ziggy Counts', es: 'Ziggy cuenta', pt: 'O Ziggy conta', fr: 'Ziggy compte' },
    lines: [
      ['Ziggy sees one cat.', '🐱', 'Ziggy ve un gato.', 'O Ziggy vê um gato.', 'Ziggy voit un chat.', 'one'],
      ['Now he sees two birds.', '🐦', 'Ahora ve dos pájaros.', 'Agora ele vê dois pássaros.', 'Maintenant, il voit deux oiseaux.', 'two'],
      ['Three fish swim by.', '🐟', 'Pasan nadando tres peces.', 'Três peixes passam nadando.', 'Trois poissons passent en nageant.', 'three'],
      ['Five stars shine at night.', '⭐', 'Cinco estrellas brillan de noche.', 'Cinco estrelas brilham à noite.', 'Cinq étoiles brillent la nuit.', 'five'],
      ['Ten friends say: Beep boop!', '🤖', 'Diez amigos dicen: ¡Bip bop!', 'Dez amigos dizem: Bip bop!', 'Dix amis disent : bip boup !', 'ten'],
    ],
  },
  farm: {
    title: { en: 'Morning on the Farm', es: 'Mañana en la granja', pt: 'Manhã na fazenda', fr: 'Le matin à la ferme' },
    lines: [
      ['The cow says moo.', '🐮', 'La vaca dice mu.', 'A vaca faz mu.', 'La vache fait meuh.', 'cow'],
      ['The duck swims in the pond.', '🦆', 'El pato nada en el estanque.', 'O pato nada no lago.', 'Le canard nage dans la mare.', 'duck'],
      ['The pig plays in the mud.', '🐷', 'El cerdo juega en el lodo.', 'O porco brinca na lama.', 'Le cochon joue dans la boue.', 'pig'],
      ['The horse runs fast.', '🐴', 'El caballo corre rápido.', 'O cavalo corre rápido.', 'Le cheval court vite.', 'horse'],
      ['The dog wants to play!', '🐶', '¡El perro quiere jugar!', 'O cachorro quer brincar!', 'Le chien veut jouer !', 'dog'],
    ],
  },
  fruits: {
    title: { en: "Coco's Fruit Salad", es: 'La ensalada de frutas de Coco', pt: 'A salada de frutas do Coco', fr: 'La salade de fruits de Coco' },
    lines: [
      ['Coco cuts a red apple.', '🍎', 'Coco corta una manzana roja.', 'O Coco corta uma maçã vermelha.', 'Coco coupe une pomme rouge.', 'apple'],
      ['He adds a yellow banana.', '🍌', 'Agrega un plátano amarillo.', 'Ele coloca uma banana amarela.', 'Il ajoute une banane jaune.', 'banana'],
      ['Then some sweet grapes.', '🍇', 'Luego unas uvas dulces.', 'Depois umas uvas doces.', 'Puis du raisin sucré.', 'grapes'],
      ['And a big strawberry.', '🍓', 'Y una fresa grande.', 'E um morango grande.', 'Et une grosse fraise.', 'strawberry'],
      ['We share a big watermelon!', '🍉', '¡Compartimos una sandía grande!', 'Nós dividimos uma melancia grande!', 'On partage une grosse pastèque !', 'watermelon'],
    ],
  },
  family: {
    title: { en: "Grandma's Visit", es: 'La visita de la abuela', pt: 'A visita da vovó', fr: 'La visite de mamie' },
    lines: [
      ['Grandma comes to our home.', '👵', 'La abuela viene a casa.', 'A vovó vem para casa.', 'Mamie vient chez nous.', 'grandma'],
      ['Mom makes a big cake.', '👩', 'Mamá hace un pastel grande.', 'A mamãe faz um bolo grande.', 'Maman fait un grand gâteau.', 'mom'],
      ['Dad plays with the baby.', '👨', 'Papá juega con el bebé.', 'O papai brinca com o bebê.', 'Papa joue avec le bébé.', 'dad'],
      ['My brother gives Grandma a kiss.', '😘', 'Mi hermano le da un beso a la abuela.', 'Meu irmão dá um beijo na vovó.', 'Mon frère fait un bisou à mamie.', 'kiss'],
      ['We all have a family hug!', '🤗', '¡Todos nos damos un abrazo!', 'Todos damos um abraço em família!', 'On se fait tous un câlin en famille !', 'hug'],
    ],
  },
  body: {
    title: { en: "Rafa's Warm-Up", es: 'El calentamiento de Rafa', pt: 'O aquecimento do Rafa', fr: "L'échauffement de Rafa" },
    lines: [
      ['Rafa raises his arms.', '💪', 'Rafa levanta los brazos.', 'O Rafa levanta os braços.', 'Rafa lève les bras.', 'arm'],
      ['He shakes his hands.', '✋', 'Sacude las manos.', 'Ele balança as mãos.', 'Il secoue les mains.', 'hand'],
      ['He stands on one foot.', '🦶', 'Se para en un pie.', 'Ele fica num pé só.', 'Il tient sur un pied.', 'foot'],
      ['He touches his nose.', '👃', 'Se toca la nariz.', 'Ele toca o nariz.', 'Il touche son nez.', 'nose'],
      ['Great! Now smile with your mouth!', '👄', '¡Genial! ¡Ahora sonríe con la boca!', 'Ótimo! Agora sorria com a boca!', 'Super ! Maintenant, souris avec ta bouche !', 'mouth'],
    ],
  },
  toys: {
    title: { en: 'The Toy Party', es: 'La fiesta de juguetes', pt: 'A festa dos brinquedos', fr: 'La fête des jouets' },
    lines: [
      ['Teddy bear has a party.', '🧸', 'El osito tiene una fiesta.', 'O ursinho faz uma festa.', 'Nounours fait une fête.', 'teddy bear'],
      ['The robot brings a balloon.', '🎈', 'El robot trae un globo.', 'O robô traz um balão.', 'Le robot apporte un ballon.', 'balloon'],
      ['The doll brings a gift.', '🎁', 'La muñeca trae un regalo.', 'A boneca traz um presente.', 'La poupée apporte un cadeau.', 'gift'],
      ['They play with a ball.', '🏐', 'Juegan con una pelota.', 'Eles brincam com uma bola.', 'Ils jouent avec une balle.', 'ball'],
      ['What a fun party!', '🎉', '¡Qué fiesta tan divertida!', 'Que festa divertida!', 'Quelle fête amusante !', 'party'],
    ],
  },
  food: {
    title: { en: 'Lunch Time', es: 'La hora de comer', pt: 'Hora do almoço', fr: "L'heure du repas" },
    lines: [
      ['I want soup and bread.', '🍲', 'Quiero sopa y pan.', 'Eu quero sopa e pão.', 'Je veux de la soupe et du pain.', 'soup'],
      ['Mom gives me rice and meat.', '🍚', 'Mamá me da arroz y carne.', 'A mamãe me dá arroz e carne.', 'Maman me donne du riz et de la viande.', 'rice'],
      ['I drink a glass of milk.', '🥛', 'Tomo un vaso de leche.', 'Eu bebo um copo de leite.', 'Je bois un verre de lait.', 'milk'],
      ['For dessert, ice cream!', '🍦', '¡De postre, helado!', 'De sobremesa, sorvete!', 'Pour le dessert, une glace !', 'ice cream'],
      ['Tomorrow we eat pizza!', '🍕', '¡Mañana comemos pizza!', 'Amanhã comemos pizza!', 'Demain, on mange de la pizza !', 'pizza'],
    ],
  },
  clothes: {
    title: { en: 'Getting Dressed', es: 'A vestirse', pt: 'Hora de se vestir', fr: "On s'habille" },
    lines: [
      ['It is cold. I put on my coat.', '🧥', 'Hace frío. Me pongo el abrigo.', 'Está frio. Eu visto o casaco.', 'Il fait froid. Je mets mon manteau.', 'coat'],
      ['I wear a warm scarf.', '🧣', 'Uso una bufanda calientita.', 'Eu uso um cachecol quentinho.', 'Je porte une écharpe chaude.', 'scarf'],
      ['I put on my socks and boots.', '👢', 'Me pongo los calcetines y las botas.', 'Eu calço as meias e as botas.', 'Je mets mes chaussettes et mes bottes.', 'boots'],
      ['My gloves are blue.', '🧤', 'Mis guantes son azules.', 'Minhas luvas são azuis.', 'Mes gants sont bleus.', 'gloves'],
      ['And a hat! I am ready!', '🎩', '¡Y un sombrero! ¡Estoy listo!', 'E um chapéu! Estou pronto!', 'Et un chapeau ! Je suis prêt !', 'hat'],
    ],
  },
  home: {
    title: { en: 'Bedtime at Home', es: 'Hora de dormir', pt: 'Hora de dormir', fr: "L'heure du dodo" },
    lines: [
      ['I open the door of my house.', '🚪', 'Abro la puerta de mi casa.', 'Eu abro a porta da minha casa.', "J'ouvre la porte de ma maison.", 'door'],
      ['I take a shower.', '🚿', 'Me doy una ducha.', 'Eu tomo um banho de chuveiro.', 'Je prends une douche.', 'shower'],
      ['I look in the mirror.', '🪞', 'Me miro en el espejo.', 'Eu me olho no espelho.', 'Je me regarde dans le miroir.', 'mirror'],
      ['I turn off the light.', '💡', 'Apago la luz.', 'Eu apago a luz.', "J'éteins la lumière.", 'light'],
      ['Good night, bed!', '🛏️', '¡Buenas noches, cama!', 'Boa noite, cama!', 'Bonne nuit, mon lit !', 'bed'],
    ],
  },
  school: {
    title: { en: 'A Day at School', es: 'Un día en la escuela', pt: 'Um dia na escola', fr: "Une journée à l'école" },
    lines: [
      ['I go to school with my backpack.', '🎒', 'Voy a la escuela con mi mochila.', 'Eu vou para a escola com a minha mochila.', "Je vais à l'école avec mon sac à dos.", 'backpack'],
      ['The teacher says good morning.', '👩‍🏫', 'La maestra dice buenos días.', 'A professora diz bom dia.', "L'enseignante dit bonjour.", 'teacher'],
      ['I draw with a crayon.', '🖍️', 'Dibujo con un crayón.', 'Eu desenho com um giz de cera.', 'Je dessine avec un crayon de cire.', 'crayon'],
      ['I read a book.', '📕', 'Leo un libro.', 'Eu leio um livro.', 'Je lis un livre.', 'book'],
      ['I cut paper with scissors.', '✂️', 'Corto papel con tijeras.', 'Eu corto papel com a tesoura.', 'Je coupe du papier avec des ciseaux.', 'scissors'],
    ],
  },
  wild: {
    title: { en: 'Safari Trip', es: 'Viaje de safari', pt: 'Viagem de safári', fr: 'En safari' },
    lines: [
      ['Bolt sees a big lion.', '🦁', 'Bolt ve un león grande.', 'O Bolt vê um leão grande.', 'Bolt voit un grand lion.', 'lion'],
      ['A giraffe eats leaves.', '🦒', 'Una jirafa come hojas.', 'Uma girafa come folhas.', 'Une girafe mange des feuilles.', 'giraffe'],
      ['The monkey jumps in a tree.', '🐵', 'El mono salta en un árbol.', 'O macaco pula numa árvore.', 'Le singe saute dans un arbre.', 'monkey'],
      ['The elephant drinks water.', '🐘', 'El elefante toma agua.', 'O elefante bebe água.', "L'éléphant boit de l'eau.", 'elephant'],
      ['Shh! The tiger is sleeping.', '🐯', '¡Shh! El tigre está durmiendo.', 'Psiu! O tigre está dormindo.', 'Chut ! Le tigre dort.', 'tiger'],
    ],
  },
  sea: {
    title: { en: 'Mara Dives Down', es: 'Mara se sumerge', pt: 'A Mara mergulha', fr: 'Mara plonge' },
    lines: [
      ['Mara jumps over a wave.', '🌊', 'Mara salta sobre una ola.', 'A Mara pula uma onda.', 'Mara saute par-dessus une vague.', 'wave'],
      ['She sees a happy dolphin.', '🐬', 'Ve un delfín feliz.', 'Ela vê um golfinho feliz.', 'Elle voit un dauphin joyeux.', 'dolphin'],
      ['An octopus waves hello.', '🐙', 'Un pulpo la saluda.', 'Um polvo dá oi.', 'Une pieuvre lui fait coucou.', 'octopus'],
      ['A crab hides in a shell.', '🦀', 'Un cangrejo se esconde en una concha.', 'Um caranguejo se esconde numa concha.', 'Un crabe se cache dans un coquillage.', 'crab'],
      ['A big whale sings a song.', '🐳', 'Una ballena grande canta una canción.', 'Uma baleia grande canta uma canção.', 'Une grande baleine chante une chanson.', 'whale'],
    ],
  },
  weather: {
    title: { en: "Nubi's Weather Week", es: 'La semana del clima de Nubi', pt: 'A semana do tempo da Nubi', fr: 'La semaine météo de Nubi' },
    lines: [
      ['On Monday, the sun is hot.', '☀️', 'El lunes, el sol está caliente.', 'Na segunda, o sol está quente.', 'Lundi, le soleil est chaud.', 'sun'],
      ['On Tuesday, there is a lot of wind.', '💨', 'El martes hay mucho viento.', 'Na terça, venta muito.', 'Mardi, il y a beaucoup de vent.', 'wind'],
      ['On Wednesday, there is rain.', '🌧️', 'El miércoles llueve.', 'Na quarta, chove.', 'Mercredi, il pleut.', 'rain'],
      ['On Thursday, I use my umbrella.', '☂️', 'El jueves uso mi paraguas.', 'Na quinta, eu uso meu guarda-chuva.', 'Jeudi, je prends mon parapluie.', 'umbrella'],
      ['On Friday, we make a snowman!', '⛄', '¡El viernes hacemos un muñeco de nieve!', 'Na sexta, fazemos um boneco de neve!', 'Vendredi, on fait un bonhomme de neige !', 'snowman'],
    ],
  },
  nature: {
    title: { en: 'A Walk in the Forest', es: 'Un paseo por el bosque', pt: 'Um passeio na floresta', fr: 'Une balade en forêt' },
    lines: [
      ['We walk in the forest.', '🌲', 'Caminamos por el bosque.', 'Nós andamos na floresta.', 'On se promène dans la forêt.', 'forest'],
      ['A butterfly flies by.', '🦋', 'Pasa volando una mariposa.', 'Uma borboleta passa voando.', 'Un papillon passe en volant.', 'butterfly'],
      ['Ants carry a leaf.', '🍃', 'Las hormigas cargan una hoja.', 'As formigas carregam uma folha.', 'Des fourmis portent une feuille.', 'leaf'],
      ['A snail is very slow.', '🐌', 'Un caracol es muy lento.', 'Um caracol é muito lento.', 'Un escargot est très lent.', 'snail'],
      ['We see a big mountain.', '⛰️', 'Vemos una montaña grande.', 'Nós vemos uma montanha grande.', 'On voit une grande montagne.', 'mountain'],
    ],
  },
  garden: {
    title: { en: "Coco's Garden", es: 'El huerto de Coco', pt: 'A horta do Coco', fr: 'Le potager de Coco' },
    lines: [
      ['Coco plants a carrot.', '🥕', 'Coco siembra una zanahoria.', 'O Coco planta uma cenoura.', 'Coco plante une carotte.', 'carrot'],
      ['The tomato is red and round.', '🍅', 'El tomate es rojo y redondo.', 'O tomate é vermelho e redondo.', 'La tomate est rouge et ronde.', 'tomato'],
      ['The corn is very tall.', '🌽', 'El maíz es muy alto.', 'O milho é muito alto.', 'Le maïs est très haut.', 'corn'],
      ['A big pumpkin grows.', '🎃', 'Crece una calabaza grande.', 'Uma abóbora grande cresce.', 'Une grosse citrouille pousse.', 'pumpkin'],
      ["Let's make a salad!", '🥗', '¡Hagamos una ensalada!', 'Vamos fazer uma salada!', 'Faisons une salade !', 'salad'],
    ],
  },
  transport: {
    title: { en: 'Going to the City', es: 'Vamos a la ciudad', pt: 'Indo para a cidade', fr: 'En route pour la ville' },
    lines: [
      ['We take the bus.', '🚌', 'Tomamos el autobús.', 'Nós pegamos o ônibus.', "On prend l'autobus.", 'bus'],
      ['A red car goes fast.', '🚗', 'Un carro rojo va rápido.', 'Um carro vermelho vai rápido.', 'Une voiture rouge va vite.', 'car'],
      ['The train goes choo choo!', '🚂', '¡El tren hace chu chu!', 'O trem faz piuí!', 'Le train fait tchou tchou !', 'train'],
      ['A plane flies in the sky.', '✈️', 'Un avión vuela en el cielo.', 'Um avião voa no céu.', 'Un avion vole dans le ciel.', 'plane'],
      ['I ride my bike home.', '🚲', 'Regreso a casa en bicicleta.', 'Eu volto para casa de bicicleta.', 'Je rentre à la maison à vélo.', 'bike'],
    ],
  },
  actions: {
    title: { en: 'The Animal Games', es: 'Los juegos de los animales', pt: 'Os jogos dos animais', fr: 'Les jeux des animaux' },
    lines: [
      ['The rabbit can jump high.', '🐰', 'El conejo puede saltar alto.', 'O coelho pode pular alto.', 'Le lapin sait sauter haut.', 'jump'],
      ['The fish can swim fast.', '🐟', 'El pez puede nadar rápido.', 'O peixe pode nadar rápido.', 'Le poisson sait nager vite.', 'swim'],
      ['The bird can fly far.', '🐦', 'El pájaro puede volar lejos.', 'O pássaro pode voar longe.', "L'oiseau sait voler loin.", 'fly'],
      ['The monkey can climb.', '🐵', 'El mono puede escalar.', 'O macaco pode escalar.', 'Le singe sait grimper.', 'climb'],
      ['And I can dance!', '💃', '¡Y yo puedo bailar!', 'E eu posso dançar!', 'Et moi, je sais danser !', 'dance'],
    ],
  },
  sports: {
    title: { en: 'The Big Game', es: 'El gran partido', pt: 'O grande jogo', fr: 'Le grand match' },
    lines: [
      ['Today we play soccer.', '⚽', 'Hoy jugamos fútbol.', 'Hoje jogamos futebol.', "Aujourd'hui, on joue au football.", 'soccer'],
      ['Rafa kicks and... goal!', '🥅', 'Rafa patea y... ¡gol!', 'O Rafa chuta e... gol!', 'Rafa tire et… but !', 'goal'],
      ['Our team wins a medal.', '🏅', 'Nuestro equipo gana una medalla.', 'Nosso time ganha uma medalha.', 'Notre équipe gagne une médaille.', 'medal'],
      ['We hold a gold trophy.', '🏆', 'Levantamos un trofeo dorado.', 'Levantamos um troféu dourado.', 'On tient un trophée doré.', 'trophy'],
      ['Tomorrow we play tennis!', '🎾', '¡Mañana jugamos tenis!', 'Amanhã jogamos tênis!', 'Demain, on joue au tennis !', 'tennis'],
    ],
  },
  music: {
    title: { en: 'The Little Band', es: 'La pequeña banda', pt: 'A pequena banda', fr: 'Le petit orchestre' },
    lines: [
      ['Pip plays the guitar.', '🎸', 'Pip toca la guitarra.', 'A Pip toca violão.', 'Pip joue de la guitare.', 'guitar'],
      ['Ziggy plays the drum.', '🥁', 'Ziggy toca el tambor.', 'O Ziggy toca tambor.', 'Ziggy joue du tambour.', 'drum'],
      ['Luna plays the piano.', '🎹', 'Luna toca el piano.', 'A Luna toca piano.', 'Luna joue du piano.', 'piano'],
      ['Bolt sings into the microphone.', '🎤', 'Bolt canta con el micrófono.', 'O Bolt canta no microfone.', 'Bolt chante dans le micro.', 'microphone'],
      ['Everyone loves the music!', '🎵', '¡A todos les encanta la música!', 'Todo mundo ama a música!', 'Tout le monde adore la musique !', 'music'],
    ],
  },
  shapes: {
    title: { en: "Ziggy's Shape Hunt", es: 'Ziggy busca formas', pt: 'O Ziggy caça formas', fr: 'La chasse aux formes de Ziggy' },
    lines: [
      ['The sun is a big circle.', '☀️', 'El sol es un círculo grande.', 'O sol é um círculo grande.', 'Le soleil est un grand cercle.', 'circle'],
      ['The window is a square.', '🪟', 'La ventana es un cuadrado.', 'A janela é um quadrado.', 'La fenêtre est un carré.', 'square'],
      ['The pizza slice is a triangle.', '🍕', 'La rebanada de pizza es un triángulo.', 'A fatia de pizza é um triângulo.', 'La part de pizza est un triangle.', 'triangle'],
      ['The kite is a diamond.', '🪁', 'La cometa es un rombo.', 'A pipa é um losango.', 'Le cerf-volant est un losange.', 'diamond'],
      ['I love you! Here is a heart.', '♥️', '¡Te quiero! Aquí tienes un corazón.', 'Eu te amo! Aqui está um coração.', "Je t'aime ! Voici un cœur.", 'heart'],
    ],
  },
  time: {
    title: { en: 'My Day', es: 'Mi día', pt: 'O meu dia', fr: 'Ma journée' },
    lines: [
      ['In the morning, I wake up.', '🌅', 'En la mañana, me despierto.', 'De manhã, eu acordo.', 'Le matin, je me réveille.', 'morning'],
      ['I eat breakfast.', '🥞', 'Desayuno.', 'Eu tomo café da manhã.', 'Je prends mon petit-déjeuner.', 'breakfast'],
      ['At noon, I eat lunch.', '🍱', 'Al mediodía, almuerzo.', 'Ao meio-dia, eu almoço.', 'À midi, je mange.', 'lunch'],
      ['In the afternoon, I play.', '🌇', 'En la tarde, juego.', 'À tarde, eu brinco.', "L'après-midi, je joue.", 'afternoon'],
      ['At night, I sleep. Good night!', '🌃', 'En la noche, duermo. ¡Buenas noches!', 'À noite, eu durmo. Boa noite!', 'La nuit, je dors. Bonne nuit !', 'night'],
    ],
  },
  jobs: {
    title: { en: 'What Will I Be?', es: '¿Qué voy a ser?', pt: 'O que eu vou ser?', fr: "Qu'est-ce que je serai ?" },
    lines: [
      ['Maybe a doctor who helps people.', '👩‍⚕️', 'Tal vez una doctora que ayuda a la gente.', 'Talvez uma médica que ajuda as pessoas.', 'Peut-être médecin, pour aider les gens.', 'doctor'],
      ['Maybe a brave firefighter.', '👩‍🚒', 'Tal vez una bombera valiente.', 'Talvez uma bombeira corajosa.', 'Peut-être une pompière courageuse.', 'firefighter'],
      ['Maybe an astronaut in space.', '👩‍🚀', 'Tal vez una astronauta en el espacio.', 'Talvez uma astronauta no espaço.', "Peut-être astronaute dans l'espace.", 'astronaut'],
      ['Maybe a chef who cooks pizza.', '👨‍🍳', 'Tal vez un chef que cocina pizza.', 'Talvez um chef que faz pizza.', 'Peut-être chef, pour cuisiner des pizzas.', 'chef'],
      ['Or a superhero! I can be anything!', '🦸', '¡O un superhéroe! ¡Puedo ser lo que quiera!', 'Ou um super-herói! Eu posso ser o que quiser!', 'Ou un super-héros ! Je peux tout devenir !', 'superhero'],
    ],
  },
  places: {
    title: { en: "Mara's City Tour", es: 'El paseo de Mara', pt: 'O passeio da Mara', fr: 'La visite de Mara en ville' },
    lines: [
      ['First, we go to the park.', '🏞️', 'Primero vamos al parque.', 'Primeiro, vamos ao parque.', "D'abord, on va au parc.", 'park'],
      ['Then we visit the zoo.', '🦓', 'Luego visitamos el zoológico.', 'Depois visitamos o zoológico.', 'Puis on visite le zoo.', 'zoo'],
      ['We read at the library.', '📚', 'Leemos en la biblioteca.', 'Nós lemos na biblioteca.', 'On lit à la bibliothèque.', 'library'],
      ['We eat at a restaurant.', '🍽️', 'Comemos en un restaurante.', 'Nós comemos num restaurante.', 'On mange au restaurant.', 'restaurant'],
      ['We sleep in a hotel.', '🏨', 'Dormimos en un hotel.', 'Nós dormimos num hotel.', "On dort à l'hôtel.", 'hotel'],
    ],
  },
  fantasy: {
    title: { en: "The Dragon's Treasure", es: 'El tesoro del dragón', pt: 'O tesouro do dragão', fr: 'Le trésor du dragon' },
    lines: [
      ['A little dragon finds a map.', '🗺️', 'Un dragoncito encuentra un mapa.', 'Um dragãozinho encontra um mapa.', 'Un petit dragon trouve une carte.', 'map'],
      ['A fairy shows the way.', '🧚', 'Un hada le muestra el camino.', 'Uma fada mostra o caminho.', 'Une fée montre le chemin.', 'fairy'],
      ['A friendly ghost says boo!', '👻', '¡Un fantasma amigable dice bu!', 'Um fantasma amigo diz bu!', 'Un gentil fantôme dit bouh !', 'ghost'],
      ['A wizard opens a door.', '🧙', 'Un mago abre una puerta.', 'Um mago abre uma porta.', 'Un magicien ouvre une porte.', 'wizard'],
      ['They find the treasure!', '💎', '¡Encuentran el tesoro!', 'Eles encontram o tesouro!', 'Ils trouvent le trésor !', 'treasure'],
    ],
  },
  countries: {
    title: { en: 'Kiki Flies Around the World', es: 'Kiki vuela por el mundo', pt: 'O Kiki voa pelo mundo', fr: 'Kiki fait le tour du monde' },
    lines: [
      ['Kiki starts in Mexico.', '🇲🇽', 'Kiki empieza en México.', 'O Kiki começa no México.', 'Kiki commence au Mexique.', 'Mexico'],
      ['He flies to Brazil.', '🇧🇷', 'Vuela a Brasil.', 'Ele voa para o Brasil.', "Il vole jusqu'au Brésil.", 'Brazil'],
      ['He eats pizza in Italy.', '🇮🇹', 'Come pizza en Italia.', 'Ele come pizza na Itália.', 'Il mange une pizza en Italie.', 'Italy'],
      ['He sees snow in Canada.', '🇨🇦', 'Ve nieve en Canadá.', 'Ele vê neve no Canadá.', 'Il voit de la neige au Canada.', 'Canada'],
      ['He says hello in Japan.', '🇯🇵', 'Dice hola en Japón.', 'Ele diz olá no Japão.', 'Il dit bonjour au Japon.', 'Japan'],
    ],
  },
  birds: {
    title: { en: 'The Bird Concert', es: 'El concierto de los pájaros', pt: 'O concerto dos pássaros', fr: 'Le concert des oiseaux' },
    lines: [
      ['The parrot sings first.', '🦜', 'El loro canta primero.', 'O papagaio canta primeiro.', 'Le perroquet chante en premier.', 'parrot'],
      ['The rooster says cock-a-doodle-doo!', '🐓', '¡El gallo dice quiquiriquí!', 'O galo faz cocoricó!', 'Le coq fait cocorico !', 'rooster'],
      ['The cricket plays music at night.', '🦗', 'El grillo toca música de noche.', 'O grilo toca música à noite.', 'Le grillon joue de la musique la nuit.', 'cricket'],
      ['The peacock shows its feathers.', '🦚', 'El pavo real muestra sus plumas.', 'O pavão mostra suas penas.', 'Le paon montre ses plumes.', 'peacock'],
      ['The eagle flies over everyone.', '🦅', 'El águila vuela sobre todos.', 'A águia voa sobre todos.', "L'aigle vole au-dessus de tout le monde.", 'eagle'],
    ],
  },
  sweets: {
    title: { en: 'The Sweet Shop', es: 'La dulcería', pt: 'A doceria', fr: 'La confiserie' },
    lines: [
      ['Coco makes a pink donut.', '🍩', 'Coco hace una dona rosa.', 'O Coco faz uma rosquinha rosa.', 'Coco fait un beignet rose.', 'donut'],
      ['He melts some chocolate.', '🍫', 'Derrite un poco de chocolate.', 'Ele derrete um pouco de chocolate.', 'Il fait fondre du chocolat.', 'chocolate'],
      ['The popcorn goes pop!', '🍿', '¡Las palomitas hacen pop!', 'A pipoca faz pop!', 'Le pop-corn fait pop !', 'popcorn'],
      ['A child buys a lollipop.', '🍭', 'Un niño compra una paleta.', 'Uma criança compra um pirulito.', 'Un enfant achète une sucette.', 'lollipop'],
      ['Share a cupcake with a friend!', '🧁', '¡Comparte un pastelito con un amigo!', 'Divida um cupcake com um amigo!', 'Partage un petit gâteau avec un ami !', 'cupcake'],
    ],
  },
  kitchen: {
    title: { en: 'Helping in the Kitchen', es: 'Ayudo en la cocina', pt: 'Ajudando na cozinha', fr: "J'aide à la cuisine" },
    lines: [
      ['I put the plates on the table.', '🍽️', 'Pongo los platos en la mesa.', 'Eu coloco os pratos na mesa.', 'Je mets les assiettes sur la table.', 'plate'],
      ['A fork and a spoon for everyone.', '🥄', 'Un tenedor y una cuchara para todos.', 'Um garfo e uma colher para todos.', 'Une fourchette et une cuillère pour chacun.', 'spoon'],
      ['Grandpa makes tea in the teapot.', '🫖', 'El abuelo prepara té en la tetera.', 'O vovô faz chá no bule.', 'Papi fait du thé dans la théière.', 'teapot'],
      ['I pour milk into a glass.', '🥃', 'Sirvo leche en un vaso.', 'Eu coloco leite no copo.', 'Je verse du lait dans un verre.', 'glass'],
      ['We eat noodles with chopsticks!', '🥢', '¡Comemos fideos con palillos!', 'Comemos macarrão com hashis!', 'On mange des nouilles avec des baguettes !', 'chopsticks'],
    ],
  },
  health: {
    title: { en: 'Staying Healthy', es: 'Me mantengo sano', pt: 'Ficando saudável', fr: 'Je reste en forme' },
    lines: [
      ['I wash my hands with soap.', '🧼', 'Me lavo las manos con jabón.', 'Eu lavo as mãos com sabonete.', 'Je me lave les mains avec du savon.', 'soap'],
      ['I brush my teeth with my toothbrush.', '🪥', 'Me lavo los dientes con mi cepillo.', 'Eu escovo os dentes com a minha escova.', 'Je me brosse les dents avec ma brosse à dents.', 'toothbrush'],
      ['Achoo! I sneeze into my arm.', '🤧', '¡Achís! Estornudo en mi brazo.', 'Atchim! Eu espirro no braço.', "Atchoum ! J'éternue dans mon coude.", 'sneeze'],
      ['A bandage helps my knee.', '🩹', 'Una curita ayuda a mi rodilla.', 'Um curativo ajuda o meu joelho.', 'Un pansement soigne mon genou.', 'bandage'],
      ['I do exercise every day.', '🏋️', 'Hago ejercicio todos los días.', 'Eu faço exercício todo dia.', "Je fais de l'exercice tous les jours.", 'exercise'],
    ],
  },
  tools: {
    title: { en: 'Bruno Builds a Treehouse', es: 'Bruno construye una casita', pt: 'O Bruno constrói uma casinha', fr: 'Bruno construit une cabane' },
    lines: [
      ['Bruno opens his toolbox.', '🧰', 'Bruno abre su caja de herramientas.', 'O Bruno abre sua caixa de ferramentas.', 'Bruno ouvre sa boîte à outils.', 'toolbox'],
      ['He cuts wood with a saw.', '🪚', 'Corta madera con un serrucho.', 'Ele corta madeira com um serrote.', 'Il coupe du bois avec une scie.', 'saw'],
      ['Bang, bang! goes the hammer.', '🔨', '¡Pum, pum! hace el martillo.', 'Pou, pou! faz o martelo.', 'Boum, boum ! fait le marteau.', 'hammer'],
      ['He climbs up the ladder.', '🪜', 'Sube por la escalera.', 'Ele sobe a escada.', "Il monte à l'échelle.", 'ladder'],
      ['He pulls up a bucket with a rope.', '🪣', 'Sube un balde con una cuerda.', 'Ele puxa um balde com uma corda.', 'Il remonte un seau avec une corde.', 'bucket'],
    ],
  },
  celebrations: {
    title: { en: 'A Year of Parties', es: 'Un año de fiestas', pt: 'Um ano de festas', fr: 'Une année de fêtes' },
    lines: [
      ['In December, we decorate the Christmas tree.', '🎄', 'En diciembre decoramos el árbol de Navidad.', 'Em dezembro, enfeitamos a árvore de Natal.', 'En décembre, on décore le sapin de Noël.', 'Christmas tree'],
      ['At New Year, we watch fireworks.', '🎆', 'En Año Nuevo vemos fuegos artificiales.', 'No Ano Novo, vemos fogos de artifício.', "Au Nouvel An, on regarde les feux d'artifice.", 'fireworks'],
      ['On my birthday, I hit the piñata.', '🪅', 'En mi cumpleaños le pego a la piñata.', 'No meu aniversário, eu bato na piñata.', 'À mon anniversaire, je tape sur la piñata.', 'piñata'],
      ['We light a candle.', '🕯️', 'Encendemos una vela.', 'Acendemos uma vela.', 'On allume une bougie.', 'candle'],
      ['Confetti everywhere! Hooray!', '🎊', '¡Confeti por todas partes! ¡Hurra!', 'Confete por todo lado! Viva!', 'Des confettis partout ! Hourra !', 'confetti'],
    ],
  },
  tech: {
    title: { en: 'The Little Inventor', es: 'El pequeño inventor', pt: 'O pequeno inventor', fr: 'Le petit inventeur' },
    lines: [
      ['Bruno has a new laptop.', '💻', 'Bruno tiene una laptop nueva.', 'O Bruno tem um laptop novo.', 'Bruno a un nouvel ordinateur portable.', 'laptop'],
      ['He types on the keyboard.', '⌨️', 'Escribe en el teclado.', 'Ele digita no teclado.', 'Il tape sur le clavier.', 'keyboard'],
      ['He puts a battery in the robot.', '🔋', 'Le pone una batería al robot.', 'Ele coloca uma bateria no robô.', 'Il met une pile dans le robot.', 'battery'],
      ['He looks with a magnifying glass.', '🔍', 'Mira con una lupa.', 'Ele olha com uma lupa.', 'Il regarde avec une loupe.', 'magnifying glass'],
      ['At night, they look at stars with a telescope.', '🔭', 'De noche miran las estrellas con un telescopio.', 'À noite, eles olham as estrelas com um telescópio.', 'La nuit, ils regardent les étoiles avec un télescope.', 'telescope'],
    ],
  },
  manners: {
    title: { en: 'The Magic Words', es: 'Las palabras mágicas', pt: 'As palavras mágicas', fr: 'Les mots magiques' },
    lines: [
      ['Pip wants a cookie. She says please.', '🥺', 'Pip quiere una galleta. Dice por favor.', 'A Pip quer um biscoito. Ela diz por favor.', "Pip veut un biscuit. Elle dit s'il te plaît.", 'please'],
      ['Grandma gives her one. Pip says thank you.', '🙏', 'La abuela le da una. Pip dice gracias.', 'A vovó dá um para ela. A Pip diz obrigada.', 'Mamie lui en donne un. Pip dit merci.', 'thank you'],
      ['Oops! Pip drops the milk. She says sorry.', '😔', '¡Uy! A Pip se le cae la leche. Dice perdón.', 'Ops! A Pip derruba o leite. Ela diz desculpa.', 'Oups\u00a0! Pip renverse le lait. Elle dit pardon.', 'sorry'],
      ["Grandma smiles and says: That's okay!", '👌', 'La abuela sonríe y dice: ¡Está bien!', 'A vovó sorri e diz: Tudo bem!', "Mamie sourit et dit\u00a0: D'accord, ce n'est rien\u00a0!", 'okay'],
      ['At night, Pip says good night to everyone.', '🌛', 'En la noche, Pip les dice buenas noches a todos.', 'À noite, a Pip diz boa noite para todos.', 'Le soir, Pip dit bonne nuit à tout le monde.', 'good night'],
    ],
  },
  routine: {
    title: { en: "Luna's Busy Day", es: 'El día ocupado de Luna', pt: 'O dia agitado da Luna', fr: 'La journée chargée de Luna' },
    lines: [
      ['Luna wakes up and stretches.', '🥱', 'Luna se despierta y se estira.', 'A Luna acorda e se espreguiça.', "Luna se réveille et s'étire.", 'wake up'],
      ['She gets dressed for school.', '👔', 'Se viste para ir a la escuela.', 'Ela se veste para a escola.', "Elle s'habille pour l'école.", 'get dressed'],
      ['She eats breakfast with her family.', '🥣', 'Desayuna con su familia.', 'Ela toma café da manhã com a família.', 'Elle prend son petit-déjeuner avec sa famille.', 'eat breakfast'],
      ['After school, she waters the plants.', '🪴', 'Después de la escuela, riega las plantas.', 'Depois da escola, ela rega as plantas.', "Après l'école, elle arrose les plantes.", 'water the plants'],
      ['At night, she reads a book and goes to bed.', '🛌', 'En la noche, lee un libro y se va a dormir.', 'À noite, ela lê um livro e vai para a cama.', 'Le soir, elle lit un livre et va au lit.', 'go to bed'],
    ],
  },
  shopping: {
    title: { en: 'Mara Goes Shopping', es: 'Mara va de compras', pt: 'A Mara vai às compras', fr: 'Mara fait les courses' },
    lines: [
      ['Mara writes a shopping list.', '📋', 'Mara escribe una lista de compras.', 'A Mara escreve uma lista de compras.', 'Mara écrit une liste de courses.', 'list'],
      ['At the store, she takes a cart.', '🛒', 'En la tienda, toma un carrito.', 'Na loja, ela pega um carrinho.', 'Au magasin, elle prend un chariot.', 'cart'],
      ['She puts bread and milk in the basket.', '🧺', 'Pone pan y leche en la canasta.', 'Ela coloca pão e leite na cesta.', 'Elle met du pain et du lait dans le panier.', 'basket'],
      ['The price is five dollars.', '🏷️', 'El precio es de cinco dólares.', 'O preço é cinco dólares.', 'Le prix est de cinq dollars.', 'price'],
      ['She pays with coins from her wallet.', '👛', 'Paga con monedas de su cartera.', 'Ela paga com moedas da carteira.', 'Elle paie avec des pièces de son portefeuille.', 'wallet'],
    ],
  },
  emotions: {
    title: { en: "Pip's Big Show", es: 'El gran show de Pip', pt: 'O grande show da Pip', fr: 'Le grand spectacle de Pip' },
    lines: [
      ['Today is the school show. Pip is excited!', '🤩', 'Hoy es el show de la escuela. ¡Pip está emocionada!', 'Hoje é o show da escola. A Pip está animada!', "Aujourd'hui, c'est le spectacle de l'école. Pip est enthousiaste\u00a0!", 'excited'],
      ['Before the show, she feels nervous.', '😬', 'Antes del show, se siente nerviosa.', 'Antes do show, ela fica nervosa.', 'Avant le spectacle, elle est nerveuse.', 'nervous'],
      ['Her friend Bolt is kind. He gives her a hug.', '🥰', 'Su amigo Bolt es amable. Le da un abrazo.', 'O amigo dela, Bolt, é gentil. Ele dá um abraço nela.', 'Son ami Bolt est gentil. Il lui fait un câlin.', 'kind'],
      ['Pip sings a silly song. Everyone laughs!', '🤪', 'Pip canta una canción chistosa. ¡Todos se ríen!', 'A Pip canta uma música engraçada. Todo mundo ri!', 'Pip chante une chanson rigolote. Tout le monde rit\u00a0!', 'silly'],
      ['After the show, Pip is sleepy and cheerful.', '😪', 'Después del show, Pip tiene sueño y está alegre.', 'Depois do show, a Pip está com sono e alegre.', 'Après le spectacle, Pip a sommeil et elle est joyeuse.', 'sleepy'],
    ],
  },
};
