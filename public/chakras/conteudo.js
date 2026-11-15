const data = [
['Mūlādhāra','Raiz e suporte','Base do tronco, na região do períneo','4 pétalas vermelhas, quadrado amarelo, elefante','Terra · Laṃ','Brahmā e Ḍākinī','A kuṇḍalinī é figurada como uma serpente enrolada na base.','Vermelho','Segurança, estabilidade e apoio','Sente os pés no chão e identifica um apoio concreto na tua vida.','1–13','#B95250',4],
['Svādhiṣṭhāna','A própria morada','Região genital, abaixo do umbigo','6 pétalas vermelhas, crescente lunar, makara (criatura aquática)','Água · Vaṃ','Viṣṇu e Rākiṇī','A região da água é branca no interior do lótus.','Laranja','Prazer, criatividade e emoções','Escolhe uma atividade criativa e faz uma versão só pelo prazer de experimentar.','14–18','#BC6A44',6],
['Maṇipūra','Cidade das joias','Região do umbigo','10 pétalas, lótus cor de nuvem de chuva, triângulo vermelho, carneiro','Fogo · Raṃ','Rudra e Lākinī','O triângulo marca a região do fogo no centro do lótus.','Amarelo','Iniciativa, autonomia e confiança','Escolhe uma decisão pendente e escreve o próximo passo que depende de ti.','19–21','#A17A33',10],
['Anāhata','Som não percutido','Região do coração, no peito','12 pétalas de tom avermelhado, dois triângulos sobrepostos, antílope','Ar · Yaṃ','Īśa e Kākinī','O nome evoca um som que surge sem o choque de dois objetos.','Verde','Compaixão, afeto e vínculo','Recorda um gesto de cuidado que recebeste e pensa em como retribuí-lo.','22–27','#4D8167',12],
['Viśuddha','Purificação','Região da garganta','16 pétalas, vogais sânscritas inscritas, círculo branco, elefante branco','Espaço ou éter · Haṃ','Sadāśiva e Śākinī','O círculo branco representa o domínio do espaço (ākāśa).','Azul','Expressão, voz e escuta','Formula algo que gostarias de dizer numa frase clara. Depois imagina a resposta da outra pessoa.','28–31','#407D9A',16],
['Ājñā','Ordem ou comando','Entre as sobrancelhas','2 pétalas brancas, com as sílabas Haṃ e Kṣaṃ','Mente (manas) · Oṃ','Hākinī e o liṅga chamado Itara','O texto associa a mente a este centro. As duas sílabas das pétalas distinguem-se do Oṃ central.','Índigo','Discernimento, intuição e atenção','Separa, numa situação recente, o que observaste da interpretação que fizeste.','31a–38','#6166A3',2],
['Sahasrāra','De mil pétalas','Coroa, no topo da cabeça','Lótus branco de mil pétalas com brilho lunar','Além dos cinco elementos · a ficha não fixa um bīja','União de Śiva e Śakti','O lótus coroa a subida da kuṇḍalinī e evoca a libertação espiritual no texto.','Violeta ou branco','Sentido, contemplação e ligação ao transcendente','Fica um minuto em silêncio e pergunta que valor queres pôr em prática hoje.','40–49, 51','#805F9E',24],
];

const deep=[
{
 purpose:'Criar uma base de segurança e estabilidade para lidar com as exigências do dia a dia.',
 states:['Dificuldade em criar rotinas ou em sentir que tens apoio.','Rotinas que dão estabilidade e margem para lidar com mudanças.','Apego à rotina ou à previsibilidade, mesmo quando já não ajudam.'],
 tools:[['Apoio físico · 2 min','Senta-te com os pés no chão. Nota o contacto dos pés e do assento. Repara em três pontos de apoio.'],['Rotina concreta · 5 min','Escolhe uma ação que te dá estabilidade. Define quando a vais fazer e o que te vai lembrar.']],
 prompts:'Que tipo de apoio me faria sentir mais preparado para esta semana?'
},
{
 purpose:'Dar espaço ao prazer, às emoções e à criatividade, respeitando os próprios limites.',
 states:['Pouco espaço para brincar, criar ou reparar no que dá prazer.','Liberdade para experimentar, reconhecer emoções e escolher como agir.','Procura de estímulo atrás de estímulo, com pouco tempo para perceber o que sentes.'],
 tools:[['Movimento livre · 3 min','Põe uma música. Experimenta mover os ombros, os braços ou as mãos. Nota o que te apetece repetir.'],['Diário breve · 5 min','Completa «Senti… quando…» e «O que me apetece experimentar é…». Vale uma ideia pequena.']],
 prompts:'Que atividade me dá prazer mesmo quando ninguém vê o resultado?'
},
{
 purpose:'Transformar intenção em ação e exercer a própria vontade com flexibilidade.',
 states:['Adiar decisões ou esperar repetidamente que outra pessoa escolha.','Tomar uma decisão, agir e ajustar o plano quando surgem novos dados.','Tentar controlar cada passo ou sentir que é preciso ganhar todas as discussões.'],
 tools:[['Passo mínimo · 5 min','Escolhe uma tarefa adiada. Define um primeiro gesto que consigas completar em cinco minutos e faz esse gesto.'],['Limite claro · 2 min','Experimenta em voz baixa: «Posso fazer isto até sexta. Para o restante, preciso de mais tempo.» Adapta ao teu caso.']],
 prompts:'Qual é a próxima decisão que posso tomar com a informação que já tenho?'
},
{
 purpose:'Cultivar vínculos, dar e receber cuidado e manter limites nas relações.',
 states:['Evitar pedir apoio ou manter distância mesmo quando apetece proximidade.','Aceitar ajuda e mostrar cuidado, mantendo espaço para as próprias necessidades.','Dar mais do que consegues sustentar ou assumir responsabilidade pelas emoções alheias.'],
 tools:[['Escuta em pares · 5 min','Deixa a outra pessoa terminar. Resume o que entendeste e pergunta se interpretaste bem.'],['Cuidado com limite · 3 min','Escreve um gesto de apoio que podes oferecer e a condição que o torna sustentável para ti.']],
 prompts:'De que forma posso cuidar de alguém e respeitar a minha disponibilidade?'
},
{
 purpose:'Dar forma ao que queres comunicar e criar espaço para ouvir a resposta.',
 states:['Engolir uma opinião ou deixar um pedido importante por fazer.','Falar com clareza, ajustar o tom e ouvir sem preparar logo a resposta.','Preencher silêncios ou monopolizar a conversa quando a outra pessoa quer falar.'],
 tools:[['Pedido em três frases · 4 min','Descreve o que aconteceu, diz o que precisas e termina com um pedido concreto. Lê-o em voz alta.'],['Som suave · 1 min','Se for confortável, entoa Haṃ baixinho numa expiração natural. Faz uma pausa e observa como ouves o som.']],
 prompts:'Que frase tornaria o meu pedido mais claro para quem o ouve?'
},
{
 purpose:'Treinar a atenção e reconhecer a diferença entre perceção, hipótese e imaginação.',
 states:['Saltar entre estímulos ou adotar a primeira explicação sem a examinar.','Manter a atenção e rever uma hipótese quando surge informação nova.','Ficar preso a interpretações ou tratar uma impressão forte como certeza.'],
 tools:[['Factos e hipóteses · 5 min','Divide uma folha em duas. Escreve o que observaste e o que inferiste. Acrescenta uma explicação possível.'],['Foco visual · 2 min','Olha para um objeto confortável de ver. Quando te distraíres, volta a um pormenor como a forma ou a cor.']],
 prompts:'Que parte do que penso vem de algo que vi ou ouvi diretamente?'
},
{
 purpose:'Explorar sentido, valores e pertença através da contemplação, da espiritualidade ou da reflexão.',
 states:['Dificuldade em ligar as escolhas do dia a algo que tenha significado pessoal.','Encontrar sentido e traduzi-lo em decisões e gestos quotidianos.','Usar ideias espirituais para adiar conversas, decisões ou responsabilidades concretas.'],
 tools:[['Silêncio breve · 2 min','Fica sentado num lugar tranquilo. Deixa a respiração seguir o ritmo habitual. Repara nos sons à tua volta.'],['Valor em ação · 5 min','Escolhe um valor, como generosidade ou justiça. Escreve um gesto concreto que o ponha em prática hoje.']],
 prompts:'Que gesto de hoje pode dar forma a um valor que quero viver?'
}
];

const contextos = [
  {
    simbolo: 'O quadrado representa a região da terra. No interior surge Laṃ, ligado ao elefante Airāvata. O texto descreve a kuṇḍalinī com três voltas e meia em torno do liṅga.',
    cenario: 'Uma mudança de horário desorganiza a tua semana. Podes ficar sem pontos de apoio, adaptar uma rotina ou tentar preservar todos os horários antigos.',
    metodo: 'Antes de pensar em toda a semana, experimenta o exercício dos pés no chão. Depois escolhe um ponto fixo que seja realista mesmo num dia cheio.',
    observar: 'Ao fim de dois dias, repara se cumpriste esse ponto fixo e o que o tornou mais fácil de repetir.'
  },
  {
    simbolo: 'O crescente pertence à região branca da água. O makara, criatura aquática da iconografia indiana, sustenta a figura associada a Vaṃ. O lótus exterior é descrito em tom vermelhão.',
    cenario: 'Tens meia hora livre. Podes preenchê-la por hábito, escolher algo de que realmente gostas ou saltar de estímulo em estímulo sem aproveitar nenhum.',
    metodo: 'Escolhe uma música, desenho ou gesto que te apeteça experimentar. Durante três minutos, muda apenas um pormenor e nota o que gostaste de fazer.',
    observar: 'Regista um momento em que houve prazer por experimentar, mesmo sem terminar ou mostrar o resultado.'
  },
  {
    simbolo: 'O lótus está na zona do umbigo e tem cor de nuvem de chuva. Dentro dele, um triângulo vermelho marca a região do fogo. Raṃ aparece associado a um carneiro.',
    cenario: 'Surge um projeto com várias decisões. Podes adiar o arranque, escolher uma ação reversível ou querer fechar todos os detalhes antes de começar.',
    metodo: 'Define uma decisão pequena, o tempo que vais dedicar-lhe e a informação que seria suficiente para a rever.',
    observar: 'Pergunta se houve uma ação concreta e se conseguiste mudar de plano quando apareceu um dado novo.'
  },
  {
    simbolo: 'O nome refere-se ao «som não percutido». O texto descreve o lótus como a flor avermelhada bandhūka. Os dois triângulos sobrepostos figuram a região do ar.',
    cenario: 'Um amigo pede ajuda num dia ocupado. Podes ignorar o pedido, oferecer uma ajuda possível ou aceitar mais do que consegues dar.',
    metodo: 'Escreve uma resposta que reconheça o pedido e diga com precisão o que consegues oferecer. Lê-a de novo para verificar se o limite ficou claro.',
    observar: 'Repara se a proposta foi possível de cumprir e se deixou espaço para a outra pessoa dizer do que precisava.'
  },
  {
    simbolo: 'As 16 pétalas recebem as vogais sânscritas. A figura circular e branca indica o espaço. O elefante branco surge associado a Haṃ.',
    cenario: 'Uma decisão num grupo deixa-te desconfortável. Podes ficar calado, formular uma observação e escutar, ou dominar a discussão.',
    metodo: 'Escreve três frases curtas. Descreve o facto, indica a necessidade e faz um pedido que a outra pessoa possa aceitar, recusar ou negociar.',
    observar: 'Repara se o pedido ficou concreto e se conseguiste retomar com as tuas palavras aquilo que ouviste.'
  },
  {
    simbolo: 'Haṃ e Kṣaṃ figuram nas duas pétalas brancas. Oṃ aparece ligado ao centro no texto. A associação com manas situa Ājñā para além da série dos cinco elementos.',
    cenario: 'Uma pessoa demora a responder. Podes saltar para uma conclusão, considerar várias explicações ou ficar a analisar a situação durante horas.',
    metodo: 'Faz duas colunas, «observei» e «interpretei». Escreve uma hipótese alternativa e identifica que informação ajudaria a escolher entre ambas.',
    observar: 'Repara se distinguiste o facto da interpretação e se foi possível suspender a conclusão por algum tempo.'
  },
  {
    simbolo: 'O lótus branco de mil pétalas culmina o percurso da kuṇḍalinī. A união de Śiva e Śakti é uma imagem de libertação no quadro espiritual do texto.',
    cenario: 'Queres dar mais espaço à generosidade. Podes deixar o valor sempre para mais tarde, aplicá-lo num gesto concreto ou refugiar-te na ideia sem enfrentar uma decisão.',
    metodo: 'Depois de um minuto em silêncio, escolhe um valor e uma ação que possas realizar no próprio dia. Procura uma ação pequena cujo resultado consigas observar.',
    observar: 'Ao fim do dia, identifica o gesto que houve e decide se o queres repetir ou adaptar.'
  }
];

const questions = [
 ['Qual é a localização simbólica de Ājñā?', ['Base do tronco','Entre as sobrancelhas','Centro do peito','Topo da cabeça'], 1,'Ājñā é o lótus de duas pétalas na região entre as sobrancelhas.'],
 ['Qual é o par associado a Svādhiṣṭhāna no texto?', ['Terra e quadrado','Ar e dois triângulos','Água e crescente lunar','Espaço e círculo'], 2,'A região da água é branca e contém um crescente lunar.'],
 ['Que sílaba acompanha a região do fogo em Maṇipūra?', ['Raṃ','Haṃ','Laṃ','Vaṃ'],0,'Raṃ aparece associado ao fogo, no interior do triângulo.'],
 ['Porque é que o coração aparece a verde no mapa?', ['Por causa do animal simbólico','Por causa da sílaba-semente','Por causa da forma das pétalas','Por convenção cromática moderna'],3,'A cor verde pertence à convenção moderna. Pūrṇānanda compara o lótus à flor avermelhada bandhūka.'],
 ['Qual destes exemplos ilustra Viśuddha em equilíbrio nesta leitura?', ['Fazer um pedido claro e ouvir a resposta','Ficar calado mesmo quando é preciso falar','Repetir o pedido sem dar espaço a ninguém','Usar uma opinião como se fosse um facto'],0,'O equilíbrio conjuga expressão clara e capacidade de escutar.'],
 ['Que ferramenta se trabalha no capítulo de Ājñā?', ['Listar pontos de apoio físico','Planear um gesto de cuidado','Distinguir observações de interpretações','Escolher um estímulo criativo'],2,'O exercício de duas colunas treina a distinção entre o que observaste e a interpretação que fizeste.'],
 ['O que distingue Sahasrāra na descrição de Pūrṇānanda?', ['O quadrado da terra','O lótus de mil pétalas na coroa','O círculo branco da garganta','O lótus sacral de seis pétalas'],1,'O lótus da coroa culmina o percurso dos seis centros.'],
 ['Que uso têm os estados «em falta», «em equilíbrio» e «em excesso» nesta apresentação?', ['Determinar a cor original de um chakra','Identificar órgãos associados aos chakras','Medir a atividade física de cada centro','Observar padrões de comportamento consoante o contexto'],3,'São categorias de reflexão inspiradas numa leitura contemporânea. O contexto muda a interpretação.'],
];
