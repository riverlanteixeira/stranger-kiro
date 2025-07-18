# PRD – Stranger Things: Projeto Pedra Branca Invertida

## Visão Geral
**Nome do Projeto:** Stranger Things: Projeto Pedra Branca Invertida  
**Plataforma:** WebAR (funciona no navegador do celular, sem necessidade de app)  
**Dispositivo Alvo:** Samsung Galaxy S20 FE (compatível com WebXR e geolocalização)  
**Localização:** Bairro Pedra Branca, Palhoça/SC  
**Tecnologia Base:** A-Frame + AR.js + WebXR + Geolocation API + HTML5 Audio + Vibration API  
**Público-alvo:** Fãs da série Stranger Things e moradores do bairro Pedra Branca  
**Objetivo:** Explorar locais do bairro e interagir com o “Mundo Invertido” com ajuda de Dustin.

## Objetivos do Jogo
- Exploração física pelo bairro com GPS.
- Realidade Aumentada com modelos 3D em locais estratégicos.
- Reprodução de áudios do personagem Dustin em cada missão.
- Feedback tátil com vibração ao se aproximar de pontos.

## Funcionalidades Principais

### 1. Geolocalização
- O jogo acompanha a posição GPS do jogador em tempo real.
- Missões são ativadas ao se aproximar de pontos geográficos predefinidos (~30 metros).

### 2. Realidade Aumentada (WebAR)
- Elementos 3D como portais e criaturas aparecem via câmera.
- A-Frame e AR.js são usados para exibir os modelos .glb.

### 3. Feedback Sensorial
- **Vibração:** Disparada ao se aproximar de um ponto de interesse.
- **Áudio:** Mensagens do Dustin são reproduzidas automaticamente.

### 4. Missões e Pontos de Interesse
| Nome        | Coordenadas                                | Elemento AR      | Áudio                          |
|-------------|---------------------------------------------|------------------|--------------------------------|
| Casa        | -27.630876175110835, -48.67969706159946    | Nenhum           | 1 - Casa.mp3                   |
| Poste       | -27.631489762564254, -48.67942932776006    | Nenhum           | 2 - Poste de Luz.mp3           |
| Lago        | -27.629651561773642, -48.68112592253786    | portal.glb       | 3 - Lago.mp3                   |
| UNISUL      | -27.624013123132134, -48.681243155505165   | Nenhum           | 4 - UNISUL.mp3                 |
| Ponte       | -27.622632847004397, -48.6807748434082     | demogorgon.glb   | 5 - Ponte.mp3                  |
| Floresta    | -27.62172576455045, -48.6799944586445      | Nenhum           | 6 - Floresta.mp3              |
| Praça       | -27.62225085741092, -48.67746514219232     | Nenhum           | 7 - Praça.mp3                  |

## Estrutura do Projeto

```
/index.html
/script.js
/audios/
  - 1 - Casa.mp3
  - 2 - Poste de Luz.mp3
  - ...
/models/
  - demogorgon.glb
  - portal.glb
```

## Tecnologias Usadas
- [A-Frame](https://aframe.io) – Framework de WebXR
- [AR.js](https://github.com/jeromeetienne/AR.js) – RA baseada em marcador ou localização
- HTML5 Audio API – Reprodução de áudio local
- Web Vibration API – Feedback tátil
- Geolocation API – Localização GPS
- JavaScript Vanilla

## Etapas no VS Code com Grok 4
1. Abrir o projeto no VS Code.
2. Criar arquivos `index.html` e `script.js` com base nos exemplos.
3. Colocar os arquivos `.mp3` em `audios/` e modelos `.glb` em `models/`.
4. Rodar com extensão de servidor local (Live Server).
5. Grok pode ajudar:
   - Detectando erros de lógica JS.
   - Sugerindo melhorias no código AR.
   - Validando coordenadas e distâncias.
   - Testando vibração e eventos.
6. Testar no celular Android (Chrome com permissões de GPS e câmera).

## Considerações Finais
- O projeto é totalmente offline após carregar os assets (pode usar cache).
- Pode ser hospedado via GitHub Pages ou Netlify.
- Expandível com novos locais, criaturas e mecânicas.

## Licença
Uso educacional e experimental inspirado na série Stranger Things.