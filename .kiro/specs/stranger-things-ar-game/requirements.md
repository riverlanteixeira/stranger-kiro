# Documento de Requisitos

## Introdução

O "Stranger Things: Projeto Pedra Branca Invertida" é um jogo de realidade aumentada baseado em WebAR que permite aos jogadores explorar fisicamente o bairro Pedra Branca em Palhoça/SC enquanto interagem com elementos do "Mundo Invertido" da série Stranger Things. O jogo utiliza geolocalização GPS para ativar missões em pontos específicos, exibe elementos 3D através da câmera do celular e oferece feedback sensorial através de áudio e vibração.

## Requisitos

### Requisito 1

**História do Usuário:** Como um jogador, eu quero que o jogo detecte minha localização GPS em tempo real, para que eu possa navegar fisicamente pelo bairro e ativar missões baseadas na minha proximidade com pontos de interesse.

#### Critérios de Aceitação

1. QUANDO o jogador abrir o jogo ENTÃO o sistema DEVE solicitar permissão para acessar a localização GPS
2. QUANDO a permissão for concedida ENTÃO o sistema DEVE rastrear continuamente a posição GPS do jogador
3. QUANDO o jogador estiver dentro de 30 metros de um ponto de interesse ENTÃO o sistema DEVE ativar automaticamente a missão correspondente
4. SE a localização GPS não estiver disponível ENTÃO o sistema DEVE exibir uma mensagem de erro informativa
5. QUANDO o jogador se mover ENTÃO o sistema DEVE atualizar a posição em tempo real sem necessidade de recarregar a página

### Requisito 2

**História do Usuário:** Como um jogador, eu quero ver elementos 3D de realidade aumentada através da câmera do meu celular, para que eu possa visualizar portais e criaturas do Mundo Invertido nos locais específicos.

#### Critérios de Aceitação

1. QUANDO o jogador ativar uma missão no Lago ENTÃO o sistema DEVE exibir o modelo 3D "portal.glb" através da câmera
2. QUANDO o jogador ativar uma missão na Ponte ENTÃO o sistema DEVE exibir o modelo 3D "demogorgon.glb" através da câmera
3. QUANDO o sistema solicitar acesso à câmera ENTÃO o jogador DEVE poder conceder ou negar a permissão
4. SE a câmera não estiver disponível ENTÃO o sistema DEVE continuar funcionando sem os elementos AR
5. QUANDO os modelos 3D forem carregados ENTÃO eles DEVEM ser renderizados de forma estável e visível na tela

### Requisito 3

**História do Usuário:** Como um jogador, eu quero ouvir mensagens de áudio do personagem Dustin quando ativar missões, para que eu tenha uma experiência imersiva e orientação sobre o que fazer em cada local.

#### Critérios de Aceitação

1. QUANDO uma missão for ativada ENTÃO o sistema DEVE reproduzir automaticamente o arquivo de áudio correspondente
2. QUANDO o áudio estiver tocando ENTÃO o jogador DEVE poder pausar, parar ou ajustar o volume
3. SE o dispositivo estiver no modo silencioso ENTÃO o sistema DEVE respeitar essa configuração
4. QUANDO múltiplas missões forem ativadas rapidamente ENTÃO o sistema DEVE gerenciar a reprodução para evitar sobreposição
5. QUANDO o áudio terminar ENTÃO o sistema DEVE permitir que o jogador o reproduza novamente se desejar

### Requisito 4

**História do Usuário:** Como um jogador, eu quero receber feedback tátil através de vibração quando me aproximar de pontos de interesse, para que eu saiba quando estou perto de uma missão mesmo sem olhar constantemente para a tela.

#### Critérios de Aceitação

1. QUANDO o jogador estiver se aproximando de um ponto de interesse (dentro de 50 metros) ENTÃO o sistema DEVE ativar uma vibração suave
2. QUANDO o jogador estiver muito próximo (dentro de 30 metros) ENTÃO o sistema DEVE ativar uma vibração mais intensa
3. SE o dispositivo não suportar vibração ENTÃO o sistema DEVE continuar funcionando normalmente sem esse feedback
4. QUANDO o jogador sair da área de um ponto de interesse ENTÃO o sistema DEVE parar a vibração
5. QUANDO múltiplos pontos estiverem próximos ENTÃO o sistema DEVE priorizar o ponto mais próximo para vibração

### Requisito 5

**História do Usuário:** Como um jogador, eu quero que o jogo funcione diretamente no navegador do meu celular sem precisar instalar um aplicativo, para que eu possa jogar facilmente sem ocupar espaço de armazenamento.

#### Critérios de Aceitação

1. QUANDO o jogador acessar a URL do jogo ENTÃO o sistema DEVE carregar completamente no navegador móvel
2. QUANDO todos os assets forem carregados ENTÃO o jogo DEVE funcionar offline
3. QUANDO o jogador usar Chrome no Android ENTÃO todas as funcionalidades DEVEM estar disponíveis
4. SE o navegador não suportar WebXR ENTÃO o sistema DEVE exibir uma mensagem informativa
5. QUANDO o jogo for carregado ENTÃO ele DEVE ser responsivo e otimizado para telas de celular

### Requisito 6

**História do Usuário:** Como um jogador, eu quero navegar entre diferentes pontos de interesse no bairro Pedra Branca, para que eu possa completar todas as missões disponíveis e explorar toda a experiência do jogo.

#### Critérios de Aceitação

1. QUANDO o jogo iniciar ENTÃO o sistema DEVE apresentar todos os 7 pontos de interesse: Casa, Poste, Lago, UNISUL, Ponte, Floresta e Praça
2. QUANDO o jogador visitar um ponto ENTÃO o sistema DEVE marcar essa missão como concluída
3. QUANDO todas as missões forem concluídas ENTÃO o sistema DEVE exibir uma tela de parabéns
4. SE o jogador revisitar um ponto já visitado ENTÃO o sistema DEVE permitir replay da missão
5. QUANDO o jogador estiver longe de todos os pontos ENTÃO o sistema DEVE mostrar direções para o ponto mais próximo

### Requisito 7

**História do Usuário:** Como um jogador, eu quero que o jogo tenha uma interface intuitiva e informativa, para que eu possa entender meu progresso e navegar facilmente pela experiência.

#### Critérios de Aceitação

1. QUANDO o jogo carregar ENTÃO o sistema DEVE exibir uma tela de boas-vindas com instruções básicas
2. QUANDO o jogador estiver jogando ENTÃO o sistema DEVE mostrar quantas missões foram concluídas
3. QUANDO uma missão for ativada ENTÃO o sistema DEVE exibir claramente o nome do local e instruções
4. SE ocorrer um erro ENTÃO o sistema DEVE exibir mensagens de erro claras e úteis
5. QUANDO o jogador precisar de ajuda ENTÃO o sistema DEVE fornecer um botão de ajuda acessível