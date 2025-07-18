/**
 * Stranger Things: Projeto Pedra Branca Invertida
 * Sistema de Realidade Aumentada baseado em localização
 */

// Configuração global do jogo
const GAME_CONFIG = {
  activationRadius: 30, // metros
  proximityRadius: 50, // metros para vibração
  gpsUpdateInterval: 2000, // ms
  audioVolume: 0.8,
  vibrationPatterns: {
    proximity: [100, 50, 100],
    activation: [200, 100, 200, 100, 200],
  },
};

// Dados das missões
const MISSIONS = [
  {
    id: "casa",
    name: "Casa",
    coordinates: {
      lat: -27.630876175110835,
      lng: -48.67969706159946,
    },
    audioFile: "audios/1 - Casa.mp3",
    arModel: null,
    description: "Ponto inicial da jornada",
    completed: false,
  },
  {
    id: "poste",
    name: "Poste de Luz",
    coordinates: {
      lat: -27.631489762564254,
      lng: -48.67942932776006,
    },
    audioFile: "audios/2 - Poste de Luz.mp3",
    arModel: null,
    description: "Um poste comum... ou não?",
    completed: false,
  },
  {
    id: "lago",
    name: "Lago",
    coordinates: {
      lat: -27.629651561773642,
      lng: -48.68112592253786,
    },
    audioFile: "audios/3 - Lago.mp3",
    arModel: "models/portal.glb",
    description: "Portal para o Mundo Invertido",
    completed: false,
  },
  {
    id: "unisul",
    name: "UNISUL",
    coordinates: {
      lat: -27.624013123132134,
      lng: -48.681243155505165,
    },
    audioFile: "audios/4 - UNISUL.mp3",
    arModel: null,
    description: "Universidade com segredos",
    completed: false,
  },
  {
    id: "ponte",
    name: "Ponte",
    coordinates: {
      lat: -27.622632847004397,
      lng: -48.6807748434082,
    },
    audioFile: "audios/5 - Ponte.mp3",
    arModel: "models/demogorgon.glb",
    description: "Cuidado com o que espreita",
    completed: false,
  },
  {
    id: "floresta",
    name: "Floresta",
    coordinates: {
      lat: -27.62172576455045,
      lng: -48.6799944586445,
    },
    audioFile: "audios/6 - Floresta.mp3",
    arModel: null,
    description: "Árvores sussurram segredos",
    completed: false,
  },
  {
    id: "praca",
    name: "Praça",
    coordinates: {
      lat: -27.62225085741092,
      lng: -48.67746514219232,
    },
    audioFile: "audios/7 - Praça.mp3",
    arModel: null,
    description: "Final da jornada",
    completed: false,
  },
];

// Sistema de gerenciamento de estado
class GameState {
  constructor() {
    this.state = {
      // Estado de inicialização
      isInitialized: false,
      isRunning: false,
      currentScreen: "loading",

      // Permissões
      permissions: {
        location: false,
        camera: false,
        locationRequested: false,
        cameraRequested: false,
      },

      // Localização
      currentPosition: {
        lat: null,
        lng: null,
        accuracy: null,
        timestamp: null,
      },

      // Missões
      activeMission: null,
      completedMissions: [],
      totalMissions: MISSIONS.length,
      nearbyMissions: [],

      // Sistemas
      isARActive: false,
      audioPlaying: null,
      lastVibration: 0,

      // Estatísticas
      gameStartTime: null,
      totalDistance: 0,
      sessionTime: 0,

      // Configurações
      settings: {
        soundEnabled: true,
        vibrationEnabled: true,
        arEnabled: true,
      },
    };

    // Listeners para mudanças de estado
    this.listeners = new Map();
  }

  // Getter para acessar o estado
  get(key) {
    return this.getNestedValue(this.state, key);
  }

  // Setter para modificar o estado
  set(key, value) {
    const oldValue = this.get(key);
    this.setNestedValue(this.state, key, value);

    // Notificar listeners
    this.notifyListeners(key, value, oldValue);
  }

  // Adicionar listener para mudanças de estado
  addListener(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    this.listeners.get(key).push(callback);
  }

  // Remover listener
  removeListener(key, callback) {
    if (this.listeners.has(key)) {
      const callbacks = this.listeners.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Notificar listeners sobre mudanças
  notifyListeners(key, newValue, oldValue) {
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach((callback) => {
        try {
          callback(newValue, oldValue, key);
        } catch (error) {
          console.error("Erro no listener de estado:", error);
        }
      });
    }
  }

  // Utilitário para acessar valores aninhados
  getNestedValue(obj, path) {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  // Utilitário para definir valores aninhados
  setNestedValue(obj, path, value) {
    const keys = path.split(".");
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {};
      }
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  // Resetar estado para novo jogo
  reset() {
    this.state.completedMissions = [];
    this.state.activeMission = null;
    this.state.isARActive = false;
    this.state.audioPlaying = null;
    this.state.gameStartTime = null;
    this.state.totalDistance = 0;
    this.state.sessionTime = 0;
    this.state.nearbyMissions = [];

    // Resetar missões
    MISSIONS.forEach((mission) => {
      mission.completed = false;
    });
  }

  // Serializar estado para persistência
  serialize() {
    return {
      completedMissions: this.state.completedMissions,
      totalDistance: this.state.totalDistance,
      sessionTime: this.state.sessionTime,
      settings: this.state.settings,
      timestamp: Date.now(),
    };
  }

  // Deserializar estado da persistência
  deserialize(data) {
    if (data.completedMissions) {
      this.state.completedMissions = data.completedMissions;
    }
    if (data.totalDistance) {
      this.state.totalDistance = data.totalDistance;
    }
    if (data.sessionTime) {
      this.state.sessionTime = data.sessionTime;
    }
    if (data.settings) {
      this.state.settings = { ...this.state.settings, ...data.settings };
    }
  }
}

// Instância global do estado
const gameState = new GameState();

// Sistema centralizado de tratamento de erros
class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
    this.setupGlobalErrorHandlers();
  }

  setupGlobalErrorHandlers() {
    // Capturar erros JavaScript não tratados
    window.addEventListener("error", (event) => {
      this.handleError({
        type: "javascript",
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      });
    });

    // Capturar promises rejeitadas não tratadas
    window.addEventListener("unhandledrejection", (event) => {
      this.handleError({
        type: "promise",
        message: event.reason?.message || "Promise rejeitada",
        reason: event.reason,
      });
    });
  }

  handleError(errorInfo) {
    const timestamp = new Date().toISOString();
    const errorEntry = {
      ...errorInfo,
      timestamp,
      id: this.generateErrorId(),
    };

    // Adicionar ao log
    this.errorLog.push(errorEntry);

    // Manter tamanho do log
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Log no console
    console.error("🚨 Erro capturado:", errorEntry);

    // Mostrar mensagem amigável ao usuário
    this.showUserFriendlyError(errorInfo);

    return errorEntry.id;
  }

  showUserFriendlyError(errorInfo) {
    let userMessage = "Ocorreu um erro inesperado.";

    // Mensagens específicas baseadas no tipo de erro
    if (errorInfo.type === "location") {
      userMessage = this.getLocationErrorMessage(errorInfo);
    } else if (errorInfo.type === "camera") {
      userMessage = this.getCameraErrorMessage(errorInfo);
    } else if (errorInfo.type === "audio") {
      userMessage = this.getAudioErrorMessage(errorInfo);
    } else if (errorInfo.type === "network") {
      userMessage = "Problema de conexão. Verifique sua internet.";
    } else if (errorInfo.type === "storage") {
      userMessage = "Erro ao salvar dados. Verifique o espaço disponível.";
    }

    // Mostrar mensagem via UI se disponível
    if (window.gameEngine && window.gameEngine.managers.ui) {
      window.gameEngine.managers.ui.showError(userMessage);
    }
  }

  getLocationErrorMessage(errorInfo) {
    const errorCode = errorInfo.code;

    switch (errorCode) {
      case 1: // PERMISSION_DENIED
        return "Permissão de localização negada. Ative o GPS nas configurações do navegador.";
      case 2: // POSITION_UNAVAILABLE
        return "Localização indisponível. Verifique se o GPS está ativado.";
      case 3: // TIMEOUT
        return "Timeout na localização. Tentando novamente...";
      default:
        return "Erro de GPS. Verifique se a localização está habilitada.";
    }
  }

  getCameraErrorMessage(errorInfo) {
    const errorName = errorInfo.name;

    switch (errorName) {
      case "NotAllowedError":
        return "Permissão de câmera negada. A realidade aumentada não estará disponível.";
      case "NotFoundError":
        return "Câmera não encontrada no dispositivo.";
      case "NotSupportedError":
        return "Câmera não suportada neste navegador.";
      case "NotReadableError":
        return "Câmera está sendo usada por outro aplicativo.";
      default:
        return "Erro ao acessar a câmera. Verifique as permissões.";
    }
  }

  getAudioErrorMessage(errorInfo) {
    const errorName = errorInfo.name;

    switch (errorName) {
      case "NotAllowedError":
        return "Reprodução de áudio bloqueada. Toque na tela para ativar o áudio.";
      case "NotSupportedError":
        return "Formato de áudio não suportado.";
      case "NetworkError":
        return "Erro de rede ao carregar áudio. Verifique sua conexão.";
      default:
        return "Erro ao reproduzir áudio. Verifique as configurações de som.";
    }
  }

  generateErrorId() {
    return "err_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  // Métodos para diferentes tipos de erro
  handleLocationError(error) {
    return this.handleError({
      type: "location",
      code: error.code,
      message: error.message,
      source: "Geolocation API",
    });
  }

  handleCameraError(error) {
    return this.handleError({
      type: "camera",
      name: error.name,
      message: error.message,
      source: "MediaDevices API",
    });
  }

  handleAudioError(error) {
    return this.handleError({
      type: "audio",
      name: error.name,
      message: error.message,
      source: "HTML5 Audio",
    });
  }

  handleNetworkError(error, url) {
    return this.handleError({
      type: "network",
      message: error.message,
      url: url,
      source: "Network Request",
    });
  }

  handleStorageError(error, operation) {
    return this.handleError({
      type: "storage",
      message: error.message,
      operation: operation,
      source: "LocalStorage",
    });
  }

  // Obter log de erros
  getErrorLog() {
    return [...this.errorLog];
  }

  // Limpar log de erros
  clearErrorLog() {
    this.errorLog = [];
  }

  // Obter estatísticas de erros
  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      byType: {},
      recent: this.errorLog.slice(-10),
    };

    this.errorLog.forEach((error) => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
    });

    return stats;
  }

  // Verificar compatibilidade do navegador
  checkBrowserCompatibility() {
    const issues = [];

    // Verificar APIs necessárias
    if (!navigator.geolocation) {
      issues.push({
        type: "compatibility",
        feature: "Geolocation",
        message: "API de geolocalização não suportada",
      });
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      issues.push({
        type: "compatibility",
        feature: "Camera",
        message: "API de câmera não suportada",
      });
    }

    if (!("vibrate" in navigator)) {
      issues.push({
        type: "compatibility",
        feature: "Vibration",
        message: "API de vibração não suportada",
      });
    }

    if (!window.Audio) {
      issues.push({
        type: "compatibility",
        feature: "Audio",
        message: "API de áudio não suportada",
      });
    }

    if (!localStorage) {
      issues.push({
        type: "compatibility",
        feature: "Storage",
        message: "LocalStorage não suportado",
      });
    }

    // Verificar WebXR/A-Frame
    if (!window.AFRAME) {
      issues.push({
        type: "compatibility",
        feature: "WebXR",
        message: "A-Frame não carregado",
      });
    }

    return issues;
  }

  // Mostrar relatório de compatibilidade
  showCompatibilityReport() {
    const issues = this.checkBrowserCompatibility();

    if (issues.length === 0) {
      console.log("✅ Navegador totalmente compatível");
      return true;
    }

    console.warn("⚠️ Problemas de compatibilidade encontrados:", issues);

    // Mostrar aviso ao usuário se houver problemas críticos
    const criticalIssues = issues.filter((issue) =>
      ["Geolocation", "Audio"].includes(issue.feature)
    );

    if (criticalIssues.length > 0) {
      const message =
        "Seu navegador pode não suportar todas as funcionalidades do jogo. " +
        "Recomendamos usar Chrome no Android para melhor experiência.";

      if (window.gameEngine && window.gameEngine.managers.ui) {
        window.gameEngine.managers.ui.showError(message);
      }
    }

    return issues.length === 0;
  }
}

// Instância global do tratador de erros
const errorHandler = new ErrorHandler();

// Sistema de carregamento de assets
class AssetLoader {
  constructor() {
    this.loadedAssets = new Map();
    this.loadingPromises = new Map();
    this.totalAssets = 0;
    this.loadedCount = 0;
    this.onProgressCallback = null;
  }

  setProgressCallback(callback) {
    this.onProgressCallback = callback;
  }

  updateProgress() {
    if (this.onProgressCallback) {
      const progress =
        this.totalAssets > 0 ? (this.loadedCount / this.totalAssets) * 100 : 0;
      this.onProgressCallback(progress, this.loadedCount, this.totalAssets);
    }
  }

  async preloadAllAssets() {
    console.log("📦 Iniciando pré-carregamento de assets...");

    const assetPromises = [];

    // Contar total de assets
    this.totalAssets = MISSIONS.length * 2; // áudio + modelo (se houver)
    this.loadedCount = 0;

    // Pré-carregar áudios
    MISSIONS.forEach((mission) => {
      assetPromises.push(this.preloadAudio(mission.audioFile, mission.id));
    });

    // Pré-carregar modelos 3D
    MISSIONS.forEach((mission) => {
      if (mission.arModel) {
        assetPromises.push(this.preloadModel(mission.arModel, mission.id));
      } else {
        // Contar como "carregado" mesmo sem modelo
        this.loadedCount++;
        this.updateProgress();
      }
    });

    try {
      await Promise.allSettled(assetPromises);
      console.log("✅ Pré-carregamento concluído");
      return true;
    } catch (error) {
      console.error("❌ Erro no pré-carregamento:", error);
      return false;
    }
  }

  async preloadAudio(audioPath, id) {
    if (this.loadedAssets.has(audioPath)) {
      return this.loadedAssets.get(audioPath);
    }

    if (this.loadingPromises.has(audioPath)) {
      return this.loadingPromises.get(audioPath);
    }

    const loadPromise = new Promise((resolve, reject) => {
      const audio = new Audio();

      audio.addEventListener("canplaythrough", () => {
        this.loadedAssets.set(audioPath, audio);
        this.loadedCount++;
        this.updateProgress();
        console.log("✅ Áudio carregado:", audioPath);
        resolve(audio);
      });

      audio.addEventListener("error", (error) => {
        console.error("❌ Erro ao carregar áudio:", audioPath, error);
        this.loadedCount++;
        this.updateProgress();
        reject(error);
      });

      audio.preload = "auto";
      audio.src = audioPath;
      audio.load();
    });

    this.loadingPromises.set(audioPath, loadPromise);
    return loadPromise;
  }

  async preloadModel(modelPath, id) {
    if (this.loadedAssets.has(modelPath)) {
      this.loadedCount++;
      this.updateProgress();
      return this.loadedAssets.get(modelPath);
    }

    if (this.loadingPromises.has(modelPath)) {
      return this.loadingPromises.get(modelPath);
    }

    const loadPromise = new Promise((resolve, reject) => {
      // Para modelos 3D, vamos apenas verificar se o arquivo existe
      fetch(modelPath, { method: "HEAD" })
        .then((response) => {
          if (response.ok) {
            this.loadedAssets.set(modelPath, true);
            this.loadedCount++;
            this.updateProgress();
            console.log("✅ Modelo verificado:", modelPath);
            resolve(true);
          } else {
            throw new Error(`Modelo não encontrado: ${response.status}`);
          }
        })
        .catch((error) => {
          console.error("❌ Erro ao verificar modelo:", modelPath, error);
          this.loadedCount++;
          this.updateProgress();
          reject(error);
        });
    });

    this.loadingPromises.set(modelPath, loadPromise);
    return loadPromise;
  }

  getAsset(path) {
    return this.loadedAssets.get(path);
  }

  isAssetLoaded(path) {
    return this.loadedAssets.has(path);
  }

  getLoadingStats() {
    return {
      totalAssets: this.totalAssets,
      loadedCount: this.loadedCount,
      loadedAssets: this.loadedAssets.size,
      progress:
        this.totalAssets > 0 ? (this.loadedCount / this.totalAssets) * 100 : 0,
    };
  }

  clearCache() {
    this.loadedAssets.clear();
    this.loadingPromises.clear();
    this.totalAssets = 0;
    this.loadedCount = 0;
    console.log("🧹 Cache de assets limpo");
  }
}

// Instância global do carregador de assets
const assetLoader = new AssetLoader();

// Monitor de performance
class PerformanceMonitor {
  constructor() {
    this.frameStartTime = 0;
    this.frameCount = 0;
    this.totalFrameTime = 0;
    this.maxFrameTime = 0;
    this.minFrameTime = Infinity;
    this.lastReportTime = Date.now();
    this.reportInterval = 10000; // 10 segundos
  }

  startFrame() {
    this.frameStartTime = performance.now();
  }

  endFrame() {
    if (this.frameStartTime === 0) return;

    const frameTime = performance.now() - this.frameStartTime;
    this.frameCount++;
    this.totalFrameTime += frameTime;

    if (frameTime > this.maxFrameTime) {
      this.maxFrameTime = frameTime;
    }

    if (frameTime < this.minFrameTime) {
      this.minFrameTime = frameTime;
    }

    // Relatório periódico
    const now = Date.now();
    if (now - this.lastReportTime >= this.reportInterval) {
      this.generateReport();
      this.reset();
      this.lastReportTime = now;
    }

    this.frameStartTime = 0;
  }

  generateReport() {
    if (this.frameCount === 0) return;

    const avgFrameTime = this.totalFrameTime / this.frameCount;
    const fps = 1000 / avgFrameTime;

    console.log("📊 Performance Report:", {
      frames: this.frameCount,
      avgFrameTime: avgFrameTime.toFixed(2) + "ms",
      fps: fps.toFixed(1),
      maxFrameTime: this.maxFrameTime.toFixed(2) + "ms",
      minFrameTime: this.minFrameTime.toFixed(2) + "ms",
    });

    // Alertar sobre performance baixa
    if (fps < 15) {
      console.warn("⚠️ Performance baixa detectada:", fps.toFixed(1), "FPS");
    }
  }

  reset() {
    this.frameCount = 0;
    this.totalFrameTime = 0;
    this.maxFrameTime = 0;
    this.minFrameTime = Infinity;
  }

  getCurrentFPS() {
    if (this.frameCount === 0) return 0;
    const avgFrameTime = this.totalFrameTime / this.frameCount;
    return 1000 / avgFrameTime;
  }
}

// Engine principal do jogo
class GameEngine {
  constructor() {
    this.managers = {
      location: null,
      ar: null,
      audio: null,
      haptic: null,
      mission: null,
      ui: null,
    };

    this.updateInterval = null;
    this.performanceMonitor = new PerformanceMonitor();

    // Bind de métodos para callbacks
    this.onLocationUpdate = this.onLocationUpdate.bind(this);
    this.onMissionActivated = this.onMissionActivated.bind(this);
    this.onMissionCompleted = this.onMissionCompleted.bind(this);
    this.update = this.update.bind(this);
  }

  async init() {
    console.log("🎮 Inicializando Stranger Things AR Game...");

    try {
      // Marcar início da inicialização
      gameState.set("isInitialized", false);
      gameState.set("currentScreen", "loading");

      // Mostrar progresso
      this.updateLoadingProgress("Inicializando sistemas...", 20);

      // Inicializar UI primeiro
      this.managers.ui = new UIManager(this);
      this.managers.ui.init();

      this.updateLoadingProgress("Carregando managers...", 40);

      // Inicializar outros managers
      this.managers.location = new LocationManager(this);
      this.managers.audio = new AudioManager(this);
      this.managers.haptic = new HapticManager();
      this.managers.ar = new ARManager(this);
      this.managers.mission = new MissionManager(this);

      this.updateLoadingProgress("Configurando sistema...", 60);

      // Configurar listeners de estado
      this.setupStateListeners();

      this.updateLoadingProgress("Carregando progresso...", 80);

      // Carregar progresso salvo
      await this.loadGameProgress();

      this.updateLoadingProgress("Finalizando...", 100);

      // Aguardar um pouco para mostrar 100%
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Marcar como inicializado
      gameState.set("isInitialized", true);
      console.log("✅ Game Engine inicializado com sucesso");

      // Mostrar tela de boas-vindas
      this.managers.ui.showScreen("welcome");
    } catch (error) {
      console.error("❌ Erro ao inicializar o jogo:", error);
      this.handleInitializationError(error);
    }
  }

  updateLoadingProgress(message, percentage) {
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
      let progressText = loadingScreen.querySelector("p");
      if (progressText) {
        progressText.textContent = message;
      }

      // Adicionar barra de progresso se não existir
      let progressContainer = loadingScreen.querySelector(".loading-progress");
      if (!progressContainer) {
        progressContainer = document.createElement("div");
        progressContainer.className = "loading-progress";
        progressContainer.innerHTML = `
          <div class="loading-progress-bar">
            <div class="loading-progress-fill"></div>
          </div>
          <div class="loading-percentage">0%</div>
        `;
        loadingScreen.appendChild(progressContainer);
      }

      const progressFill = progressContainer.querySelector(
        ".loading-progress-fill"
      );
      const progressPercentage = progressContainer.querySelector(
        ".loading-percentage"
      );

      if (progressFill) {
        progressFill.style.width = percentage + "%";
      }
      if (progressPercentage) {
        progressPercentage.textContent = percentage + "%";
      }
    }
  }

  skipLoading() {
    console.log("⏭️ Pulando carregamento para modo teste");
    gameState.set("isInitialized", true);
    this.managers.ui = new UIManager(this);
    this.managers.ui.init();
    this.managers.ui.showScreen("welcome");
  }

  async initializeManagers() {
    console.log("🔧 Inicializando managers...");

    // UI Manager (primeiro, para mostrar erros)
    this.managers.ui = new UIManager(this);

    // Core managers
    this.managers.location = new LocationManager(this);
    this.managers.audio = new AudioManager(this);
    this.managers.haptic = new HapticManager();
    this.managers.ar = new ARManager(this);
    this.managers.mission = new MissionManager(this);

    // Inicializar managers que precisam de setup assíncrono
    await this.managers.audio.init();
    await this.managers.ar.init();

    console.log("✅ Todos os managers inicializados");
  }

  setupStateListeners() {
    // Listener para mudanças de posição
    gameState.addListener("currentPosition", (newPos, oldPos) => {
      if (newPos.lat && newPos.lng) {
        this.managers.mission.checkProximity(newPos);
      }
    });

    // Listener para missões concluídas
    gameState.addListener("completedMissions", (completed) => {
      this.saveGameProgress();
      if (completed.length === gameState.get("totalMissions")) {
        this.onGameCompleted();
      }
    });

    // Listener para mudanças de tela
    gameState.addListener("currentScreen", (screen) => {
      console.log("📱 Mudança de tela:", screen);
    });
  }

  async start() {
    if (gameState.get("isRunning")) return;

    console.log("🚀 Iniciando jogo...");
    gameState.set("isRunning", true);
    gameState.set("gameStartTime", Date.now());

    try {
      // Solicitar permissões
      await this.requestPermissions();

      // Inicializar sistemas
      await this.managers.location.startTracking();
      await this.managers.audio.preloadAudios();

      // Pré-carregar assets
      await assetLoader.preloadAllAssets();

      // Mostrar tela do jogo
      this.managers.ui.showScreen("game");

      // Iniciar loop principal
      this.startUpdateLoop();

      console.log("✅ Jogo iniciado com sucesso");
    } catch (error) {
      console.error("❌ Erro ao iniciar o jogo:", error);
      this.handleGameError(error);
    }
  }

  handleInitializationError(error) {
    console.error("❌ Erro na inicialização:", error);
    if (this.managers.ui) {
      this.managers.ui.showError(
        "Erro ao carregar o jogo. Recarregue a página."
      );
    } else {
      // Fallback se UI não estiver disponível
      alert("Erro ao carregar o jogo. Recarregue a página.");
    }
  }

  handleGameError(error) {
    console.error("❌ Erro no jogo:", error);
    gameState.set("isRunning", false);

    let message = "Erro inesperado no jogo.";

    if (error.message.includes("permission")) {
      message =
        "Permissões necessárias não foram concedidas. Verifique as configurações do navegador.";
    } else if (error.message.includes("location")) {
      message =
        "Não foi possível acessar sua localização. Verifique se o GPS está ativado.";
    } else if (error.message.includes("audio")) {
      message = "Erro ao carregar arquivos de áudio. Verifique sua conexão.";
    }

    this.managers.ui.showError(message);
  }

  async requestPermissions() {
    console.log("🔐 Solicitando permissões...");

    // Permissão de localização
    try {
      const locationPermission =
        await this.managers.location.requestPermission();
      gameState.set("permissions.location", locationPermission);
    } catch (error) {
      console.warn("⚠️ Permissão de localização negada:", error);
      gameState.set("permissions.location", false);
    }

    // Permissão de câmera (opcional)
    try {
      const cameraPermission = await this.managers.ar.requestCameraPermission();
      gameState.set("permissions.camera", cameraPermission);
    } catch (error) {
      console.warn("⚠️ Permissão de câmera negada - AR não disponível:", error);
      gameState.set("permissions.camera", false);
    }
  }

  startUpdateLoop() {
    this.updateInterval = setInterval(() => {
      this.update();
    }, GAME_CONFIG.gpsUpdateInterval);
  }

  update() {
    if (!gameState.get("isRunning")) return;

    // Monitorar performance
    this.performanceMonitor.startFrame();

    // Atualizar tempo de sessão
    if (gameState.get("gameStartTime")) {
      const sessionTime = Date.now() - gameState.get("gameStartTime");
      gameState.set("sessionTime", sessionTime);
    }

    // Atualizar posição e verificar missões
    const currentPos = gameState.get("currentPosition");
    if (currentPos.lat && currentPos.lng) {
      this.managers.mission.checkMissionActivation(currentPos);
    }

    // Atualizar UI
    this.managers.ui.updateGameScreen();

    // Finalizar monitoramento de performance
    this.performanceMonitor.endFrame();
  }

  onLocationUpdate(position) {
    const newPosition = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: Date.now(),
    };

    gameState.set("currentPosition", newPosition);
    console.log("📍 Posição atualizada:", newPosition);
  }

  onMissionActivated(mission) {
    console.log("🎯 Missão ativada:", mission.name);
    gameState.set("activeMission", mission);

    // Reproduzir áudio
    this.managers.audio.playAudio(mission.id, mission.audioFile);

    // Vibração de ativação
    this.managers.haptic.vibrateActivation();

    // Mostrar controles AR se disponível
    if (mission.arModel && gameState.get("permissions.camera")) {
      this.managers.ui.showARControls(true);
    }

    // Atualizar UI
    this.managers.ui.updateMissionInfo(mission);
  }

  onMissionCompleted(mission) {
    console.log("✅ Missão concluída:", mission.name);

    const completedMissions = gameState.get("completedMissions");
    if (!completedMissions.includes(mission.id)) {
      const newCompleted = [...completedMissions, mission.id];
      gameState.set("completedMissions", newCompleted);
      mission.completed = true;

      // Salvar progresso
      this.saveGameProgress();

      // Verificar se todas as missões foram concluídas
      if (newCompleted.length === gameState.get("totalMissions")) {
        this.onGameCompleted();
      }
    }
  }

  onGameCompleted() {
    console.log("🏆 Jogo concluído!");
    this.managers.ui.showScreen("completion");
    this.stop();
  }

  stop() {
    gameState.set("isRunning", false);
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.managers.location) {
      this.managers.location.stopTracking();
    }
  }

  restart() {
    console.log("🔄 Reiniciando jogo...");

    // Reset do estado usando o método da classe GameState
    gameState.reset();

    // Limpar progresso salvo
    localStorage.removeItem("strangerthings_progress");

    // Reiniciar
    this.stop();
    this.start();
  }

  saveGameProgress() {
    try {
      const progress = gameState.serialize();
      localStorage.setItem("strangerthings_progress", JSON.stringify(progress));
      console.log("💾 Progresso salvo");
    } catch (error) {
      console.warn("⚠️ Erro ao salvar progresso:", error);
    }
  }

  async loadGameProgress() {
    try {
      const saved = localStorage.getItem("strangerthings_progress");
      if (saved) {
        const progress = JSON.parse(saved);
        gameState.deserialize(progress);

        // Marcar missões como concluídas
        const completedMissions = gameState.get("completedMissions");
        MISSIONS.forEach((mission) => {
          if (completedMissions.includes(mission.id)) {
            mission.completed = true;
          }
        });

        console.log(
          "💾 Progresso carregado:",
          completedMissions.length,
          "missões concluídas"
        );
      }
    } catch (error) {
      console.warn("⚠️ Erro ao carregar progresso salvo:", error);
    }
  }
}

// Implementação completa das classes
class LocationManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.watchId = null;
    this.lastPosition = null;
    this.isTracking = false;
    this.permissionRequested = false;

    // Configurações de GPS
    this.gpsOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    };
  }

  async requestPermission() {
    if (this.permissionRequested) {
      return gameState.get("permissions.location");
    }

    this.permissionRequested = true;

    if (!navigator.geolocation) {
      console.error("❌ Geolocalização não suportada neste navegador");
      throw new Error("Geolocalização não suportada");
    }

    try {
      // Testar acesso à localização
      const position = await this.getCurrentPositionPromise();
      console.log("✅ Permissão de localização concedida");

      // Atualizar posição inicial
      this.gameEngine.onLocationUpdate(position);

      return true;
    } catch (error) {
      console.error("❌ Erro ao solicitar permissão de localização:", error);

      // MODO DE TESTE: Simular localização se GPS falhar
      console.log("🧪 Ativando modo de teste com localização simulada");
      this.startTestMode();

      return true;
    }
  }

  // Modo de teste com localização simulada
  startTestMode() {
    console.log(
      "🧪 MODO DE TESTE ATIVADO - Simulando localização no bairro Pedra Branca"
    );

    // Simular posição inicial próxima à primeira missão (Casa)
    const testPosition = {
      coords: {
        latitude: -27.630876175110835 + (Math.random() - 0.5) * 0.001, // Pequena variação
        longitude: -48.67969706159946 + (Math.random() - 0.5) * 0.001,
        accuracy: 10,
      },
      timestamp: Date.now(),
    };

    // Atualizar posição inicial
    this.gameEngine.onLocationUpdate(testPosition);

    // Simular movimento entre as missões
    this.simulateMovement();
  }

  simulateMovement() {
    let currentMissionIndex = 0;

    setInterval(() => {
      if (currentMissionIndex < MISSIONS.length) {
        const mission = MISSIONS[currentMissionIndex];

        // Simular aproximação gradual da missão
        const distance = Math.random() * 40 + 10; // 10-50 metros
        const angle = Math.random() * 2 * Math.PI;

        const lat =
          mission.coordinates.lat + (distance / 111000) * Math.cos(angle);
        const lng =
          mission.coordinates.lng +
          (distance /
            (111000 * Math.cos((mission.coordinates.lat * Math.PI) / 180))) *
            Math.sin(angle);

        const simulatedPosition = {
          coords: {
            latitude: lat,
            longitude: lng,
            accuracy: 15,
          },
          timestamp: Date.now(),
        };

        console.log(
          `🧪 Simulando proximidade com ${mission.name} (${distance.toFixed(
            0
          )}m)`
        );
        this.gameEngine.onLocationUpdate(simulatedPosition);

        // Avançar para próxima missão após um tempo
        if (Math.random() > 0.7) {
          // 30% chance de avançar
          currentMissionIndex++;
        }
      }
    }, 5000); // A cada 5 segundos
  }

  getCurrentPositionPromise() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        this.gpsOptions
      );
    });
  }

  async startTracking() {
    if (this.isTracking) {
      console.log("📍 GPS já está sendo rastreado");
      return;
    }

    if (!gameState.get("permissions.location")) {
      throw new Error("Permissão de localização não concedida");
    }

    console.log("📍 Iniciando rastreamento GPS...");
    this.isTracking = true;

    try {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => this.onPositionUpdate(position),
        (error) => this.onPositionError(error),
        this.gpsOptions
      );

      console.log("✅ Rastreamento GPS iniciado");
    } catch (error) {
      console.error("❌ Erro ao iniciar rastreamento GPS:", error);
      this.isTracking = false;
      throw error;
    }
  }

  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.isTracking = false;
    console.log("📍 Rastreamento GPS parado");
  }

  onPositionUpdate(position) {
    console.log("📍 Nova posição GPS:", {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
    });

    // Calcular distância percorrida se houver posição anterior
    if (this.lastPosition) {
      const distance = this.calculateDistance(
        this.lastPosition.coords.latitude,
        this.lastPosition.coords.longitude,
        position.coords.latitude,
        position.coords.longitude
      );

      // Atualizar distância total se movimento significativo (> 5 metros)
      if (distance > 0.005) {
        const currentTotal = gameState.get("totalDistance") || 0;
        gameState.set("totalDistance", currentTotal + distance);
      }
    }

    this.lastPosition = position;
    this.gameEngine.onLocationUpdate(position);
  }

  onPositionError(error) {
    console.error("❌ Erro de GPS:", error);
    this.handleLocationError(error);
  }

  handleLocationError(error) {
    let message = "Erro de localização desconhecido";

    switch (error.code) {
      case error.PERMISSION_DENIED:
        message =
          "Permissão de localização negada. Ative a localização nas configurações do navegador.";
        gameState.set("permissions.location", false);
        break;
      case error.POSITION_UNAVAILABLE:
        message = "Localização indisponível. Verifique se o GPS está ativado.";
        break;
      case error.TIMEOUT:
        message = "Timeout na obtenção da localização. Tentando novamente...";
        // Não parar o rastreamento em caso de timeout
        return;
      default:
        message = `Erro de GPS: ${error.message}`;
    }

    console.warn("⚠️", message);

    if (this.gameEngine.managers.ui) {
      this.gameEngine.managers.ui.showError(message);
    }
  }

  // Fórmula de Haversine para calcular distância entre duas coordenadas
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distância em km

    return distance;
  }

  // Calcular distância em metros
  calculateDistanceInMeters(lat1, lon1, lat2, lon2) {
    return this.calculateDistance(lat1, lon1, lat2, lon2) * 1000;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Verificar proximidade com um ponto específico
  checkProximity(targetLat, targetLng, currentLat, currentLng) {
    const distance = this.calculateDistanceInMeters(
      currentLat,
      currentLng,
      targetLat,
      targetLng
    );

    return {
      distance: distance,
      isNear: distance <= GAME_CONFIG.proximityRadius,
      isVeryNear: distance <= GAME_CONFIG.activationRadius,
    };
  }

  // Encontrar missões próximas
  findNearbyMissions(currentPosition) {
    const nearbyMissions = [];

    MISSIONS.forEach((mission) => {
      const proximity = this.checkProximity(
        mission.coordinates.lat,
        mission.coordinates.lng,
        currentPosition.lat,
        currentPosition.lng
      );

      if (proximity.isNear) {
        nearbyMissions.push({
          mission: mission,
          distance: proximity.distance,
          canActivate: proximity.isVeryNear,
        });
      }
    });

    // Ordenar por distância (mais próximo primeiro)
    nearbyMissions.sort((a, b) => a.distance - b.distance);

    return nearbyMissions;
  }

  // Obter a missão mais próxima
  getClosestMission(currentPosition) {
    let closestMission = null;
    let closestDistance = Infinity;

    MISSIONS.forEach((mission) => {
      if (mission.completed) return;

      const distance = this.calculateDistanceInMeters(
        currentPosition.lat,
        currentPosition.lng,
        mission.coordinates.lat,
        mission.coordinates.lng
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestMission = {
          mission: mission,
          distance: distance,
        };
      }
    });

    return closestMission;
  }

  // Formatar distância para exibição
  formatDistance(distanceInMeters) {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)}m`;
    } else {
      return `${(distanceInMeters / 1000).toFixed(1)}km`;
    }
  }

  // Verificar se o GPS está disponível e ativo
  isGPSAvailable() {
    return "geolocation" in navigator;
  }

  // Obter precisão atual do GPS
  getCurrentAccuracy() {
    const currentPos = gameState.get("currentPosition");
    return currentPos ? currentPos.accuracy : null;
  }

  // Verificar se a precisão do GPS é boa o suficiente
  isAccuracyGood() {
    const accuracy = this.getCurrentAccuracy();
    return accuracy !== null && accuracy <= 50; // 50 metros ou melhor
  }
}

class ARManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.scene = null;
    this.camera = null;
    this.isInitialized = false;
    this.activeModels = new Map();
    this.permissionRequested = false;
  }

  async init() {
    console.log("🎥 Inicializando sistema AR...");

    try {
      // Verificar suporte WebXR
      if (!this.isWebXRSupported()) {
        console.warn("⚠️ WebXR não suportado neste dispositivo");
        return false;
      }

      // Configurar cena A-Frame
      this.setupScene();

      this.isInitialized = true;
      console.log("✅ Sistema AR inicializado");
      return true;
    } catch (error) {
      console.error("❌ Erro ao inicializar AR:", error);
      return false;
    }
  }

  async requestCameraPermission() {
    if (this.permissionRequested) {
      return gameState.get("permissions.camera");
    }

    this.permissionRequested = true;

    try {
      // Testar acesso à câmera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Câmera traseira
        },
      });

      // Parar o stream imediatamente (só testamos o acesso)
      stream.getTracks().forEach((track) => track.stop());

      console.log("✅ Permissão de câmera concedida");
      return true;
    } catch (error) {
      console.error("❌ Erro ao solicitar permissão de câmera:", error);
      this.handleCameraError(error);
      return false;
    }
  }

  setupScene() {
    // Obter referência da cena A-Frame
    this.scene = document.getElementById("ar-scene");

    if (!this.scene) {
      throw new Error("Cena AR não encontrada no DOM");
    }

    // Configurar eventos da cena
    this.scene.addEventListener("loaded", () => {
      console.log("✅ Cena AR carregada");
    });

    this.scene.addEventListener("enter-vr", () => {
      console.log("🎥 Modo AR ativado");
      gameState.set("isARActive", true);
    });

    this.scene.addEventListener("exit-vr", () => {
      console.log("🎥 Modo AR desativado");
      gameState.set("isARActive", false);
    });

    // Obter referência da câmera
    this.camera = this.scene.querySelector("a-camera");
  }

  activateAR() {
    if (!this.isInitialized) {
      console.warn("⚠️ Sistema AR não inicializado");
      return false;
    }

    if (!gameState.get("permissions.camera")) {
      console.warn("⚠️ Permissão de câmera não concedida");
      return false;
    }

    try {
      // Mostrar cena AR
      this.scene.classList.remove("hidden");

      // Mostrar overlay AR
      const arOverlay = document.getElementById("ar-overlay");
      const closeARBtn = document.getElementById("close-ar");

      if (arOverlay) arOverlay.classList.remove("hidden");
      if (closeARBtn) closeARBtn.classList.remove("hidden");

      // Configurar botão de fechar
      if (closeARBtn) {
        closeARBtn.onclick = () => this.deactivateAR();
      }

      gameState.set("isARActive", true);
      console.log("🎥 AR ativado");
      return true;
    } catch (error) {
      console.error("❌ Erro ao ativar AR:", error);
      return false;
    }
  }

  deactivateAR() {
    try {
      // Esconder cena AR
      this.scene.classList.add("hidden");

      // Esconder overlay AR
      const arOverlay = document.getElementById("ar-overlay");
      const closeARBtn = document.getElementById("close-ar");

      if (arOverlay) arOverlay.classList.add("hidden");
      if (closeARBtn) closeARBtn.classList.add("hidden");

      gameState.set("isARActive", false);
      console.log("🎥 AR desativado");
    } catch (error) {
      console.error("❌ Erro ao desativar AR:", error);
    }
  }

  loadModel(modelPath, mission) {
    if (!this.isInitialized || !this.scene) {
      console.warn("⚠️ Sistema AR não inicializado");
      return null;
    }

    try {
      // Remover modelo anterior se existir
      if (this.activeModels.has(mission.id)) {
        this.removeModel(mission.id);
      }

      // Criar elemento do modelo
      const modelEntity = document.createElement("a-entity");
      modelEntity.setAttribute("id", `model-${mission.id}`);
      modelEntity.setAttribute("gltf-model", modelPath);

      // Configurar posição e escala baseada no tipo de modelo
      if (modelPath.includes("portal")) {
        modelEntity.setAttribute("position", "0 0 -5");
        modelEntity.setAttribute("scale", "2 2 2");
        modelEntity.setAttribute("rotation", "0 0 0");
      } else if (modelPath.includes("demogorgon")) {
        modelEntity.setAttribute("position", "0 -1 -3");
        modelEntity.setAttribute("scale", "1.5 1.5 1.5");
        modelEntity.setAttribute("rotation", "0 180 0");
      }

      // Adicionar animações
      this.addModelAnimations(modelEntity, modelPath);

      // Adicionar à cena
      this.scene.appendChild(modelEntity);

      // Armazenar referência
      this.activeModels.set(mission.id, modelEntity);

      console.log("✅ Modelo 3D carregado:", modelPath);
      return modelEntity;
    } catch (error) {
      console.error("❌ Erro ao carregar modelo 3D:", error);
      return null;
    }
  }

  addModelAnimations(modelEntity, modelPath) {
    // Animação de rotação suave
    const rotationAnimation = document.createElement("a-animation");
    rotationAnimation.setAttribute("attribute", "rotation");
    rotationAnimation.setAttribute("dur", "10000");
    rotationAnimation.setAttribute("repeat", "indefinite");

    if (modelPath.includes("portal")) {
      // Portal gira lentamente
      rotationAnimation.setAttribute("to", "0 360 0");
      rotationAnimation.setAttribute("easing", "linear");
    } else if (modelPath.includes("demogorgon")) {
      // Demogorgon balança levemente
      rotationAnimation.setAttribute("to", "0 200 0");
      rotationAnimation.setAttribute("direction", "alternate");
      rotationAnimation.setAttribute("easing", "ease-in-out");
    }

    modelEntity.appendChild(rotationAnimation);

    // Animação de escala (pulsação)
    const scaleAnimation = document.createElement("a-animation");
    scaleAnimation.setAttribute("attribute", "scale");
    scaleAnimation.setAttribute("dur", "3000");
    scaleAnimation.setAttribute("repeat", "indefinite");
    scaleAnimation.setAttribute("direction", "alternate");
    scaleAnimation.setAttribute("easing", "ease-in-out");

    if (modelPath.includes("portal")) {
      scaleAnimation.setAttribute("to", "2.2 2.2 2.2");
    } else if (modelPath.includes("demogorgon")) {
      scaleAnimation.setAttribute("to", "1.7 1.7 1.7");
    }

    modelEntity.appendChild(scaleAnimation);
  }

  removeModel(missionId) {
    if (this.activeModels.has(missionId)) {
      const modelEntity = this.activeModels.get(missionId);

      if (modelEntity && modelEntity.parentNode) {
        modelEntity.parentNode.removeChild(modelEntity);
      }

      this.activeModels.delete(missionId);
      console.log("🗑️ Modelo 3D removido:", missionId);
    }
  }

  removeAllModels() {
    this.activeModels.forEach((modelEntity, missionId) => {
      this.removeModel(missionId);
    });
    console.log("🗑️ Todos os modelos 3D removidos");
  }

  updateAROverlay(mission) {
    const arMissionName = document.getElementById("ar-mission-name");
    if (arMissionName && mission) {
      arMissionName.textContent = mission.name;
    }
  }

  handleCameraError(error) {
    let message = "Erro de câmera desconhecido";

    if (error.name === "NotAllowedError") {
      message =
        "Permissão de câmera negada. A realidade aumentada não estará disponível.";
    } else if (error.name === "NotFoundError") {
      message = "Câmera não encontrada no dispositivo.";
    } else if (error.name === "NotSupportedError") {
      message = "Câmera não suportada neste navegador.";
    } else {
      message = `Erro de câmera: ${error.message}`;
    }

    console.warn("⚠️", message);

    if (this.gameEngine.managers.ui) {
      this.gameEngine.managers.ui.showError(message);
    }
  }

  isWebXRSupported() {
    // Verificar suporte básico
    if (!window.AFRAME) {
      console.warn("⚠️ A-Frame não carregado");
      return false;
    }

    // Verificar APIs necessárias
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("⚠️ getUserMedia não suportado");
      return false;
    }

    return true;
  }

  // Verificar se AR está disponível no dispositivo
  isARAvailable() {
    return this.isInitialized && gameState.get("permissions.camera");
  }

  // Obter estatísticas do AR
  getARStats() {
    return {
      isInitialized: this.isInitialized,
      isActive: gameState.get("isARActive"),
      activeModels: this.activeModels.size,
      hasPermission: gameState.get("permissions.camera"),
    };
  }
}

class AudioManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.audioElements = new Map();
    this.currentlyPlaying = null;
    this.isInitialized = false;
    this.preloadPromises = new Map();
    this.volume = GAME_CONFIG.audioVolume;
    this.isMuted = false;
  }

  async init() {
    console.log("🎵 Inicializando sistema de áudio...");

    try {
      // Verificar suporte de áudio
      if (!this.isAudioSupported()) {
        console.warn("⚠️ Áudio não suportado neste navegador");
        return false;
      }

      // Configurar contexto de áudio para mobile
      await this.setupAudioContext();

      this.isInitialized = true;
      console.log("✅ Sistema de áudio inicializado");
      return true;
    } catch (error) {
      console.error("❌ Erro ao inicializar áudio:", error);
      return false;
    }
  }

  async setupAudioContext() {
    // Criar contexto de áudio para contornar limitações mobile
    if (window.AudioContext || window.webkitAudioContext) {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextClass();

      // Resumir contexto se suspenso (necessário no mobile)
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume();
      }
    }
  }

  async preloadAudios() {
    console.log("🎵 Pré-carregando arquivos de áudio...");

    const preloadPromises = MISSIONS.map((mission) => {
      return this.loadAudio(mission.id, mission.audioFile);
    });

    try {
      await Promise.all(preloadPromises);
      console.log("✅ Todos os áudios pré-carregados");
      return true;
    } catch (error) {
      console.warn("⚠️ Alguns áudios falharam ao carregar:", error);
      return false;
    }
  }

  async loadAudio(id, audioPath) {
    // Evitar carregar o mesmo áudio múltiplas vezes
    if (this.audioElements.has(id)) {
      return this.audioElements.get(id);
    }

    // Verificar se já está sendo carregado
    if (this.preloadPromises.has(id)) {
      return this.preloadPromises.get(id);
    }

    const loadPromise = new Promise((resolve, reject) => {
      const audio = new Audio();

      // Configurações do elemento de áudio
      audio.preload = "auto";
      audio.volume = this.volume;
      audio.crossOrigin = "anonymous";

      // Event listeners
      audio.addEventListener("loadeddata", () => {
        console.log("✅ Áudio carregado:", audioPath);
        this.audioElements.set(id, audio);
        resolve(audio);
      });

      audio.addEventListener("error", (error) => {
        console.error("❌ Erro ao carregar áudio:", audioPath, error);
        reject(error);
      });

      audio.addEventListener("ended", () => {
        this.onAudioEnded(id);
      });

      // Iniciar carregamento
      audio.src = audioPath;
      audio.load();
    });

    this.preloadPromises.set(id, loadPromise);
    return loadPromise;
  }

  async playAudio(id, audioFile) {
    try {
      // Parar áudio atual se estiver tocando
      this.stopCurrentAudio();

      // Carregar áudio se não estiver carregado
      let audio = this.audioElements.get(id);
      if (!audio) {
        audio = await this.loadAudio(id, audioFile);
      }

      // Verificar se áudio está disponível
      if (!audio) {
        throw new Error(`Áudio não encontrado: ${audioFile}`);
      }

      // Configurar volume e estado
      audio.volume = this.isMuted ? 0 : this.volume;
      audio.currentTime = 0;

      // Reproduzir
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        await playPromise;
      }

      // Atualizar estado
      this.currentlyPlaying = { id, audio, audioFile };
      gameState.set("audioPlaying", id);

      console.log("🎵 Reproduzindo áudio:", audioFile);
      return true;
    } catch (error) {
      console.error("❌ Erro ao reproduzir áudio:", error);
      this.handleAudioError(error, audioFile);
      return false;
    }
  }

  pauseAudio(id) {
    const audio = this.audioElements.get(id);
    if (audio && !audio.paused) {
      audio.pause();
      console.log("⏸️ Áudio pausado:", id);
      return true;
    }
    return false;
  }

  resumeAudio(id) {
    const audio = this.audioElements.get(id);
    if (audio && audio.paused) {
      audio.play().catch((error) => {
        console.error("❌ Erro ao retomar áudio:", error);
      });
      console.log("▶️ Áudio retomado:", id);
      return true;
    }
    return false;
  }

  stopAudio(id) {
    const audio = this.audioElements.get(id);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;

      if (this.currentlyPlaying && this.currentlyPlaying.id === id) {
        this.currentlyPlaying = null;
        gameState.set("audioPlaying", null);
      }

      console.log("⏹️ Áudio parado:", id);
      return true;
    }
    return false;
  }

  stopCurrentAudio() {
    if (this.currentlyPlaying) {
      this.stopAudio(this.currentlyPlaying.id);
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));

    // Atualizar volume de todos os áudios
    this.audioElements.forEach((audio) => {
      audio.volume = this.isMuted ? 0 : this.volume;
    });

    console.log("🔊 Volume ajustado para:", this.volume);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;

    // Atualizar volume de todos os áudios
    this.audioElements.forEach((audio) => {
      audio.volume = this.isMuted ? 0 : this.volume;
    });

    console.log(this.isMuted ? "🔇 Áudio mutado" : "🔊 Áudio desmutado");
    return this.isMuted;
  }

  isPlaying(id) {
    const audio = this.audioElements.get(id);
    return audio && !audio.paused && !audio.ended;
  }

  getCurrentlyPlaying() {
    return this.currentlyPlaying;
  }

  onAudioEnded(id) {
    console.log("🎵 Áudio finalizado:", id);

    if (this.currentlyPlaying && this.currentlyPlaying.id === id) {
      this.currentlyPlaying = null;
      gameState.set("audioPlaying", null);
    }

    // Notificar UI sobre fim do áudio
    if (this.gameEngine && this.gameEngine.managers.ui) {
      this.gameEngine.managers.ui.onAudioEnded(id);
    }
  }

  handleAudioError(error, audioFile) {
    let message = "Erro de áudio desconhecido";

    if (error.name === "NotAllowedError") {
      message =
        "Reprodução de áudio bloqueada. Toque na tela para ativar o áudio.";
    } else if (error.name === "NotSupportedError") {
      message = "Formato de áudio não suportado.";
    } else if (error.message.includes("network")) {
      message = "Erro de rede ao carregar áudio. Verifique sua conexão.";
    } else {
      message = `Erro ao reproduzir áudio: ${error.message}`;
    }

    console.warn("⚠️", message);

    if (this.gameEngine && this.gameEngine.managers.ui) {
      this.gameEngine.managers.ui.showError(message);
    }
  }

  isAudioSupported() {
    return !!(window.Audio && document.createElement("audio").canPlayType);
  }

  // Verificar se um formato de áudio é suportado
  canPlayType(type) {
    const audio = document.createElement("audio");
    return audio.canPlayType(type);
  }

  // Obter duração de um áudio
  getDuration(id) {
    const audio = this.audioElements.get(id);
    return audio ? audio.duration : 0;
  }

  // Obter tempo atual de reprodução
  getCurrentTime(id) {
    const audio = this.audioElements.get(id);
    return audio ? audio.currentTime : 0;
  }

  // Definir tempo de reprodução
  setCurrentTime(id, time) {
    const audio = this.audioElements.get(id);
    if (audio) {
      audio.currentTime = Math.max(0, Math.min(time, audio.duration));
      return true;
    }
    return false;
  }

  // Obter estatísticas do sistema de áudio
  getAudioStats() {
    return {
      isInitialized: this.isInitialized,
      loadedAudios: this.audioElements.size,
      currentlyPlaying: this.currentlyPlaying ? this.currentlyPlaying.id : null,
      volume: this.volume,
      isMuted: this.isMuted,
      audioSupported: this.isAudioSupported(),
    };
  }

  // Limpar recursos de áudio
  cleanup() {
    this.stopCurrentAudio();

    this.audioElements.forEach((audio, id) => {
      audio.pause();
      audio.src = "";
      audio.load();
    });

    this.audioElements.clear();
    this.preloadPromises.clear();
    this.currentlyPlaying = null;

    console.log("🧹 Recursos de áudio limpos");
  }
}

class HapticManager {
  constructor() {
    this.isSupported = "vibrate" in navigator;
    this.isEnabled = true;
    this.lastVibrationTime = 0;
    this.vibrationCooldown = 1000; // 1 segundo entre vibrações
    this.intensityLevels = {
      subtle: [50],
      light: [100],
      medium: [200],
      strong: [300],
      pulse: [100, 50, 100],
      doublePulse: [100, 50, 100, 50, 100],
      heartbeat: [100, 30, 100, 30, 200],
    };

    console.log(
      this.isSupported ? "✅ Vibração suportada" : "⚠️ Vibração não suportada"
    );
  }

  // Vibração para ativação de missão
  vibrateActivation() {
    if (!this.canVibrate()) return false;

    const pattern = GAME_CONFIG.vibrationPatterns.activation;
    return this.vibrate(pattern, "activation");
  }

  // Vibração baseada na proximidade
  vibrateProximity(distance) {
    if (!this.canVibrate()) return false;

    // Calcular intensidade baseada na distância
    let pattern;

    if (distance <= 10) {
      // Muito próximo - vibração intensa
      pattern = this.intensityLevels.heartbeat;
    } else if (distance <= 20) {
      // Próximo - vibração média
      pattern = this.intensityLevels.doublePulse;
    } else if (distance <= 30) {
      // Moderadamente próximo - vibração leve
      pattern = this.intensityLevels.pulse;
    } else if (distance <= 40) {
      // Distante - vibração sutil
      pattern = this.intensityLevels.light;
    } else {
      // Muito distante - vibração muito sutil
      pattern = this.intensityLevels.subtle;
    }

    return this.vibrate(pattern, "proximity", distance);
  }

  // Vibração personalizada
  vibrate(pattern, type = "custom", metadata = null) {
    if (!this.canVibrate()) return false;

    try {
      // Verificar cooldown
      const now = Date.now();
      if (now - this.lastVibrationTime < this.vibrationCooldown) {
        return false;
      }

      // Executar vibração
      const success = navigator.vibrate(pattern);

      if (success) {
        this.lastVibrationTime = now;
        console.log(
          `📳 Vibração executada (${type}):`,
          pattern,
          metadata ? `- ${metadata}m` : ""
        );

        // Atualizar estado global
        gameState.set("lastVibration", now);

        return true;
      }
    } catch (error) {
      console.error("❌ Erro ao executar vibração:", error);
    }

    return false;
  }

  // Vibração de sucesso
  vibrateSuccess() {
    return this.vibrate([200, 100, 200], "success");
  }

  // Vibração de erro
  vibrateError() {
    return this.vibrate([100, 50, 100, 50, 100], "error");
  }

  // Vibração de notificação
  vibrateNotification() {
    return this.vibrate([150], "notification");
  }

  // Vibração de alerta
  vibrateAlert() {
    return this.vibrate([300, 100, 300], "alert");
  }

  // Vibração contínua (para situações especiais)
  vibrateContinuous(duration = 1000) {
    if (!this.canVibrate()) return false;

    const pattern = [];
    const pulseLength = 100;
    const pauseLength = 50;
    const totalCycles = Math.floor(duration / (pulseLength + pauseLength));

    for (let i = 0; i < totalCycles; i++) {
      pattern.push(pulseLength);
      if (i < totalCycles - 1) {
        pattern.push(pauseLength);
      }
    }

    return this.vibrate(pattern, "continuous", duration);
  }

  // Parar vibração
  stopVibration() {
    if (this.isSupported) {
      try {
        navigator.vibrate(0);
        console.log("🛑 Vibração parada");
        return true;
      } catch (error) {
        console.error("❌ Erro ao parar vibração:", error);
      }
    }
    return false;
  }

  // Verificar se pode vibrar
  canVibrate() {
    if (!this.isSupported) {
      console.warn("⚠️ Vibração não suportada neste dispositivo");
      return false;
    }

    if (!this.isEnabled) {
      console.log("📳 Vibração desabilitada pelo usuário");
      return false;
    }

    // Verificar se vibração está habilitada nas configurações do jogo
    const vibrationEnabled = gameState.get("settings.vibrationEnabled");
    if (vibrationEnabled === false) {
      console.log("📳 Vibração desabilitada nas configurações");
      return false;
    }

    return true;
  }

  // Habilitar/desabilitar vibração
  setEnabled(enabled) {
    this.isEnabled = enabled;
    gameState.set("settings.vibrationEnabled", enabled);
    console.log(
      enabled ? "✅ Vibração habilitada" : "❌ Vibração desabilitada"
    );
    return this.isEnabled;
  }

  // Alternar estado da vibração
  toggle() {
    return this.setEnabled(!this.isEnabled);
  }

  // Testar vibração
  test(intensity = "medium") {
    if (!this.isSupported) {
      console.warn("⚠️ Não é possível testar - vibração não suportada");
      return false;
    }

    const pattern =
      this.intensityLevels[intensity] || this.intensityLevels.medium;
    console.log("🧪 Testando vibração:", intensity);
    return this.vibrate(pattern, "test");
  }

  // Definir cooldown personalizado
  setCooldown(milliseconds) {
    this.vibrationCooldown = Math.max(0, milliseconds);
    console.log(
      "⏱️ Cooldown de vibração definido para:",
      this.vibrationCooldown,
      "ms"
    );
  }

  // Obter padrão de vibração baseado na distância
  getProximityPattern(distance) {
    if (distance <= 10) return this.intensityLevels.heartbeat;
    if (distance <= 20) return this.intensityLevels.doublePulse;
    if (distance <= 30) return this.intensityLevels.pulse;
    if (distance <= 40) return this.intensityLevels.light;
    return this.intensityLevels.subtle;
  }

  // Calcular intensidade baseada na proximidade (0-1)
  calculateIntensity(distance, maxDistance = 50) {
    const normalizedDistance = Math.min(distance, maxDistance) / maxDistance;
    return 1 - normalizedDistance; // Mais próximo = maior intensidade
  }

  // Vibração adaptativa baseada na velocidade de aproximação
  vibrateAdaptive(distance, previousDistance = null, deltaTime = 1000) {
    if (!this.canVibrate() || previousDistance === null) {
      return this.vibrateProximity(distance);
    }

    // Calcular velocidade de aproximação
    const deltaDistance = previousDistance - distance;
    const velocity = deltaDistance / (deltaTime / 1000); // metros por segundo

    let pattern;

    if (velocity > 2) {
      // Aproximando rapidamente
      pattern = this.intensityLevels.heartbeat;
    } else if (velocity > 1) {
      // Aproximando moderadamente
      pattern = this.intensityLevels.doublePulse;
    } else if (velocity > 0) {
      // Aproximando lentamente
      pattern = this.vibrateProximity(distance);
    } else {
      // Parado ou se afastando - vibração mínima
      pattern = this.intensityLevels.subtle;
    }

    return this.vibrate(pattern, "adaptive", {
      distance,
      velocity: velocity.toFixed(2),
    });
  }

  // Obter estatísticas do sistema de vibração
  getHapticStats() {
    return {
      isSupported: this.isSupported,
      isEnabled: this.isEnabled,
      lastVibrationTime: this.lastVibrationTime,
      cooldown: this.vibrationCooldown,
      availablePatterns: Object.keys(this.intensityLevels),
      canVibrate: this.canVibrate(),
    };
  }

  // Criar padrão personalizado
  createCustomPattern(pulses, pauses) {
    const pattern = [];
    const maxLength = Math.max(pulses.length, pauses.length);

    for (let i = 0; i < maxLength; i++) {
      if (i < pulses.length) {
        pattern.push(pulses[i]);
      }
      if (i < pauses.length) {
        pattern.push(pauses[i]);
      }
    }

    return pattern;
  }

  // Limpar recursos
  cleanup() {
    this.stopVibration();
    this.lastVibrationTime = 0;
    console.log("🧹 Recursos de vibração limpos");
  }
}

class MissionManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.lastProximityCheck = 0;
    this.proximityCheckInterval = 1000; // 1 segundo
    this.lastVibrationTime = 0;
    this.vibrationCooldown = 2000; // 2 segundos
  }

  checkMissionActivation(position) {
    const now = Date.now();

    // Throttling para evitar muitas verificações
    if (now - this.lastProximityCheck < this.proximityCheckInterval) {
      return;
    }

    this.lastProximityCheck = now;

    // Encontrar missões próximas
    const nearbyMissions =
      this.gameEngine.managers.location.findNearbyMissions(position);
    gameState.set("nearbyMissions", nearbyMissions);

    // Verificar ativação de missões
    nearbyMissions.forEach(({ mission, distance, canActivate }) => {
      if (canActivate && !mission.completed) {
        this.activateMission(mission);
      } else if (distance <= GAME_CONFIG.proximityRadius) {
        // Vibração de proximidade
        this.handleProximityVibration(distance);
      }
    });

    // Atualizar informações da missão mais próxima na UI
    this.updateClosestMissionInfo(position);
  }

  checkProximity(position) {
    // Alias para checkMissionActivation para compatibilidade
    this.checkMissionActivation(position);
  }

  activateMission(mission) {
    const currentActive = gameState.get("activeMission");

    // Evitar reativar a mesma missão
    if (currentActive && currentActive.id === mission.id) {
      return;
    }

    console.log("🎯 Ativando missão:", mission.name);

    // Notificar o GameEngine
    this.gameEngine.onMissionActivated(mission);

    // Marcar como concluída após um tempo
    setTimeout(() => {
      this.completeMission(mission);
    }, 3000); // 3 segundos para "completar" a missão
  }

  completeMission(mission) {
    if (mission.completed) return;

    console.log("✅ Completando missão:", mission.name);

    // Salvar timestamp de conclusão
    this.saveMissionCompletion(mission.id);

    // Notificar o GameEngine
    this.gameEngine.onMissionCompleted(mission);
  }

  handleProximityVibration(distance) {
    const now = Date.now();

    // Cooldown para vibração
    if (now - this.lastVibrationTime < this.vibrationCooldown) {
      return;
    }

    // Vibração baseada na distância
    if (distance <= GAME_CONFIG.proximityRadius) {
      this.gameEngine.managers.haptic.vibrateProximity(distance);
      this.lastVibrationTime = now;
    }
  }

  updateClosestMissionInfo(position) {
    const closestMission =
      this.gameEngine.managers.location.getClosestMission(position);

    if (closestMission) {
      const formattedDistance =
        this.gameEngine.managers.location.formatDistance(
          closestMission.distance
        );

      // Atualizar UI com informações da missão mais próxima
      if (this.gameEngine.managers.ui) {
        this.gameEngine.managers.ui.updateMissionDistance(
          closestMission.mission.name,
          formattedDistance,
          closestMission.distance <= GAME_CONFIG.activationRadius
        );
      }
    }
  }

  // Obter progresso das missões
  getProgress() {
    const completed = gameState.get("completedMissions").length;
    const total = gameState.get("totalMissions");

    return {
      completed: completed,
      total: total,
      percentage: (completed / total) * 100,
    };
  }

  // Verificar se todas as missões foram concluídas
  isAllCompleted() {
    return (
      gameState.get("completedMissions").length ===
      gameState.get("totalMissions")
    );
  }

  // Obter missões disponíveis (não concluídas)
  getAvailableMissions() {
    return MISSIONS.filter((mission) => !mission.completed);
  }

  // Obter missões concluídas
  getCompletedMissions() {
    const completedIds = gameState.get("completedMissions");
    return MISSIONS.filter((mission) => completedIds.includes(mission.id));
  }

  // Resetar todas as missões
  resetMissions() {
    MISSIONS.forEach((mission) => {
      mission.completed = false;
    });
    gameState.set("completedMissions", []);
    gameState.set("activeMission", null);
  }

  // Obter estatísticas das missões
  getStatistics() {
    const progress = this.getProgress();
    const totalDistance = gameState.get("totalDistance") || 0;
    const sessionTime = gameState.get("sessionTime") || 0;
    const completedMissions = gameState.get("completedMissions");

    return {
      progress: progress,
      totalDistance: totalDistance,
      sessionTime: sessionTime,
      averageTimePerMission:
        progress.completed > 0 ? sessionTime / progress.completed : 0,
      completedMissionIds: completedMissions,
      remainingMissions: this.getAvailableMissions().length,
      completionRate: (progress.completed / progress.total) * 100,
    };
  }

  // Sistema avançado de progressão
  getMissionHistory() {
    const completedIds = gameState.get("completedMissions");
    const history = [];

    completedIds.forEach((missionId) => {
      const mission = MISSIONS.find((m) => m.id === missionId);
      if (mission) {
        history.push({
          id: mission.id,
          name: mission.name,
          description: mission.description,
          completedAt: this.getMissionCompletionTime(missionId),
          hasAR: !!mission.arModel,
          coordinates: mission.coordinates,
        });
      }
    });

    return history;
  }

  // Obter próxima missão recomendada
  getNextRecommendedMission(currentPosition) {
    const availableMissions = this.getAvailableMissions();

    if (availableMissions.length === 0) {
      return null;
    }

    if (!currentPosition || !currentPosition.lat || !currentPosition.lng) {
      // Se não há posição, retornar primeira missão disponível
      return availableMissions[0];
    }

    // Encontrar missão mais próxima
    let closestMission = null;
    let closestDistance = Infinity;

    availableMissions.forEach((mission) => {
      const distance =
        this.gameEngine.managers.location.calculateDistanceInMeters(
          currentPosition.lat,
          currentPosition.lng,
          mission.coordinates.lat,
          mission.coordinates.lng
        );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestMission = mission;
      }
    });

    return closestMission
      ? {
          mission: closestMission,
          distance: closestDistance,
          formattedDistance:
            this.gameEngine.managers.location.formatDistance(closestDistance),
        }
      : null;
  }

  // Sistema de conquistas
  checkAchievements() {
    const stats = this.getStatistics();
    const achievements = [];

    // Conquista: Primeira missão
    if (stats.progress.completed >= 1) {
      achievements.push({
        id: "first_mission",
        name: "Primeiro Contato",
        description: "Complete sua primeira missão",
        icon: "🎯",
        unlocked: true,
      });
    }

    // Conquista: Metade das missões
    if (stats.progress.completed >= Math.ceil(stats.progress.total / 2)) {
      achievements.push({
        id: "halfway",
        name: "Meio Caminho",
        description: "Complete metade das missões",
        icon: "🏃‍♂️",
        unlocked: true,
      });
    }

    // Conquista: Todas as missões
    if (stats.progress.completed === stats.progress.total) {
      achievements.push({
        id: "completionist",
        name: "Explorador do Mundo Invertido",
        description: "Complete todas as missões",
        icon: "🏆",
        unlocked: true,
      });
    }

    // Conquista: Distância percorrida
    if (stats.totalDistance >= 1) {
      achievements.push({
        id: "walker",
        name: "Caminhante",
        description: "Percorra pelo menos 1km",
        icon: "🚶‍♂️",
        unlocked: true,
      });
    }

    // Conquista: Tempo de jogo
    if (stats.sessionTime >= 30 * 60 * 1000) {
      // 30 minutos
      achievements.push({
        id: "dedicated",
        name: "Dedicado",
        description: "Jogue por pelo menos 30 minutos",
        icon: "⏰",
        unlocked: true,
      });
    }

    return achievements;
  }

  // Salvar timestamp de conclusão da missão
  saveMissionCompletion(missionId) {
    const completionData = this.getCompletionData();
    completionData[missionId] = {
      completedAt: Date.now(),
      sessionTime: gameState.get("sessionTime") || 0,
      totalDistance: gameState.get("totalDistance") || 0,
    };

    localStorage.setItem(
      "strangerthings_completions",
      JSON.stringify(completionData)
    );
  }

  // Obter dados de conclusão salvos
  getCompletionData() {
    try {
      const saved = localStorage.getItem("strangerthings_completions");
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.warn("⚠️ Erro ao carregar dados de conclusão:", error);
      return {};
    }
  }

  // Obter tempo de conclusão de uma missão específica
  getMissionCompletionTime(missionId) {
    const completionData = this.getCompletionData();
    return completionData[missionId]
      ? completionData[missionId].completedAt
      : null;
  }

  // Calcular tempo entre missões
  getTimeBetweenMissions() {
    const completionData = this.getCompletionData();
    const completedIds = gameState.get("completedMissions");
    const times = [];

    for (let i = 1; i < completedIds.length; i++) {
      const prevTime = completionData[completedIds[i - 1]]?.completedAt;
      const currTime = completionData[completedIds[i]]?.completedAt;

      if (prevTime && currTime) {
        times.push(currTime - prevTime);
      }
    }

    return times;
  }

  // Obter missão por ID
  getMissionById(missionId) {
    return MISSIONS.find((mission) => mission.id === missionId);
  }

  // Verificar se missão está próxima
  isMissionNearby(
    missionId,
    currentPosition,
    radius = GAME_CONFIG.proximityRadius
  ) {
    const mission = this.getMissionById(missionId);
    if (!mission || !currentPosition.lat || !currentPosition.lng) {
      return false;
    }

    const distance =
      this.gameEngine.managers.location.calculateDistanceInMeters(
        currentPosition.lat,
        currentPosition.lng,
        mission.coordinates.lat,
        mission.coordinates.lng
      );

    return distance <= radius;
  }

  // Obter missões por categoria
  getMissionsByCategory() {
    return {
      withAR: MISSIONS.filter((m) => m.arModel),
      withoutAR: MISSIONS.filter((m) => !m.arModel),
      completed: this.getCompletedMissions(),
      available: this.getAvailableMissions(),
      nearby: gameState.get("nearbyMissions") || [],
    };
  }

  // Exportar progresso para compartilhamento
  exportProgress() {
    const stats = this.getStatistics();
    const achievements = this.checkAchievements();
    const history = this.getMissionHistory();

    return {
      gameVersion: "1.0.0",
      exportedAt: Date.now(),
      statistics: stats,
      achievements: achievements,
      missionHistory: history,
      totalPlayTime: this.formatTime(stats.sessionTime),
      completionPercentage: stats.completionRate.toFixed(1) + "%",
    };
  }

  // Formatar tempo para exibição
  formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Validar integridade das missões
  validateMissions() {
    const issues = [];

    MISSIONS.forEach((mission) => {
      // Verificar campos obrigatórios
      if (!mission.id) issues.push(`Missão sem ID: ${mission.name}`);
      if (!mission.name) issues.push(`Missão sem nome: ${mission.id}`);
      if (!mission.coordinates)
        issues.push(`Missão sem coordenadas: ${mission.id}`);
      if (!mission.audioFile) issues.push(`Missão sem áudio: ${mission.id}`);

      // Verificar coordenadas válidas
      if (mission.coordinates) {
        if (
          typeof mission.coordinates.lat !== "number" ||
          typeof mission.coordinates.lng !== "number"
        ) {
          issues.push(`Coordenadas inválidas: ${mission.id}`);
        }
      }
    });

    if (issues.length > 0) {
      console.warn("⚠️ Problemas encontrados nas missões:", issues);
    }

    return issues;
  }

  // Limpar dados de progressão
  clearProgress() {
    localStorage.removeItem("strangerthings_progress");
    localStorage.removeItem("strangerthings_completions");
    this.resetMissions();
    console.log("🧹 Progresso limpo");
  }
}

class UIManager {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.elements = {};
  }

  init() {
    // Cache de elementos DOM
    this.elements = {
      loadingScreen: document.getElementById("loading-screen"),
      welcomeScreen: document.getElementById("welcome-screen"),
      gameScreen: document.getElementById("game-screen"),
      helpScreen: document.getElementById("help-screen"),
      completionScreen: document.getElementById("completion-screen"),
      errorContainer: document.getElementById("error-container"),

      startGameBtn: document.getElementById("start-game"),
      helpBtn: document.getElementById("help-btn"),
      backToWelcomeBtn: document.getElementById("back-to-welcome"),
      restartGameBtn: document.getElementById("restart-game"),

      completedMissions: document.getElementById("completed-missions"),
      totalMissions: document.getElementById("total-missions"),
      progressFill: document.getElementById("progress-fill"),
      currentMission: document.getElementById("current-mission"),
      missionDistance: document.getElementById("mission-distance"),

      activateARBtn: document.getElementById("activate-ar"),
      playAudioBtn: document.getElementById("play-audio"),
    };

    // Event listeners
    this.setupEventListeners();

    // Atualizar total de missões
    this.elements.totalMissions.textContent = gameState.get("totalMissions");
  }

  setupEventListeners() {
    this.elements.startGameBtn.addEventListener("click", () => {
      this.gameEngine.start();
    });

    // Botão Modo Teste
    const testModeBtn = document.getElementById("test-mode");
    if (testModeBtn) {
      testModeBtn.addEventListener("click", () => {
        this.startTestMode();
      });
    }

    this.elements.helpBtn.addEventListener("click", () => {
      this.showScreen("help");
    });

    this.elements.backToWelcomeBtn.addEventListener("click", () => {
      this.showScreen("welcome");
    });

    this.elements.restartGameBtn.addEventListener("click", () => {
      this.gameEngine.restart();
    });

    // Event listeners para AR
    this.elements.activateARBtn.addEventListener("click", () => {
      this.activateAR();
    });

    this.elements.playAudioBtn.addEventListener("click", () => {
      this.replayCurrentAudio();
    });

    // Event listeners para navegação
    this.setupNavigationListeners();

    // Event listeners para configurações
    this.setupSettingsListeners();
  }

  activateAR() {
    const activeMission = gameState.get("activeMission");

    if (!activeMission) {
      this.showError("Nenhuma missão ativa para mostrar em AR");
      return;
    }

    console.log("🎥 Tentando ativar AR para missão:", activeMission.name);

    // Verificar se tem modelo AR
    if (!activeMission.arModel) {
      // Para missões sem modelo AR, mostrar uma experiência alternativa
      this.showARAlternative(activeMission);
      return;
    }

    // Tentar solicitar permissão de câmera
    this.requestCameraAndActivateAR(activeMission);
  }

  async requestCameraAndActivateAR(mission) {
    try {
      // Solicitar permissão de câmera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });

      // Parar o stream imediatamente (só testamos o acesso)
      stream.getTracks().forEach(track => track.stop());

      // Permissão concedida, ativar AR
      this.activateARScene(mission);

    } catch (error) {
      console.error("❌ Erro ao solicitar câmera:", error);
      
      if (error.name === "NotAllowedError") {
        this.showError("Permissão de câmera negada. Ative a câmera nas configurações do navegador.");
      } else if (error.name === "NotFoundError") {
        this.showError("Câmera não encontrada no dispositivo.");
      } else {
        this.showError("Erro ao acessar a câmera. Verifique as permissões.");
      }
    }
  }

  activateARScene(mission) {
    try {
      // Mostrar cena AR
      const arScene = document.getElementById("ar-scene");
      const arOverlay = document.getElementById("ar-overlay");
      const closeARBtn = document.getElementById("close-ar");

      if (arScene) {
        arScene.classList.remove("hidden");
        console.log("✅ Cena AR mostrada");
      }

      if (arOverlay) {
        arOverlay.classList.remove("hidden");
        const missionName = arOverlay.querySelector("#ar-mission-name");
        if (missionName) {
          missionName.textContent = mission.name;
        }
      }

      if (closeARBtn) {
        closeARBtn.classList.remove("hidden");
        closeARBtn.onclick = () => this.deactivateARScene();
      }

      // Adicionar modelo se existir
      if (mission.arModel) {
        this.addARModel(mission);
      }

      this.showSuccess("Realidade Aumentada ativada! Mova o celular para explorar.");
      
      // Vibração de confirmação
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }

    } catch (error) {
      console.error("❌ Erro ao ativar cena AR:", error);
      this.showError("Erro ao ativar realidade aumentada.");
    }
  }

  deactivateARScene() {
    const arScene = document.getElementById("ar-scene");
    const arOverlay = document.getElementById("ar-overlay");
    const closeARBtn = document.getElementById("close-ar");

    if (arScene) arScene.classList.add("hidden");
    if (arOverlay) arOverlay.classList.add("hidden");
    if (closeARBtn) closeARBtn.classList.add("hidden");

    console.log("🎥 AR desativado");
  }

  addARModel(mission) {
    // Implementação simplificada para adicionar modelo AR
    console.log("🎯 Adicionando modelo AR:", mission.arModel);
    
    // Aqui você pode adicionar lógica específica para cada modelo
    if (mission.arModel.includes("portal")) {
      console.log("🌀 Portal do Mundo Invertido detectado!");
    } else if (mission.arModel.includes("demogorgon")) {
      console.log("👾 Demogorgon detectado!");
    }
  }

  showARAlternative(mission) {
    // Para missões sem AR, mostrar uma experiência alternativa
    const messages = {
      "poste": "🔦 Aponte a câmera para o poste e imagine portais se abrindo ao seu redor...",
      "casa": "🏠 Esta casa guarda segredos do Mundo Invertido...",
      "unisul": "🏫 A universidade esconde laboratórios secretos...",
      "floresta": "🌲 As árvores sussurram segredos antigos...",
      "praca": "🏛️ O centro da cidade, onde tudo começou..."
    };

    const message = messages[mission.id] || "✨ Use sua imaginação para ver o Mundo Invertido!";
    
    alert(`🎭 Experiência Imersiva\n\n${message}\n\n🎵 Ouça atentamente as palavras do Dustin enquanto explora este local misterioso.`);
    
    // Marcar missão como completada após a experiência
    setTimeout(() => {
      this.completeMission(mission);
    }, 2000);
  }

  completeMission(mission) {
    if (!mission.completed) {
      mission.completed = true;
      const completed = gameState.get("completedMissions");
      completed.push(mission.id);
      gameState.set("completedMissions", completed);
      
      this.showSuccess(`🏆 Missão "${mission.name}" completada!`);
      
      // Vibração de sucesso
      if (navigator.vibrate) {
        navigator.vibrate([300, 100, 300, 100, 300]);
      }
    }
  }

  replayCurrentAudio() {
    const activeMission = gameState.get("activeMission");

    if (!activeMission) {
      this.showError("Nenhuma missão ativa para reproduzir áudio");
      return;
    }

    // Reproduzir áudio da missão ativa
    this.gameEngine.managers.audio.playAudio(
      activeMission.id,
      activeMission.audioFile
    );
    this.showSuccess("Reproduzindo áudio do Dustin...");
  }

  onAudioEnded(audioId) {
    console.log("🎵 UI notificada: áudio finalizado", audioId);

    // Atualizar estado visual dos controles de áudio
    const playAudioBtn = this.elements.playAudioBtn;
    if (playAudioBtn) {
      playAudioBtn.textContent = "Reproduzir Áudio";
      playAudioBtn.disabled = false;
    }

    // Mostrar mensagem de conclusão
    this.showSuccess(
      "Áudio do Dustin finalizado. Você pode reproduzi-lo novamente se desejar."
    );
  }

  showScreen(screenName) {
    // Esconder todas as telas
    Object.values(this.elements).forEach((element) => {
      if (
        element &&
        element.classList &&
        element.classList.contains("hidden")
      ) {
        return;
      }
      if (element && element.id && element.id.includes("-screen")) {
        element.classList.add("hidden");
      }
    });

    // Mostrar tela solicitada
    const screen = this.elements[screenName + "Screen"];
    if (screen) {
      screen.classList.remove("hidden");
      gameState.set("currentScreen", screenName);
    }
  }

  updateGameScreen() {
    // Atualizar progresso
    const completedCount = gameState.get("completedMissions").length;
    const totalCount = gameState.get("totalMissions");

    this.elements.completedMissions.textContent = completedCount;
    const progressPercent = (completedCount / totalCount) * 100;
    this.elements.progressFill.style.width = progressPercent + "%";

    // Atualizar próxima missão recomendada
    this.updateNextMissionInfo();

    // Atualizar estatísticas se disponível
    this.updateSessionStats();
  }

  updateNextMissionInfo() {
    const currentPos = gameState.get("currentPosition");
    if (!currentPos.lat || !currentPos.lng) return;

    const nextMission =
      this.gameEngine.managers.mission.getNextRecommendedMission(currentPos);

    if (nextMission && this.elements.currentMission) {
      // Se não há missão ativa, mostrar próxima recomendada
      const activeMission = gameState.get("activeMission");
      if (!activeMission) {
        this.elements.currentMission.textContent = `Próxima: ${nextMission.mission.name}`;
        this.elements.missionDistance.textContent = `📍 ${nextMission.formattedDistance}`;
        this.elements.missionDistance.style.color = "#cccccc";
      }
    }
  }

  updateSessionStats() {
    // Atualizar estatísticas da sessão se houver elementos para isso
    const sessionTime = gameState.get("sessionTime") || 0;
    const totalDistance = gameState.get("totalDistance") || 0;

    // Formatar tempo de sessão
    const formattedTime = this.formatSessionTime(sessionTime);
    const formattedDistance = this.gameEngine.managers.location.formatDistance(
      totalDistance * 1000
    );

    // Atualizar elementos se existirem (podem ser adicionados futuramente)
    const sessionTimeElement = document.getElementById("session-time");
    const totalDistanceElement = document.getElementById("total-distance");

    if (sessionTimeElement) {
      sessionTimeElement.textContent = formattedTime;
    }

    if (totalDistanceElement) {
      totalDistanceElement.textContent = formattedDistance;
    }
  }

  formatSessionTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  }

  showProgressSummary() {
    const stats = this.gameEngine.managers.mission.getStatistics();
    const achievements = this.gameEngine.managers.mission.checkAchievements();

    let summaryHTML = `
            <div class="progress-summary">
                <h3>📊 Resumo do Progresso</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">Missões:</span>
                        <span class="stat-value">${stats.progress.completed}/${
      stats.progress.total
    }</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Progresso:</span>
                        <span class="stat-value">${stats.completionRate.toFixed(
                          1
                        )}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Distância:</span>
                        <span class="stat-value">${this.gameEngine.managers.location.formatDistance(
                          stats.totalDistance * 1000
                        )}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Tempo:</span>
                        <span class="stat-value">${this.formatSessionTime(
                          stats.sessionTime
                        )}</span>
                    </div>
                </div>
        `;

    if (achievements.length > 0) {
      summaryHTML += `
                <div class="achievements">
                    <h4>🏆 Conquistas</h4>
                    <div class="achievement-list">
            `;

      achievements.forEach((achievement) => {
        summaryHTML += `
                    <div class="achievement-item">
                        <span class="achievement-icon">${achievement.icon}</span>
                        <div class="achievement-info">
                            <div class="achievement-name">${achievement.name}</div>
                            <div class="achievement-desc">${achievement.description}</div>
                        </div>
                    </div>
                `;
      });

      summaryHTML += `
                    </div>
                </div>
            `;
    }

    summaryHTML += `</div>`;

    // Criar modal ou atualizar área específica
    this.showModal("Progresso", summaryHTML);
  }

  showModal(title, content) {
    // Criar modal se não existir
    let modal = document.getElementById("game-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "game-modal";
      modal.className = "modal hidden";
      modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 id="modal-title"></h2>
                        <button id="modal-close" class="btn btn-secondary">×</button>
                    </div>
                    <div class="modal-body" id="modal-body"></div>
                </div>
            `;
      document.body.appendChild(modal);

      // Event listener para fechar
      document.getElementById("modal-close").addEventListener("click", () => {
        this.hideModal();
      });

      // Fechar ao clicar fora
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.hideModal();
        }
      });
    }

    // Atualizar conteúdo
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-body").innerHTML = content;

    // Mostrar modal
    modal.classList.remove("hidden");
  }

  hideModal() {
    const modal = document.getElementById("game-modal");
    if (modal) {
      modal.classList.add("hidden");
    }
  }

  setupNavigationListeners() {
    // Navigation buttons
    const navButtons = {
      game: document.getElementById("nav-game"),
      missions: document.getElementById("nav-missions"),
      stats: document.getElementById("nav-stats"),
      settings: document.getElementById("nav-settings"),
    };

    Object.entries(navButtons).forEach(([screen, button]) => {
      if (button) {
        button.addEventListener("click", () => {
          this.switchToScreen(screen);
          this.updateActiveNavButton(screen);
        });
      }
    });

    // Show navigation when game starts
    gameState.addListener("isRunning", (isRunning) => {
      const navMenu = document.getElementById("nav-menu");
      const statusIndicators = document.getElementById("status-indicators");

      if (isRunning) {
        if (navMenu) navMenu.classList.remove("hidden");
        if (statusIndicators) statusIndicators.classList.remove("hidden");
        this.updateStatusIndicators();
      } else {
        if (navMenu) navMenu.classList.add("hidden");
        if (statusIndicators) statusIndicators.classList.add("hidden");
      }
    });
  }

  setupSettingsListeners() {
    // Sound toggle
    const soundToggle = document.getElementById("sound-toggle");
    if (soundToggle) {
      soundToggle.addEventListener("change", (e) => {
        gameState.set("settings.soundEnabled", e.target.checked);
        if (this.gameEngine.managers.audio) {
          this.gameEngine.managers.audio.toggleMute();
        }
      });
    }

    // Vibration toggle
    const vibrationToggle = document.getElementById("vibration-toggle");
    if (vibrationToggle) {
      vibrationToggle.addEventListener("change", (e) => {
        gameState.set("settings.vibrationEnabled", e.target.checked);
        if (this.gameEngine.managers.haptic) {
          this.gameEngine.managers.haptic.setEnabled(e.target.checked);
        }
      });
    }

    // Volume slider
    const volumeSlider = document.getElementById("volume-slider");
    const volumeValue = document.getElementById("volume-value");
    if (volumeSlider && volumeValue) {
      volumeSlider.addEventListener("input", (e) => {
        const volume = e.target.value / 100;
        volumeValue.textContent = e.target.value + "%";
        if (this.gameEngine.managers.audio) {
          this.gameEngine.managers.audio.setVolume(volume);
        }
      });
    }

    // Clear progress
    const clearProgressBtn = document.getElementById("clear-progress");
    if (clearProgressBtn) {
      clearProgressBtn.addEventListener("click", () => {
        if (
          confirm(
            "Tem certeza que deseja limpar todo o progresso? Esta ação não pode ser desfeita."
          )
        ) {
          this.gameEngine.managers.mission.clearProgress();
          this.showSuccess("Progresso limpo com sucesso!");
          setTimeout(() => {
            location.reload();
          }, 2000);
        }
      });
    }

    // Export progress
    const exportProgressBtn = document.getElementById("export-progress");
    if (exportProgressBtn) {
      exportProgressBtn.addEventListener("click", () => {
        const progressData = this.gameEngine.managers.mission.exportProgress();
        const dataStr = JSON.stringify(progressData, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(dataBlob);
        link.download = `stranger-things-progress-${
          new Date().toISOString().split("T")[0]
        }.json`;
        link.click();

        this.showSuccess("Dados exportados com sucesso!");
      });
    }
  }

  switchToScreen(screenName) {
    // Hide all screens
    const screens = ["game", "missions", "stats", "settings"];
    screens.forEach((screen) => {
      const element = document.getElementById(`${screen}-screen`);
      if (element) {
        element.classList.add("hidden");
      }
    });

    // Show requested screen
    const targetScreen = document.getElementById(`${screenName}-screen`);
    if (targetScreen) {
      targetScreen.classList.remove("hidden");

      // Update content based on screen
      switch (screenName) {
        case "missions":
          this.updateMissionsScreen();
          break;
        case "stats":
          this.updateStatsScreen();
          break;
        case "settings":
          this.updateSettingsScreen();
          break;
      }
    }

    gameState.set("currentScreen", screenName);
  }

  updateActiveNavButton(activeScreen) {
    const navButtons = document.querySelectorAll(".nav-btn");
    navButtons.forEach((btn) => btn.classList.remove("active"));

    const activeButton = document.getElementById(`nav-${activeScreen}`);
    if (activeButton) {
      activeButton.classList.add("active");
    }
  }

  updateStatusIndicators() {
    const gpsStatus = document.getElementById("gps-status");
    const cameraStatus = document.getElementById("camera-status");
    const audioStatus = document.getElementById("audio-status");

    if (gpsStatus) {
      const hasGPS = gameState.get("permissions.location");
      gpsStatus.className = `status-indicator ${hasGPS ? "good" : "error"}`;
    }

    if (cameraStatus) {
      const hasCamera = gameState.get("permissions.camera");
      cameraStatus.className = `status-indicator ${
        hasCamera ? "good" : "warning"
      }`;
    }

    if (audioStatus) {
      const audioPlaying = gameState.get("audioPlaying");
      audioStatus.className = `status-indicator ${
        audioPlaying ? "good" : "warning"
      }`;
    }
  }

  updateMissionsScreen() {
    const missionList = document.getElementById("mission-list");
    if (!missionList) return;

    const currentPos = gameState.get("currentPosition");
    const activeMission = gameState.get("activeMission");
    const completedMissions = gameState.get("completedMissions");

    missionList.innerHTML = "";

    MISSIONS.forEach((mission) => {
      const missionElement = document.createElement("div");
      missionElement.className = "mission-item";

      // Add status classes
      if (mission.completed) {
        missionElement.classList.add("completed");
      } else if (activeMission && activeMission.id === mission.id) {
        missionElement.classList.add("active");
      }

      // Calculate distance if position available
      let distanceText = "";
      if (currentPos.lat && currentPos.lng) {
        const distance =
          this.gameEngine.managers.location.calculateDistanceInMeters(
            currentPos.lat,
            currentPos.lng,
            mission.coordinates.lat,
            mission.coordinates.lng
          );
        distanceText =
          this.gameEngine.managers.location.formatDistance(distance);
      }

      // Status text
      let statusText = "Disponível";
      if (mission.completed) {
        statusText = "Concluída";
      } else if (activeMission && activeMission.id === mission.id) {
        statusText = "Ativa";
      }

      missionElement.innerHTML = `
                <div class="mission-header">
                    <div class="mission-name">${mission.name}</div>
                    <div class="mission-status">${statusText}</div>
                </div>
                <div class="mission-description">${mission.description}</div>
                <div class="mission-meta">
                    <span>${mission.arModel ? "🎥 AR" : "🎵 Áudio"}</span>
                    <span>${distanceText}</span>
                </div>
            `;

      missionList.appendChild(missionElement);
    });
  }

  updateStatsScreen() {
    const statsContent = document.getElementById("stats-content");
    if (!statsContent) return;

    const stats = this.gameEngine.managers.mission.getStatistics();
    const achievements = this.gameEngine.managers.mission.checkAchievements();

    statsContent.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">Progresso:</span>
                    <span class="stat-value">${stats.progress.completed}/${
      stats.progress.total
    }</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Conclusão:</span>
                    <span class="stat-value">${stats.completionRate.toFixed(
                      1
                    )}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Tempo:</span>
                    <span class="stat-value">${this.formatSessionTime(
                      stats.sessionTime
                    )}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Distância:</span>
                    <span class="stat-value">${this.gameEngine.managers.location.formatDistance(
                      stats.totalDistance * 1000
                    )}</span>
                </div>
            </div>
            
            ${
              achievements.length > 0
                ? `
                <div class="achievements">
                    <h4>🏆 Conquistas Desbloqueadas</h4>
                    <div class="achievement-list">
                        ${achievements
                          .map(
                            (achievement) => `
                            <div class="achievement-item">
                                <span class="achievement-icon">${achievement.icon}</span>
                                <div class="achievement-info">
                                    <div class="achievement-name">${achievement.name}</div>
                                    <div class="achievement-desc">${achievement.description}</div>
                                </div>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                </div>
            `
                : '<p style="text-align: center; color: #cccccc; margin-top: 20px;">Nenhuma conquista desbloqueada ainda.</p>'
            }
        `;
  }

  updateSettingsScreen() {
    // Update toggle states based on current settings
    const soundToggle = document.getElementById("sound-toggle");
    const vibrationToggle = document.getElementById("vibration-toggle");
    const volumeSlider = document.getElementById("volume-slider");
    const volumeValue = document.getElementById("volume-value");

    if (soundToggle) {
      soundToggle.checked = gameState.get("settings.soundEnabled");
    }

    if (vibrationToggle) {
      vibrationToggle.checked = gameState.get("settings.vibrationEnabled");
    }

    if (volumeSlider && volumeValue && this.gameEngine.managers.audio) {
      const volume = Math.round(this.gameEngine.managers.audio.volume * 100);
      volumeSlider.value = volume;
      volumeValue.textContent = volume + "%";
    }
  }

  // Modo de teste para simular localização
  startTestMode() {
    console.log("🧪 Iniciando modo de teste...");

    this.showSuccess(
      "Modo de teste ativado! Simulando localização no bairro Pedra Branca."
    );

    // Forçar permissões como concedidas
    gameState.set("permissions.location", true);
    gameState.set("permissions.camera", true);

    // Ativar modo de teste no LocationManager
    this.gameEngine.managers.location.startTestMode();

    // Iniciar o jogo
    this.gameEngine.start();
  }

  updateMissionInfo(mission) {
    this.elements.currentMission.textContent = mission.name;
    this.elements.missionDistance.textContent = mission.description;
  }

  updateMissionDistance(missionName, distance, canActivate) {
    this.elements.currentMission.textContent = missionName;

    if (canActivate) {
      this.elements.missionDistance.textContent = `🎯 Missão disponível! (${distance})`;
      this.elements.missionDistance.style.color = "#ffa500";
    } else {
      this.elements.missionDistance.textContent = `📍 ${distance} de distância`;
      this.elements.missionDistance.style.color = "#cccccc";
    }
  }

  showARControls(show) {
    if (show) {
      this.elements.activateARBtn.classList.remove("hidden");
      this.elements.playAudioBtn.classList.remove("hidden");
    } else {
      this.elements.activateARBtn.classList.add("hidden");
      this.elements.playAudioBtn.classList.add("hidden");
    }
  }

  showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error";
    errorDiv.textContent = message;

    this.elements.errorContainer.appendChild(errorDiv);

    // Remover após 5 segundos
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }

  showSuccess(message) {
    const successDiv = document.createElement("div");
    successDiv.className = "success";
    successDiv.textContent = message;

    this.elements.errorContainer.appendChild(successDiv);

    // Remover após 3 segundos
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.parentNode.removeChild(successDiv);
      }
    }, 3000);
  }
}

// Registrar Service Worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("✅ Service Worker registrado:", registration.scope);
      })
      .catch((error) => {
        console.error("❌ Erro ao registrar Service Worker:", error);
      });
  });
}

// Inicialização quando a página carregar
document.addEventListener("DOMContentLoaded", () => {
  console.log("🌟 Stranger Things: Projeto Pedra Branca Invertida");
  console.log("🎮 Inicializando...");

  // Executar testes do sistema
  gameTester.runAllTests();

  // Criar e inicializar o engine do jogo
  window.gameEngine = new GameEngine();

  // Inicialização com timeout para evitar travamento
  setTimeout(() => {
    try {
      window.gameEngine.init();
    } catch (error) {
      console.error("❌ Erro na inicialização:", error);
      // Forçar mostrar tela de boas-vindas mesmo com erro
      document.getElementById("loading-screen").classList.add("hidden");
      document.getElementById("welcome-screen").classList.remove("hidden");
    }
  }, 1000);

  // Botão para pular loading e ir direto para teste
  const skipLoadingBtn = document.getElementById("skip-loading");
  if (skipLoadingBtn) {
    skipLoadingBtn.addEventListener("click", () => {
      console.log("🧪 Pulando loading - iniciando modo teste...");

      // Esconder loading e mostrar welcome imediatamente
      const loadingScreen = document.getElementById("loading-screen");
      const welcomeScreen = document.getElementById("welcome-screen");

      if (loadingScreen) loadingScreen.classList.add("hidden");
      if (welcomeScreen) welcomeScreen.classList.remove("hidden");

      // Mostrar mensagem de teste
      setTimeout(() => {
        alert(
          "🧪 Modo de teste ativado!\n\nVocê pode agora:\n• Clicar em 'Iniciar Jornada' para o jogo normal\n• Clicar em 'Modo Teste' para simular missões\n• Explorar as outras opções"
        );
      }, 500);
    });
  }

  // Fallback: se após 5 segundos ainda estiver na tela de loading, forçar boas-vindas
  setTimeout(() => {
    const loadingScreen = document.getElementById("loading-screen");
    const welcomeScreen = document.getElementById("welcome-screen");

    if (loadingScreen && !loadingScreen.classList.contains("hidden")) {
      console.log("🔧 Forçando saída da tela de loading...");
      loadingScreen.classList.add("hidden");
      welcomeScreen.classList.remove("hidden");
    }
  }, 5000);
});

// Sistema de testes básicos
class GameTester {
  constructor() {
    this.tests = [];
    this.results = [];
  }

  // Teste da fórmula de Haversine
  testDistanceCalculation() {
    const locationManager = new LocationManager(null);

    // Coordenadas conhecidas (Casa e Poste)
    const lat1 = -27.630876175110835;
    const lng1 = -48.67969706159946;
    const lat2 = -27.631489762564254;
    const lng2 = -48.67942932776006;

    const distance = locationManager.calculateDistanceInMeters(
      lat1,
      lng1,
      lat2,
      lng2
    );

    // Distância esperada é aproximadamente 70-80 metros
    const isValid = distance > 50 && distance < 100;

    return {
      name: "Cálculo de Distância (Haversine)",
      passed: isValid,
      result: `${distance.toFixed(2)}m`,
      expected: "50-100m",
    };
  }

  // Teste de validação de missões
  testMissionValidation() {
    const missionManager = new MissionManager(null);
    const issues = missionManager.validateMissions();

    return {
      name: "Validação de Missões",
      passed: issues.length === 0,
      result: `${issues.length} problemas encontrados`,
      expected: "0 problemas",
    };
  }

  // Teste de compatibilidade do navegador
  testBrowserCompatibility() {
    const issues = errorHandler.checkBrowserCompatibility();
    const criticalIssues = issues.filter((issue) =>
      ["Geolocation", "Audio"].includes(issue.feature)
    );

    return {
      name: "Compatibilidade do Navegador",
      passed: criticalIssues.length === 0,
      result: `${criticalIssues.length} problemas críticos`,
      expected: "0 problemas críticos",
    };
  }

  // Teste de configuração das missões
  testMissionConfiguration() {
    let passed = true;
    let issues = [];

    // Verificar se todas as missões têm coordenadas válidas
    MISSIONS.forEach((mission) => {
      if (
        !mission.coordinates ||
        typeof mission.coordinates.lat !== "number" ||
        typeof mission.coordinates.lng !== "number"
      ) {
        passed = false;
        issues.push(`${mission.id}: coordenadas inválidas`);
      }

      // Verificar se coordenadas estão na região esperada (Palhoça/SC)
      if (
        mission.coordinates.lat > -27.6 ||
        mission.coordinates.lat < -27.7 ||
        mission.coordinates.lng > -48.6 ||
        mission.coordinates.lng < -48.7
      ) {
        passed = false;
        issues.push(`${mission.id}: coordenadas fora da região`);
      }
    });

    return {
      name: "Configuração das Missões",
      passed: passed,
      result: issues.length > 0 ? issues.join(", ") : "Todas válidas",
      expected: "Todas válidas",
    };
  }

  // Executar todos os testes
  runAllTests() {
    console.log("🧪 Executando testes do sistema...");

    const tests = [
      this.testDistanceCalculation(),
      this.testMissionValidation(),
      this.testBrowserCompatibility(),
      this.testMissionConfiguration(),
    ];

    this.results = tests;

    const passed = tests.filter((test) => test.passed).length;
    const total = tests.length;

    console.log(`📊 Resultados dos testes: ${passed}/${total} passaram`);

    tests.forEach((test) => {
      const status = test.passed ? "✅" : "❌";
      console.log(`${status} ${test.name}: ${test.result}`);
    });

    return {
      passed: passed,
      total: total,
      success: passed === total,
      results: tests,
    };
  }

  // Obter relatório detalhado
  getTestReport() {
    return {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        total: this.results.length,
        passed: this.results.filter((r) => r.passed).length,
        failed: this.results.filter((r) => !r.passed).length,
      },
    };
  }
}

// Instância global do testador
const gameTester = new GameTester();

// Tratamento de erros globais
window.addEventListener("error", (event) => {
  console.error("❌ Erro global:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("❌ Promise rejeitada:", event.reason);
});

// Função para iniciar modo de teste diretamente
function startTestModeDirectly() {
  console.log("🧪 Iniciando modo de teste direto...");

  // Forçar permissões como concedidas
  gameState.set("permissions.location", true);
  gameState.set("permissions.camera", true);

  // Simular localização próxima à primeira missão
  const testPosition = {
    coords: {
      latitude: -27.630876175110835, // Casa
      longitude: -48.67969706159946,
      accuracy: 10,
    },
    timestamp: Date.now(),
  };

  // Atualizar posição
  if (window.gameEngine && window.gameEngine.onLocationUpdate) {
    window.gameEngine.onLocationUpdate(testPosition);
  }

  // Simular ativação da primeira missão
  setTimeout(() => {
    const firstMission = MISSIONS[0]; // Casa
    console.log("🎯 Simulando ativação da missão:", firstMission.name);

    // Marcar como ativa
    gameState.set("activeMission", firstMission);

    // Tentar reproduzir áudio
    const audio = new Audio(firstMission.audioFile);
    audio.volume = 0.8;
    audio
      .play()
      .then(() => {
        console.log("🎵 Áudio reproduzido:", firstMission.audioFile);
      })
      .catch((error) => {
        console.log(
          "⚠️ Erro no áudio (normal em alguns navegadores):",
          error.message
        );
      });

    // Vibração se suportada
    if ("vibrate" in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
      console.log("📳 Vibração ativada");
    }

    // Mostrar mensagem de sucesso
    alert(
      `🎯 Missão "${firstMission.name}" ativada!\n\n🎵 Áudio do Dustin reproduzindo...\n📳 Vibração ativada\n\nO jogo está funcionando!`
    );

    // Simular próximas missões
    simulateAllMissions();
  }, 2000);
}

// Simular todas as missões sequencialmente
function simulateAllMissions() {
  let currentIndex = 0;

  const simulateNext = () => {
    if (currentIndex >= MISSIONS.length) {
      console.log("🏆 Todas as missões simuladas!");
      alert(
        "🏆 Parabéns! Você completou todas as 7 missões do Mundo Invertido!"
      );
      return;
    }

    const mission = MISSIONS[currentIndex];
    console.log(`🎯 Simulando missão ${currentIndex + 1}/7: ${mission.name}`);

    // Simular posição próxima à missão
    const testPosition = {
      coords: {
        latitude: mission.coordinates.lat + (Math.random() - 0.5) * 0.0001,
        longitude: mission.coordinates.lng + (Math.random() - 0.5) * 0.0001,
        accuracy: 15,
      },
      timestamp: Date.now(),
    };

    // Atualizar posição
    if (window.gameEngine && window.gameEngine.onLocationUpdate) {
      window.gameEngine.onLocationUpdate(testPosition);
    }

    // Reproduzir áudio da missão
    const audio = new Audio(mission.audioFile);
    audio.volume = 0.6;
    audio.play().catch((error) => {
      console.log("⚠️ Áudio não pôde ser reproduzido:", error.message);
    });

    // Vibração
    if ("vibrate" in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    // Marcar como concluída
    mission.completed = true;
    const completedMissions = gameState.get("completedMissions") || [];
    if (!completedMissions.includes(mission.id)) {
      completedMissions.push(mission.id);
      gameState.set("completedMissions", completedMissions);
    }

    console.log(`✅ Missão "${mission.name}" concluída!`);

    currentIndex++;

    // Próxima missão em 3 segundos
    setTimeout(simulateNext, 3000);
  };

  // Começar simulação em 5 segundos
  setTimeout(simulateNext, 5000);
}
