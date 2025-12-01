// ===== CAÇA-PALAVRAS - JAVASCRIPT (ISOLADO) =====
document.addEventListener("DOMContentLoaded", function() {
    // Função de inicialização do Caça-Palavras
    (function() {
        const wordsByTheme = {
          'Tecnologia': [
            'API', 'BUG', 'CACHE', 'DEBUG', 'FIREWALL', 'HTML', 'JAVA', 'KERNEL', 'LOGIN',
            'MODULO', 'NODE', 'PATCH', 'QUERY', 'SERVER', 'TOKEN', 'URL'
          ],
          'Animais': [
            'GATO', 'CAO', 'TIGRE', 'PANDA', 'CAVALO', 'RATO', 'CISNE', 'URSO', 'ZEBRA', 'FOCA',
            'AGUIA', 'LEAO', 'MACACO', 'RAPOSA', 'ARARA', 'BALEIA', 'CORUJA'
          ],
          'Escola': [
            'LIVRO', 'LAPIS', 'PROVA', 'RECREIO', 'LICAO', 'MESA', 'QUADRO', 'TEXTO', 'AULA', 'NOTA',
            'CADERNO', 'ENSINO', 'GRUPO', 'HISTORIA', 'ALUNO', 'CLASSE'
          ],
          'Frutas': [
            'UVA', 'PERA', 'BANANA', 'MACA', 'KIWI', 'LIMAO', 'COCO', 'FIGO', 'AMEIXA',
            'ABACATE', 'ABACAXI', 'ACEROLA', 'CAJU', 'GOIABA', 'MANGA', 'MELANCIA'
          ],
          'Espaço': [
            'SOL', 'LUZ', 'TERRA', 'SATURNO', 'ASTRO', 'NEBULOSA', 'ROVER', 'NASA',
            'COMETA', 'COSMOS', 'ECLIPSE', 'GALAXIA', 'LUA', 'METEORO', 'PLANETA', 'ESTRELA'
          ]
        };

        let wsGrid = [];
        let wsSelectedWords = [];
        let wsFoundWords = [];
        let wsGridSize = 10;
        let wsWordCount = 10;
        let wsScore = 0;
        let wsCurrentTheme = null;
        let wsCurrentLevel = 'medio';
        let wsCurrentGameLevel = 1;
        let wsIsSelecting = false;
        let wsSelectedCells = [];
        let wsStartCell = null;

        // Elementos DOM
        const wsStartBtn = document.getElementById('ws-startBtn');
        const wsDifficultyDiv = document.getElementById('ws-difficulty');
        const wsThemesDiv = document.getElementById('ws-themes');
        const wsGameArea = document.getElementById('ws-gameArea');
        const wsWordListDiv = document.getElementById('ws-wordList');
        const wsGridDiv = document.getElementById('ws-grid');
        const wsScoreEl = document.getElementById('ws-score');
        const wsResetScoreBtn = document.getElementById('ws-resetScoreBtn');
        const wsLevelEl = document.getElementById('ws-level');
        const wsNextLevelBtn = document.getElementById('ws-nextLevelBtn');
        const wsWelcome = document.getElementById('ws-welcome');

        // Botão para abrir o jogo
        const btnOpenWordsearch = document.getElementById('btn-open-wordsearch');
        if (btnOpenWordsearch) {
            btnOpenWordsearch.addEventListener('click', function() {
                document.getElementById('games-page').classList.remove('active');
                document.getElementById('wordsearch-page').classList.add('active');
            });
        }

        // Botão para voltar aos jogos
        const btnBackToGames = document.getElementById('btn-back-to-games');
        if (btnBackToGames) {
            btnBackToGames.addEventListener('click', function() {
                document.getElementById('wordsearch-page').classList.remove('active');
                document.getElementById('games-page').classList.add('active');
                resetWSGame();
            });
        }

        // Iniciar jogo
        if (wsStartBtn) {
            wsStartBtn.onclick = () => {
                if (wsWelcome) wsWelcome.style.display = 'none';
                if (wsDifficultyDiv) wsDifficultyDiv.style.display = 'block';
                loadWSScore();
            };
        }

        window.setWSDifficulty = function(level) {
            wsCurrentLevel = level;
            if (wsDifficultyDiv) wsDifficultyDiv.style.display = 'none';
            if (wsThemesDiv) wsThemesDiv.style.display = 'block';
            updateWSLevel();
        };

        window.startWSGame = function(theme) {
            wsCurrentTheme = theme;
            if (wsScoreEl) wsScoreEl.style.display = 'block';
            if (wsThemesDiv) wsThemesDiv.style.display = 'none';
            if (wsGameArea) wsGameArea.style.display = 'block';

            if (wsCurrentLevel === 'facil') {
                wsGridSize = 6;
                wsWordCount = 4;
            } else if (wsCurrentLevel === 'medio') {
                wsGridSize = 8;
                wsWordCount = 7;
            } else {
                wsGridSize = 10;
                wsWordCount = 10;
            }

            if (wsGridDiv) {
                wsGridDiv.style.gridTemplateColumns = `repeat(${wsGridSize}, 40px)`;
                wsGridDiv.style.gridTemplateRows = `repeat(${wsGridSize}, 40px)`;
            }
            updateWSLevel();

            const possibleWords = wordsByTheme[theme].filter(w => w.length <= wsGridSize);
            wsSelectedWords = shuffleArray(possibleWords).slice(0, wsWordCount);
            wsFoundWords = [];
            createWSGrid();
        };

        function shuffleArray(arr) {
            let array = arr.slice();
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
        }

        function randomLetter() {
            const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            return letters.charAt(Math.floor(Math.random() * letters.length));
        }

        function createWSGrid() {
            wsGrid = [];
            if (wsGridDiv) wsGridDiv.innerHTML = '';

            for (let i = 0; i < wsGridSize; i++) {
                wsGrid[i] = [];
                for (let j = 0; j < wsGridSize; j++) {
                    wsGrid[i][j] = randomLetter();
                }
            }

            wsSelectedWords.forEach(word => placeWord(word));

            for (let i = 0; i < wsGridSize; i++) {
                for (let j = 0; j < wsGridSize; j++) {
                    const cell = document.createElement('div');
                    cell.className = 'ws-cell';
                    cell.textContent = wsGrid[i][j];
                    cell.dataset.row = i;
                    cell.dataset.col = j;
                    if (wsGridDiv) wsGridDiv.appendChild(cell);
                }
            }

            renderWSWordList();
            attachWSEventListeners();
        }

        function placeWord(word) {
            const directions = [
                [0, 1],   // horizontal
                [1, 0],   // vertical
                [1, 1],   // diagonal \
                [-1, 1]   // diagonal /
            ];

            let placed = false;
            let attempts = 0;
            const maxAttempts = 100;

            while (!placed && attempts < maxAttempts) {
                attempts++;
                const dir = directions[Math.floor(Math.random() * directions.length)];
                const row = Math.floor(Math.random() * wsGridSize);
                const col = Math.floor(Math.random() * wsGridSize);

                if (canPlaceWord(word, row, col, dir)) {
                    for (let k = 0; k < word.length; k++) {
                        wsGrid[row + k * dir[0]][col + k * dir[1]] = word[k];
                    }
                    placed = true;
                }
            }
        }

        function canPlaceWord(word, row, col, dir) {
            for (let k = 0; k < word.length; k++) {
                const newRow = row + k * dir[0];
                const newCol = col + k * dir[1];
                if (newRow < 0 || newRow >= wsGridSize || newCol < 0 || newCol >= wsGridSize) {
                    return false;
                }
                const currentChar = wsGrid[newRow][newCol];
                if (currentChar !== randomLetter() && currentChar !== word[k]) {
                    return false;
                }
            }
            return true;
        }

        function renderWSWordList() {
            if (!wsWordListDiv) return;
            wsWordListDiv.innerHTML = '';
            wsSelectedWords.forEach(word => {
                const span = document.createElement('span');
                span.textContent = word;
                if (wsFoundWords.includes(word)) {
                    span.classList.add('ws-found');
                }
                wsWordListDiv.appendChild(span);
            });
        }

        function attachWSEventListeners() {
            if (!wsGridDiv) return;
            const cells = wsGridDiv.querySelectorAll('.ws-cell');
            
            cells.forEach(cell => {
                cell.addEventListener('mousedown', startWSSelection);
                cell.addEventListener('mouseenter', continueWSSelection);
                cell.addEventListener('mouseup', endWSSelection);
                cell.addEventListener('touchstart', startWSSelection);
                cell.addEventListener('touchmove', handleWSTouchMove);
                cell.addEventListener('touchend', endWSSelection);
            });

            document.addEventListener('mouseup', endWSSelection);
        }

        function startWSSelection(e) {
            e.preventDefault();
            wsIsSelecting = true;
            wsSelectedCells = [];
            wsStartCell = e.target;
            selectWSCell(e.target);
        }

        function continueWSSelection(e) {
            if (!wsIsSelecting) return;
            if (wsStartCell && isWSValidDirection(wsStartCell, e.target)) {
                selectWSCell(e.target);
            }
        }

        function handleWSTouchMove(e) {
            if (!wsIsSelecting) return;
            e.preventDefault();
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            if (element && element.classList.contains('ws-cell')) {
                if (wsStartCell && isWSValidDirection(wsStartCell, element)) {
                    selectWSCell(element);
                }
            }
        }

        function selectWSCell(cell) {
            if (!wsSelectedCells.includes(cell)) {
                wsSelectedCells.push(cell);
                cell.classList.add('ws-selected');
            }
        }

        function isWSValidDirection(start, end) {
            const r1 = parseInt(start.dataset.row);
            const c1 = parseInt(start.dataset.col);
            const r2 = parseInt(end.dataset.row);
            const c2 = parseInt(end.dataset.col);

            const dr = r2 - r1;
            const dc = c2 - c1;

            return (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc));
        }

        function endWSSelection() {
            if (!wsIsSelecting) return;
            wsIsSelecting = false;

            const selectedWord = wsSelectedCells.map(cell => cell.textContent).join('');
            const reversedWord = selectedWord.split('').reverse().join('');

            if (wsSelectedWords.includes(selectedWord) && !wsFoundWords.includes(selectedWord)) {
                wsFoundWords.push(selectedWord);
                wsSelectedCells.forEach(cell => cell.classList.add('ws-correct'));
                wsScore += 10;
                updateWSScore();
                renderWSWordList();
                checkWSWin();
            } else if (wsSelectedWords.includes(reversedWord) && !wsFoundWords.includes(reversedWord)) {
                wsFoundWords.push(reversedWord);
                wsSelectedCells.forEach(cell => cell.classList.add('ws-correct'));
                wsScore += 10;
                updateWSScore();
                renderWSWordList();
                checkWSWin();
            } else {
                wsSelectedCells.forEach(cell => cell.classList.remove('ws-selected'));
            }

            wsSelectedCells = [];
            wsStartCell = null;
        }

        function checkWSWin() {
            if (wsFoundWords.length === wsSelectedWords.length) {
                setTimeout(() => {
                    alert('Parabéns! Você encontrou todas as palavras!');
                    wsCurrentGameLevel++;
                    if (wsNextLevelBtn) wsNextLevelBtn.style.display = 'block';
                }, 300);
            }
        }

        if (wsNextLevelBtn) {
            wsNextLevelBtn.onclick = () => {
                wsNextLevelBtn.style.display = 'none';
                startWSGame(wsCurrentTheme);
            };
        }

        function updateWSScore() {
            if (wsScoreEl) wsScoreEl.textContent = `Pontuação: ${wsScore}`;
        }

        function updateWSLevel() {
            if (wsLevelEl) wsLevelEl.textContent = `Nível ${wsCurrentGameLevel}`;
        }

        function loadWSScore() {
            const saved = localStorage.getItem('cacaPalavrasScore');
            if (saved !== null) {
                wsScore = parseInt(saved, 10);
            } else {
                wsScore = 0;
            }
            updateWSScore();
        }

        function saveWSScore() {
            localStorage.setItem('cacaPalavrasScore', wsScore);
        }

        function resetWSScore() {
            wsScore = 0;
            updateWSScore();
            saveWSScore();
            alert('Pontuação resetada!');
        }

        function resetWSGame() {
            if (wsWelcome) wsWelcome.style.display = 'block';
            if (wsDifficultyDiv) wsDifficultyDiv.style.display = 'none';
            if (wsThemesDiv) wsThemesDiv.style.display = 'none';
            if (wsGameArea) wsGameArea.style.display = 'none';
            if (wsScoreEl) wsScoreEl.style.display = 'none';
            if (wsNextLevelBtn) wsNextLevelBtn.style.display = 'none';
            wsCurrentGameLevel = 1;
            wsFoundWords = [];
            wsSelectedWords = [];
        }

        if (wsResetScoreBtn) {
            wsResetScoreBtn.onclick = resetWSScore;
        }

        // Auto-save score
        setInterval(saveWSScore, 5000);
    })();
});
