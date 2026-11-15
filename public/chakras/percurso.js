const percurso = [
  {acao:'Encontrar apoio', frase:'O turno mudou. A Inês já tinha combinado ir buscar a filha à escola.', cena:'Antes de responder, senta-se, sente os pés no chão e olha para o horário. Confirma quem poderia ajudar se o turno se mantivesse.', pergunta:'Que apoio tens à mão antes de tomares uma decisão?', figura:'quadrado', forma:'Terra', petalas:4, som:'lam'},
  {acao:'Perceber o que sente', frase:'O primeiro impulso é dizer que está tudo bem. Logo a seguir, apetece-lhe responder a quente.', cena:'A Inês dá nome a duas coisas: está irritada com o aviso tardio e preocupada por poder falhar o combinado com a filha.', pergunta:'Que emoção te está a dar informação sobre o que importa?', figura:'crescente', forma:'Água', petalas:6, som:'vam'},
  {acao:'Escolher um primeiro passo', frase:'A Inês não consegue resolver toda a escala. Consegue propor uma troca.', cena:'Escreve uma alternativa que respeita a hora de saída. Se ninguém puder trocar, decide que vai pedir para rever a distribuição do turno.', pergunta:'O que podes fazer com a informação que já tens?', figura:'triangulo', forma:'Fogo', petalas:10, som:'ram'},
  {acao:'Considerar a outra pessoa', frase:'A colega também tem compromissos. A troca só funciona se houver margem dos dois lados.', cena:'A Inês pergunta que horários são possíveis para a colega e diz até onde consegue ajudar na semana seguinte.', pergunta:'Que gesto de cuidado cabe nos teus limites?', figura:'duplo', forma:'Ar', petalas:12, som:'yam'},
  {acao:'Dizer o que precisa', frase:'«Mudaram-me o turno. Preciso de sair às cinco. Consegues trocar comigo?»', cena:'A Inês espera pela resposta. Quando a colega diz que só pode trocar parte do turno, a Inês repete o que ouviu e pergunta como podem usar essa opção.', pergunta:'Como podes formular um pedido a que a outra pessoa consiga responder?', figura:'circulo', forma:'Espaço', petalas:16, som:'ham'},
  {acao:'Rever uma suposição', frase:'A Inês tinha lido o silêncio da chefia como uma recusa.', cena:'Separa o que aconteceu do que imaginou. O horário mudou e ainda ninguém respondeu. Confirma se a chefia viu a mensagem antes de tirar conclusões.', pergunta:'Que informação te faria rever a tua leitura?', figura:'dois', forma:'Mente', petalas:2, som:'om'},
  {acao:'Voltar ao que importa', frase:'A troca parcial resolve o dia. Para a próxima vez, a Inês quer poder confiar no horário combinado.', cena:'Sugere à equipa um prazo de aviso para alterações. O valor da previsibilidade torna-se um acordo que todos podem discutir e pôr em prática.', pergunta:'Que gesto faria o teu valor principal aparecer na prática?', figura:'coroa', forma:'Coroa', petalas:1000}
];

const glifos = {
  quadrado:'<rect x="76" y="76" width="88" height="88" rx="2"/>',
  crescente:'<path d="M159 91a45 45 0 1 0 0 58 38 38 0 0 1 0-58Z"/>',
  triangulo:'<path d="M120 165 69 79h102Z"/>',
  duplo:'<path d="M120 68 73 151h94Z M120 172 73 89h94Z"/>',
  circulo:'<circle cx="120" cy="120" r="44"/>',
  dois:'<ellipse cx="91" cy="120" rx="28" ry="19"/><ellipse cx="149" cy="120" rx="28" ry="19"/>',
  coroa:'<circle cx="120" cy="120" r="25"/><circle cx="120" cy="120" r="43"/><circle cx="120" cy="120" r="59"/>'
};
function glyph(step){
  const count=step.petalas===1000?32:step.petalas;
  const petals=Array.from({length:count},(_,i)=>{
    const angle=i*360/count;
    return `<ellipse cx="120" cy="35" rx="${count>20?5:10}" ry="17" transform="rotate(${angle} 120 120)"/>`;
  }).join('');
  return `<svg class="symbol-art" viewBox="0 0 240 240" role="img" aria-label="${step.forma}. Lótus esquemático de ${step.petalas} pétalas.">
   <g fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="120" cy="120" r="70"/>${petals}${glifos[step.figura]}</g></svg>`;
}
