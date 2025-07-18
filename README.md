# Stranger Things: Projeto Pedra Branca Invertida

Jogo de realidade aumentada baseado em WebAR com temática de Stranger Things para exploração do bairro Pedra Branca em Palhoça/SC.

## 🎮 Como Jogar

1. Acesse o jogo pelo navegador do celular (Chrome recomendado)
2. Permita acesso à localização e câmera quando solicitado
3. Explore fisicamente o bairro Pedra Branca em Palhoça/SC
4. Siga as instruções do Dustin em cada local
5. Use realidade aumentada no Lago e na Ponte
6. Complete todas as 7 missões para finalizar a jornada

## ✨ Funcionalidades

- 🗺️ **Geolocalização GPS** - Detecção automática de proximidade
- 🎥 **Realidade Aumentada** - Modelos 3D em locais específicos
- 🎵 **Áudios do Dustin** - Mensagens exclusivas em cada missão
- 📳 **Feedback Tátil** - Vibração baseada na proximidade
- 📊 **Sistema de Progresso** - Conquistas e estatísticas
- 💾 **Progresso Salvo** - Continue de onde parou
- 🌐 **Funciona Offline** - Após carregamento inicial

## 🛠️ Tecnologias

- **WebAR**: A-Frame + AR.js
- **Geolocalização**: GPS API
- **Áudio**: HTML5 Audio API
- **Vibração**: Web Vibration API
- **3D Models**: Formato .glb
- **PWA**: Service Worker para cache offline

## 📱 Compatibilidade

- ✅ **Android Chrome** (recomendado)
- ✅ **Android Firefox** (limitado)
- ⚠️ **iOS Safari** (sem WebXR completo)
- 📍 **Requer GPS e câmera**
- 🌐 **HTTPS obrigatório**

## 🗂️ Estrutura do Projeto

```
/
├── index.html          # Interface principal
├── script.js           # Engine do jogo (3500+ linhas)
├── sw.js              # Service Worker para cache
├── README.md          # Documentação
├── audios/            # Arquivos de áudio do Dustin
│   ├── 1 - Casa.mp3
│   ├── 2 - Poste de Luz.mp3
│   ├── 3 - Lago.mp3
│   ├── 4 - UNISUL.mp3
│   ├── 5 - Ponte.mp3
│   ├── 6 - Floresta.mp3
│   └── 7 - Praça.mp3
└── models/            # Modelos 3D para AR
    ├── demogorgon.glb
    └── portal.glb
```

## 🎯 Missões e Localizações

| Missão | Local | Coordenadas | Recursos |
|--------|-------|-------------|----------|
| 1 | **Casa** | -27.6309, -48.6797 | 🎵 Áudio |
| 2 | **Poste de Luz** | -27.6315, -48.6794 | 🎵 Áudio |
| 3 | **Lago** | -27.6297, -48.6811 | 🎵 Áudio + 🎥 Portal AR |
| 4 | **UNISUL** | -27.6240, -48.6812 | 🎵 Áudio |
| 5 | **Ponte** | -27.6226, -48.6808 | 🎵 Áudio + 🎥 Demogorgon AR |
| 6 | **Floresta** | -27.6217, -48.6800 | 🎵 Áudio |
| 7 | **Praça** | -27.6223, -48.6775 | 🎵 Áudio |

## 🚀 Deployment

### Opção 1: GitHub Pages

1. **Fork/Clone** este repositório
2. **Ative GitHub Pages** nas configurações do repositório
3. **Acesse** via `https://seuusuario.github.io/nome-do-repo`

### Opção 2: Netlify

1. **Conecte** seu repositório ao Netlify
2. **Configure** build settings:
   - Build command: (vazio)
   - Publish directory: `/`
3. **Deploy** automaticamente

### Opção 3: Servidor Local

```bash
# Usando Python
python -m http.server 8000

# Usando Node.js
npx http-server

# Usando PHP
php -S localhost:8000
```

**⚠️ Importante**: Acesse sempre via HTTPS para funcionalidades de GPS e câmera.

## 🧪 Testes

O jogo inclui sistema de testes automatizados:

```javascript
// Executar testes no console do navegador
gameTester.runAllTests();

// Ver relatório detalhado
console.log(gameTester.getTestReport());
```

**Testes incluídos**:
- ✅ Cálculo de distância (Haversine)
- ✅ Validação de missões
- ✅ Compatibilidade do navegador
- ✅ Configuração das coordenadas

## 🎮 Interface do Jogo

### Telas Principais
- **🏠 Boas-vindas** - Introdução e instruções
- **🎮 Jogo** - Interface principal com progresso
- **🎯 Missões** - Lista de todas as missões
- **📊 Estatísticas** - Progresso e conquistas
- **⚙️ Configurações** - Controles de áudio/vibração

### Controles
- **📍 Navegação GPS** - Automática baseada em localização
- **🎥 Ativar AR** - Botão para realidade aumentada
- **🎵 Reproduzir Áudio** - Replay das mensagens do Dustin
- **📳 Vibração** - Feedback tátil configurável

## 🏆 Sistema de Conquistas

- 🎯 **Primeiro Contato** - Complete primeira missão
- 🏃‍♂️ **Meio Caminho** - Complete metade das missões
- 🏆 **Explorador do Mundo Invertido** - Complete todas as missões
- 🚶‍♂️ **Caminhante** - Percorra pelo menos 1km
- ⏰ **Dedicado** - Jogue por pelo menos 30 minutos

## 🔧 Desenvolvimento

### Arquitetura
- **GameEngine** - Coordenação geral
- **LocationManager** - GPS e proximidade
- **ARManager** - Realidade aumentada
- **AudioManager** - Sistema de som
- **HapticManager** - Vibração
- **MissionManager** - Lógica das missões
- **UIManager** - Interface do usuário

### Performance
- 📊 Monitor de FPS integrado
- 🔄 Throttling de GPS (2s)
- 💾 Cache inteligente de assets
- 📳 Cooldown de vibração
- 🎵 Pré-carregamento de áudio

## 🐛 Solução de Problemas

### GPS não funciona
- Verifique se a localização está ativada
- Use HTTPS (obrigatório)
- Teste em área aberta

### AR não aparece
- Permita acesso à câmera
- Use Chrome no Android
- Verifique se há modelo 3D na missão

### Áudio não toca
- Toque na tela primeiro (política de autoplay)
- Verifique volume do dispositivo
- Teste com fones de ouvido

### Vibração não funciona
- Verifique configurações do jogo
- Nem todos os dispositivos suportam
- Teste em celular Android

## 📊 Estatísticas Técnicas

- **Linhas de código**: 3500+
- **Classes principais**: 8
- **Sistemas integrados**: 15
- **Arquivos de áudio**: 7
- **Modelos 3D**: 2
- **Testes automatizados**: 4

## 🌟 Créditos

- **Inspiração**: Série Stranger Things (Netflix)
- **Localização**: Bairro Pedra Branca, Palhoça/SC
- **Tecnologias**: A-Frame, AR.js, WebXR
- **Desenvolvimento**: Sistema modular JavaScript

## 📄 Licença

Uso educacional e experimental inspirado na série Stranger Things.
Este projeto é uma demonstração técnica de WebAR e não possui fins comerciais.