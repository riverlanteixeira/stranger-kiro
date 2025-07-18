// Pontos de interesse do PRD
const points = [
    { name: 'Casa', lat: -27.630876175110835, lng: -48.67969706159946, audio: 'audios/1 - Casa.mp3', model: null },
    { name: 'Poste', lat: -27.631489762564254, lng: -48.67942932776006, audio: 'audios/2 - Poste de Luz.mp3', model: null },
    { name: 'Lago', lat: -27.629651561773642, lng: -48.68112592253786, audio: 'audios/3 - Lago.mp3', model: 'models/portal.glb' },
    { name: 'UNISUL', lat: -27.624013123132134, lng: -48.681243155505165, audio: 'audios/4 - UNISUL.mp3', model: null },
    { name: 'Ponte', lat: -27.622632847004397, lng: -48.6807748434082, audio: 'audios/5 - Ponte.mp3', model: 'models/demogorgon.glb' },
    { name: 'Floresta', lat: -27.62172576455045, lng: -48.6799944586445, audio: 'audios/6 - Floresta.mp3', model: null },
    { name: 'Praça', lat: -27.62225085741092, lng: -48.67746514219232, audio: 'audios/7 - Praça.mp3', model: null }
];

// Função para calcular distância (Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Verificar permissões e iniciar geolocalização
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(position => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        points.forEach(point => {
            const distance = calculateDistance(userLat, userLng, point.lat, point.lng);
            if (distance < 30) { // ~30 metros
                // Vibração
                if (navigator.vibrate) navigator.vibrate(200);

                // Reproduzir áudio
                const audio = new Audio(point.audio);
                audio.play();

                // Adicionar modelo AR se existir
                if (point.model) {
                    const scene = document.querySelector('a-scene');
                    const entity = document.createElement('a-gltf-model');
                    entity.setAttribute('gps-entity-place', `latitude: ${point.lat}; longitude: ${point.lng};`);
                    entity.setAttribute('src', point.model);
                    entity.setAttribute('scale', '1 1 1'); // Ajuste conforme necessário
                    scene.appendChild(entity);
                }
            }
        });
    }, error => {
        console.error('Erro na geolocalização:', error);
    }, { enableHighAccuracy: true });
} else {
    alert('Geolocalização não suportada.');
}