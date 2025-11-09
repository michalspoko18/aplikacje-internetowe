class MapPuzzleGame {
    constructor() {
        this.map = null;
        this.puzzlePieces = [];
        this.correctPositions = [];
        this.gameStarted = false;
        this.gameCompleted = false;
        this.startTime = null;
        this.moves = 0;
        this.timer = null;
        this.showNumbers = true;
        
        this.defaultLocations = [
            { name: "Warszawa", coords: [52.2297, 21.0122], zoom: 13 },
            { name: "Kraków", coords: [50.0647, 19.9450], zoom: 13 },
            { name: "Gdańsk", coords: [54.3520, 18.6466], zoom: 13 },
            { name: "Wrocław", coords: [51.1079, 17.0385], zoom: 13 },
            { name: "Poznań", coords: [52.4064, 16.9252], zoom: 13 },
            { name: "Zakopane", coords: [49.2992, 19.9496], zoom: 14 },
            { name: "Malbork", coords: [54.0329, 19.0269], zoom: 15 }
        ];

        this.init();
    }

    init() {
        this.initializeMap();
        this.bindEventListeners();
        this.updateGameInfo();
    }

    initializeMap() {
        this.map = L.map('map').setView([52.2297, 21.0122], 13);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18,
            minZoom: 10,
            crossOrigin: 'anonymous'
        }).addTo(this.map);

        L.control.scale().addTo(this.map);

        console.log('🗺️ Mapa została zainicjalizowana');
    }

    bindEventListeners() {
        document.getElementById('newGameBtn').addEventListener('click', () => {
            this.newGame();
        });

        document.getElementById('captureBtn').addEventListener('click', () => {
            this.captureMapArea();
        });

        document.getElementById('shuffleBtn').addEventListener('click', () => {
            this.shufflePieces();
        });

        document.getElementById('hintBtn').addEventListener('click', () => {
            this.showHint();
        });

        document.getElementById('useCurrentLocation').addEventListener('click', () => {
            this.useUserLocation();
        });

        document.getElementById('randomLocation').addEventListener('click', () => {
            this.useRandomLocation();
        });

        const toggle = document.getElementById('toggleNumbers');
        if (toggle) {
            this.showNumbers = !!toggle.checked;
            toggle.addEventListener('change', (e) => {
                this.showNumbers = e.target.checked;
                this.updatePieceNumbersVisibility();
            });
        }
    }

    updatePieceNumbersVisibility() {
        this.puzzlePieces.forEach((piece) => {
            const badge = piece.querySelector('.piece-number');
            if (badge) {
                badge.style.display = this.showNumbers ? '' : 'none';
            }
        });
    }

    useUserLocation() {
        if ("geolocation" in navigator) {
            this.showMessage('Pobieranie lokalizacji...', 'info');
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    this.map.setView([lat, lng], 15);
                    
                    L.marker([lat, lng])
                        .addTo(this.map)
                        .bindPopup('📍 Twoja lokalizacja')
                        .openPopup();
                    
                    this.showMessage('Lokalizacja została ustawiona!', 'success');
                },
                (error) => {
                    console.error('Błąd geolokalizacji:', error);
                    let errorMessage = 'Nie udało się pobrać lokalizacji. ';
                    
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage += 'Użytkownik odrzucił żądanie geolokalizacji.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage += 'Informacje o lokalizacji są niedostępne.';
                            break;
                        case error.TIMEOUT:
                            errorMessage += 'Żądanie geolokalizacji przekroczyło limit czasu.';
                            break;
                    }
                    
                    this.showMessage(errorMessage, 'error');
                    this.useRandomLocation(); // Fallback do losowej lokalizacji
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        } else {
            this.showMessage('Geolokalizacja nie jest obsługiwana przez tę przeglądarkę', 'error');
            this.useRandomLocation();
        }
    }

    useRandomLocation() {
        const randomLocation = this.defaultLocations[Math.floor(Math.random() * this.defaultLocations.length)];
        
        this.map.setView(randomLocation.coords, randomLocation.zoom);
        
        L.marker(randomLocation.coords)
            .addTo(this.map)
            .bindPopup(`📍 ${randomLocation.name}`)
            .openPopup();
        
        this.showMessage(`Wybrano lokalizację: ${randomLocation.name}`, 'success');
    }

    async captureMapArea() {
        try {
            console.log('Rozpoczynanie przechwytywania mapy...');
            this.showMessage('Przechwytywanie mapy...', 'info');
            
            const mapContainer = document.getElementById('map');
            const canvas = await this.createMapCanvas(mapContainer);
            
            if (canvas) {
                console.log('Canvas został utworzony, wymiary:', canvas.width, 'x', canvas.height);
                this.createPuzzleFromCanvas(canvas);
                document.getElementById('shuffleBtn').disabled = false;
                document.getElementById('hintBtn').disabled = false;
                this.showMessage('Mapa została przechwycona! Możesz rozpocząć grę.', 'success');
            } else {
                console.error('Nie udało się utworzyć canvas');
                this.showMessage('Błąd podczas tworzenia canvas', 'error');
            }
            
        } catch (error) {
            console.error('Błąd podczas przechwytywania mapy:', error);
            this.showMessage('Błąd podczas przechwytywania mapy', 'error');
        }
    }

    async createMapCanvas(mapElement) {
        return new Promise((resolve) => {
            try {
                if (typeof window.leafletImage === 'function') {
                    window.leafletImage(this.map, (err, canvas) => {
                        if (err || !canvas) {
                            console.error('leaflet-image błąd:', err);
                            resolve(this.createFallbackCanvas());
                            return;
                        }
                        const out = document.createElement('canvas');
                        out.width = 300;
                        out.height = 300;
                        const octx = out.getContext('2d');
                        octx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, 300, 300);
                        resolve(out);
                    });
                } else {
                    console.warn('leaflet-image nie jest dostępny, używam fallback');
                    resolve(this.createFallbackCanvas());
                }
            } catch (e) {
                console.error('Wyjątek w createMapCanvas:', e);
                resolve(this.createFallbackCanvas());
            }
        });
    }

    async renderMapTiles(ctx, width, height, center, zoom) {
        const canvas = ctx.canvas;
        
        ctx.fillStyle = '#a8ddf0'; // kolor wody/tła OpenStreetMap
        ctx.fillRect(0, 0, width, height);
        
        ctx.fillStyle = '#f2f2f2';
        ctx.fillRect(50, 50, 200, 200);
        
        ctx.fillStyle = '#7cb342'; // parki/zieleń
        ctx.fillRect(70, 80, 60, 40);
        ctx.fillRect(180, 160, 80, 70);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, height/2);
        ctx.lineTo(width, height/2);
        ctx.moveTo(width/2, 0);
        ctx.lineTo(width/2, height);
        ctx.moveTo(0, height/4);
        ctx.lineTo(width, height/4);
        ctx.moveTo(width/4, 0);
        ctx.lineTo(width/4, height);
        ctx.moveTo(3*width/4, 0);
        ctx.lineTo(3*width/4, height);
        ctx.stroke();
        
        ctx.fillStyle = '#d4af37';
        ctx.fillRect(90, 90, 20, 20);
        ctx.fillRect(140, 120, 25, 30);
        ctx.fillRect(200, 80, 30, 25);
        ctx.fillRect(110, 180, 35, 40);
        ctx.fillRect(220, 200, 40, 35);
        
        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('�️', 100, 110);
        ctx.fillText('�', 150, 145);
        ctx.fillText('�', 210, 100);
        ctx.fillText('🏠', 125, 205);
        ctx.fillText('🏢', 235, 225);
        
        const centerX = width / 2;
        const centerY = height / 2;
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    createFallbackCanvas() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 300;
        canvas.height = 300;
        
        const gradient = ctx.createLinearGradient(0, 0, 300, 300);
        gradient.addColorStop(0, '#4a90e2');
        gradient.addColorStop(0.3, '#7bb247');
        gradient.addColorStop(0.6, '#f5a623');
        gradient.addColorStop(1, '#d0021b');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 300, 300);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('🏠', 50, 80);
        ctx.fillText('🌳', 150, 120);
        ctx.fillText('🏢', 220, 180);
        ctx.fillText('🚗', 80, 200);
        ctx.fillText('⛲', 180, 250);
        
        return canvas;
    }

    createPuzzleFromCanvas(canvas) {
        const puzzlePiecesContainer = document.getElementById('puzzlePieces');
        puzzlePiecesContainer.innerHTML = '';
        
        this.puzzlePieces = [];
        this.correctPositions = [];
        
    const gridSize = 4;
    const pieceWidth = canvas.width / gridSize;
    const pieceHeight = canvas.height / gridSize;
        
        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const index = row * gridSize + col;
                
                const pieceCanvas = document.createElement('canvas');
                pieceCanvas.width = pieceWidth;
                pieceCanvas.height = pieceHeight;
                
                const pieceCtx = pieceCanvas.getContext('2d');
                pieceCtx.drawImage(
                    canvas,
                    col * pieceWidth, row * pieceHeight, pieceWidth, pieceHeight,
                    0, 0, pieceWidth, pieceHeight
                );
                
                const pieceElement = document.createElement('div');
                pieceElement.className = 'puzzle-piece';
                pieceElement.draggable = true;
                pieceElement.dataset.correctPosition = index;
                pieceElement.dataset.currentPosition = index;
                
                const imageDataURL = pieceCanvas.toDataURL('image/png');
                console.log('Tworząc kawałek', index, 'z obrazem o długości:', imageDataURL.length);
                
                pieceElement.style.backgroundImage = `url(${imageDataURL})`;
                pieceElement.style.backgroundSize = '100% 100%';
                pieceElement.style.backgroundRepeat = 'no-repeat';
                pieceElement.style.backgroundPosition = 'center';
                
                const numberSpan = document.createElement('span');
                numberSpan.className = 'piece-number';
                numberSpan.textContent = index + 1;
                numberSpan.style.display = this.showNumbers ? '' : 'none';
                pieceElement.appendChild(numberSpan);
                
                this.addDragEventListeners(pieceElement);
                
                puzzlePiecesContainer.appendChild(pieceElement);
                this.puzzlePieces.push(pieceElement);
                this.correctPositions.push(index);
            }
        }
        
        this.addDropEventListeners();
        
        this.updatePieceNumbersVisibility();

        setTimeout(() => this.shufflePieces(), 500);
    }

    addDragEventListeners(piece) {
        piece.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', piece.dataset.correctPosition);
            e.dataTransfer.effectAllowed = 'move';
            piece.classList.add('dragging');
        });
        
        piece.addEventListener('dragend', (e) => {
            piece.classList.remove('dragging');
        });
    }

    addDropEventListeners() {
        const slots = document.querySelectorAll('.puzzle-slot');
        
        slots.forEach(slot => {
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                slot.classList.add('drag-over');
            });
            
            slot.addEventListener('dragleave', (e) => {
                slot.classList.remove('drag-over');
            });
            
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('drag-over');
                
                const pieceIndex = e.dataTransfer.getData('text/plain');
                const piece = this.puzzlePieces.find(p => p.dataset.correctPosition === pieceIndex);
                
                if (piece && slot) {
                    if (slot.children.length === 0) {
                        slot.appendChild(piece);
                        piece.dataset.currentPosition = slot.dataset.position;
                        
                        this.moves++;
                        this.updateGameInfo();
                        this.checkGameCompletion();
                    }
                }
            });
        });
        
        const piecesContainer = document.getElementById('puzzlePieces');
        piecesContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        piecesContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            const pieceIndex = e.dataTransfer.getData('text/plain');
            const piece = this.puzzlePieces.find(p => p.dataset.correctPosition === pieceIndex);
            
            if (piece) {
                piecesContainer.appendChild(piece);
                piece.dataset.currentPosition = '-1';
            }
        });
    }

    shufflePieces() {
        const piecesContainer = document.getElementById('puzzlePieces');
        
        this.puzzlePieces.forEach(piece => {
            piecesContainer.appendChild(piece);
            piece.dataset.currentPosition = '-1';
        });
        
        const slots = document.querySelectorAll('.puzzle-slot');
        slots.forEach(slot => {
            slot.innerHTML = '';
        });
        
        const shuffled = [...this.puzzlePieces].sort(() => Math.random() - 0.5);
        shuffled.forEach(piece => piecesContainer.appendChild(piece));
        
        this.newGame();
        this.showMessage('Kawałki zostały potasowane!', 'info');
    }

    checkGameCompletion() {
        let correctPieces = 0;
        
        this.puzzlePieces.forEach(piece => {
            const correctPos = piece.dataset.correctPosition;
            const currentPos = piece.dataset.currentPosition;
            
            if (correctPos === currentPos) {
                correctPieces++;
                piece.classList.add('correct-position');
            } else {
                piece.classList.remove('correct-position');
            }
        });
        
    document.getElementById('progress').textContent = `${correctPieces}/16`;
        
    if (correctPieces === 16 && !this.gameCompleted) {
            this.gameCompleted = true;
            this.stopTimer();
            
            const endTime = new Date();
            const gameTime = Math.floor((endTime - this.startTime) / 1000);
            
            setTimeout(() => {
                this.showMessage(`🎉 Gratulacje! Ukończyłeś puzzle w ${this.formatTime(gameTime)} z ${this.moves} ruchami!`, 'success');
                document.getElementById('gameStatus').textContent = `Gra ukończona! Czas: ${this.formatTime(gameTime)}, Ruchy: ${this.moves}`;
            }, 500);
        }
    }

    showHint() {
        let hintCount = 0;
        
        this.puzzlePieces.forEach((piece, index) => {
            const correctPos = parseInt(piece.dataset.correctPosition);
            const currentPos = parseInt(piece.dataset.currentPosition);
            
            if (correctPos !== currentPos && hintCount < 2) {
                piece.classList.add('hint-highlight');
                
                const targetSlot = document.querySelector(`[data-position="${correctPos}"]`);
                if (targetSlot) {
                    targetSlot.classList.add('hint-target');
                }
                
                hintCount++;
                
                setTimeout(() => {
                    piece.classList.remove('hint-highlight');
                    if (targetSlot) {
                        targetSlot.classList.remove('hint-target');
                    }
                }, 3000);
            }
        });
        
        if (hintCount === 0) {
            this.showMessage('Wszystkie kawałki są już na swoich miejscach!', 'info');
        } else {
            this.showMessage(`Podświetlono ${hintCount} kawałki do przesunięcia`, 'info');
        }
    }

    newGame() {
        this.gameStarted = true;
        this.gameCompleted = false;
        this.startTime = new Date();
        this.moves = 0;
        
        this.startTimer();
        this.updateGameInfo();
        
        document.getElementById('gameStatus').textContent = 'Gra w toku...';
        
        this.puzzlePieces.forEach(piece => {
            piece.classList.remove('correct-position', 'hint-highlight');
        });
        
        const slots = document.querySelectorAll('.puzzle-slot');
        slots.forEach(slot => {
            slot.classList.remove('hint-target');
        });
    }

    startTimer() {
        this.timer = setInterval(() => {
            if (this.gameStarted && !this.gameCompleted) {
                const currentTime = new Date();
                const elapsed = Math.floor((currentTime - this.startTime) / 1000);
                document.getElementById('timer').textContent = this.formatTime(elapsed);
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    updateGameInfo() {
        document.getElementById('moves').textContent = this.moves;
        
        if (!this.gameStarted) {
            document.getElementById('timer').textContent = '00:00';
            document.getElementById('progress').textContent = '0/16';
        }
    }

    showMessage(message, type = 'info') {
        const existingMessages = document.querySelectorAll('.game-message');
        existingMessages.forEach(msg => msg.remove());
        
        const messageElement = document.createElement('div');
        messageElement.className = `game-message game-message-${type}`;
        messageElement.textContent = message;
        
        document.body.appendChild(messageElement);
        
        setTimeout(() => messageElement.classList.add('show'), 100);
        
        setTimeout(() => {
            messageElement.classList.remove('show');
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.parentNode.removeChild(messageElement);
                }
            }, 300);
        }, 4000);
        
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Inicjalizacja Map Puzzle Game...');
    new MapPuzzleGame();
});

console.log('%c🧩 Map Puzzle Game', 'color: #4a90e2; font-size: 18px; font-weight: bold;');
console.log('Leaflet version:', L.version);
console.log('Drag and Drop API support:', 'draggable' in document.createElement('div'));
console.log('Geolocation API support:', 'geolocation' in navigator);