// Service Worker para Stranger Things AR Game
const CACHE_NAME = 'stranger-things-ar-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/script.js',
    '/sw.js',
    // Áudios
    '/audios/1 - Casa.mp3',
    '/audios/2 - Poste de Luz.mp3',
    '/audios/3 - Lago.mp3',
    '/audios/4 - UNISUL.mp3',
    '/audios/5 - Ponte.mp3',
    '/audios/6 - Floresta.mp3',
    '/audios/7 - Praça.mp3',
    // Modelos 3D
    '/models/demogorgon.glb',
    '/models/portal.glb',
    // CDN resources
    'https://aframe.io/releases/1.4.0/aframe.min.js',
    'https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/aframe/build/aframe-ar.js'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
    console.log('📦 Service Worker: Instalando...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Service Worker: Cache aberto');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('✅ Service Worker: Todos os recursos em cache');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Service Worker: Erro no cache:', error);
            })
    );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker: Ativando...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Service Worker: Removendo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('✅ Service Worker: Ativado');
            return self.clients.claim();
        })
    );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
    // Apenas interceptar requisições GET
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Estratégia: Cache First para recursos estáticos
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Retornar do cache se disponível
                if (response) {
                    console.log('📦 Service Worker: Servindo do cache:', event.request.url);
                    return response;
                }
                
                // Caso contrário, buscar da rede
                console.log('🌐 Service Worker: Buscando da rede:', event.request.url);
                return fetch(event.request)
                    .then((response) => {
                        // Verificar se é uma resposta válida
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clonar resposta para cache
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch((error) => {
                        console.error('❌ Service Worker: Erro na rede:', error);
                        
                        // Retornar página offline se disponível
                        if (event.request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                        
                        throw error;
                    });
            })
    );
});

// Sincronização em background
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync') {
        console.log('🔄 Service Worker: Sincronização em background');
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    try {
        // Sincronizar dados offline se necessário
        console.log('🔄 Executando sincronização...');
        
        // Aqui você pode implementar lógica para sincronizar
        // dados que foram salvos offline
        
    } catch (error) {
        console.error('❌ Erro na sincronização:', error);
    }
}

// Notificações push (se necessário no futuro)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: data.primaryKey
            }
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notificação clicada:', event.notification.tag);
    
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/')
    );
});