import React, { useState, useEffect } from 'react';
import { RotateCcw, Undo2 } from 'lucide-react';
import './App.css';

const EMOJI_SETS = {
  classic: { name: 'Classic', p1: '❌', p2: '⭕' },
  food: { name: 'Food', p1: '🍕', p2: '🍔' },
  fun: { name: 'Fun', p1: '😄', p2: '😈' },
  hearts: { name: 'Hearts', p1: '❤️', p2: '💙' }
};

const checkWinner = (board) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  
  for (let line of lines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return { winner: null, line: null };
};

const isBoardFull = (board) => board.every(cell => cell !== null);

const MiniBoard = ({ cells, winner, onCellClick, isActive, winningLine, highlightWin, isSelectable, onBoardSelect }) => {
  if (isSelectable) {
    return (
      <button
        onClick={onBoardSelect}
        className="mini-board selectable"
      >
        {cells.map((cell, idx) => (
          <div key={idx} className="cell">
            {cell}
          </div>
        ))}
      </button>
    );
  }

  return (
    <div className={`mini-board ${isActive ? 'active' : ''} ${winner ? 'won' : ''}`}>
      {cells.map((cell, idx) => {
        const isWinningCell = winningLine && winningLine.includes(idx);
        return (
          <button
            key={idx}
            onClick={() => onCellClick(idx)}
            disabled={!isActive || !!cell || !!winner}
            className={`cell ${cell ? 'filled' : ''} ${isWinningCell && highlightWin ? 'winning' : ''}`}
          >
            {cell}
          </button>
        );
      })}
      {winner && (
        <div className="winner-overlay">
          <div className="winner-emoji">{winner}</div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [gameState, setGameState] = useState('menu');
  const [mode, setMode] = useState('pvp');
  const [emojiSet, setEmojiSet] = useState('classic');
  const [miniBoards, setMiniBoards] = useState(Array(9).fill(null).map(() => Array(9).fill(null)));
  const [miniWinners, setMiniWinners] = useState(Array(9).fill(null));
  const [miniWinningLines, setMiniWinningLines] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [activeBoard, setActiveBoard] = useState(null);
  const [bigWinner, setBigWinner] = useState(null);
  const [bigWinningLine, setBigWinningLine] = useState(null);
  const [history, setHistory] = useState([]);

  const emojis = EMOJI_SETS[emojiSet];
  const currentEmoji = currentPlayer === 1 ? emojis.p1 : emojis.p2;

  useEffect(() => {
    if (gameState === 'selectBoard' && mode !== 'pvp' && currentPlayer === 2 && !bigWinner) {
      const timer = setTimeout(() => selectBoardAI(), 500);
      return () => clearTimeout(timer);
    } else if (gameState === 'playing' && mode !== 'pvp' && currentPlayer === 2 && !bigWinner) {
      const timer = setTimeout(() => makeAIMove(), 500);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameState, bigWinner]);

  const startGame = (selectedMode) => {
    setMode(selectedMode);
    setMiniBoards(Array(9).fill(null).map(() => Array(9).fill(null)));
    setMiniWinners(Array(9).fill(null));
    setMiniWinningLines(Array(9).fill(null));
    setCurrentPlayer(1);
    setActiveBoard(null);
    setBigWinner(null);
    setBigWinningLine(null);
    setHistory([]);
    setGameState('selectBoard');
  };

  const selectBoard = (boardIdx) => {
    if (miniWinners[boardIdx] || isBoardFull(miniBoards[boardIdx])) return;
    
    setHistory([...history, { miniBoards, miniWinners, miniWinningLines, currentPlayer, activeBoard, gameState }]);
    setActiveBoard(boardIdx);
    setGameState('playing');
  };

  const selectBoardAI = () => {
    const availableBoards = miniBoards
      .map((_, idx) => idx)
      .filter(idx => !miniWinners[idx] && !isBoardFull(miniBoards[idx]));
    
    if (availableBoards.length === 0) return;
    
    const boardIdx = availableBoards[Math.floor(Math.random() * availableBoards.length)];
    selectBoard(boardIdx);
  };

  const makeMove = (cellIdx) => {
    if (bigWinner || activeBoard === null) return;

    const newMiniBoards = miniBoards.map((board, idx) => 
      idx === activeBoard ? board.map((cell, i) => i === cellIdx ? currentEmoji : cell) : [...board]
    );
    
    const newMiniWinners = [...miniWinners];
    const newMiniWinningLines = [...miniWinningLines];
    const { winner, line } = checkWinner(newMiniBoards[activeBoard]);
    
    if (winner) {
      newMiniWinners[activeBoard] = winner;
      newMiniWinningLines[activeBoard] = line;
    }

    setHistory([...history, { miniBoards, miniWinners, miniWinningLines, currentPlayer, activeBoard, gameState }]);
    setMiniBoards(newMiniBoards);
    setMiniWinners(newMiniWinners);
    setMiniWinningLines(newMiniWinningLines);

    const boardComplete = winner || isBoardFull(newMiniBoards[activeBoard]);

    const bigBoard = newMiniWinners.map(w => w === emojis.p1 ? emojis.p1 : w === emojis.p2 ? emojis.p2 : null);
    const { winner: bWinner, line: bLine } = checkWinner(bigBoard);
    
    if (bWinner) {
      setBigWinner(bWinner);
      setBigWinningLine(bLine);
      setGameState('gameOver');
      return;
    }
    
    if (newMiniWinners.every((w, i) => w || isBoardFull(newMiniBoards[i]))) {
      setBigWinner('tie');
      setGameState('gameOver');
      return;
    }
    
    if (boardComplete) {
      setActiveBoard(null);
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
      setGameState('selectBoard');
    } else {
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    }
  };

  const makeAIMove = () => {
    if (activeBoard === null) return;

    let cellIdx;

    if (mode === 'medium') {
      const attempt = tryWinOrBlockInBoard(activeBoard);
      if (attempt !== null) {
        cellIdx = attempt;
      } else {
        const emptyCells = miniBoards[activeBoard].map((c, i) => c === null ? i : -1).filter(i => i !== -1);
        cellIdx = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      }
    } else {
      const emptyCells = miniBoards[activeBoard].map((c, i) => c === null ? i : -1).filter(i => i !== -1);
      cellIdx = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }

    makeMove(cellIdx);
  };

  const tryWinOrBlockInBoard = (boardIdx) => {
    for (let emoji of [emojis.p2, emojis.p1]) {
      const board = [...miniBoards[boardIdx]];
      for (let cellIdx = 0; cellIdx < 9; cellIdx++) {
        if (board[cellIdx] === null) {
          board[cellIdx] = emoji;
          if (checkWinner(board).winner === emoji) {
            return cellIdx;
          }
          board[cellIdx] = null;
        }
      }
    }
    return null;
  };

  const undo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setMiniBoards(last.miniBoards);
    setMiniWinners(last.miniWinners);
    setMiniWinningLines(last.miniWinningLines);
    setCurrentPlayer(last.currentPlayer);
    setActiveBoard(last.activeBoard);
    setGameState(last.gameState);
    setBigWinner(null);
    setBigWinningLine(null);
    setHistory(history.slice(0, -1));
  };

  if (gameState === 'menu') {
    return (
      <div className="app-container">
        <div className="menu-card">
          <h1 className="title">Ultimate Emoji Tic Tac Toe</h1>
          
          <div className="emoji-selector">
            <h2>Emoji Set</h2>
            <div className="emoji-grid">
              {Object.entries(EMOJI_SETS).map(([key, set]) => (
                <button
                  key={key}
                  onClick={() => setEmojiSet(key)}
                  className={`emoji-option ${emojiSet === key ? 'selected' : ''}`}
                >
                  <div className="emoji-pair">{set.p1} {set.p2}</div>
                  <div className="emoji-name">{set.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mode-buttons">
            <button onClick={() => startGame('pvp')} className="mode-btn primary">
              Player vs Player
            </button>
            <button onClick={() => startGame('easy')} className="mode-btn">
              vs Computer (Easy)
            </button>
            <button onClick={() => startGame('medium')} className="mode-btn">
              vs Computer (Medium)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const availableBoards = miniBoards
    .map((_, idx) => idx)
    .filter(idx => !miniWinners[idx] && !isBoardFull(miniBoards[idx]));

  return (
    <div className="app-container">
      <div className="game-card">
        <div className="game-header">
          <div className="status">
            {bigWinner ? (
              bigWinner === 'tie' ? 'Tie Game' : `${bigWinner} Wins`
            ) : gameState === 'selectBoard' ? (
              <span>{currentEmoji} Select a board</span>
            ) : (
              <span>{currentEmoji} Playing</span>
            )}
          </div>
          <div className="controls">
            <button onClick={undo} disabled={history.length === 0} className="control-btn">
              <Undo2 size={20} />
            </button>
            <button onClick={() => setGameState('menu')} className="control-btn primary">
              <RotateCcw size={20} />
            </button>
          </div>
        </div>

        <div className="big-board">
          {miniBoards.map((board, boardIdx) => {
            const isHighlighted = bigWinningLine && bigWinningLine.includes(boardIdx);
            const isSelectable = gameState === 'selectBoard' && availableBoards.includes(boardIdx);
            const isCurrentlyActive = gameState === 'playing' && activeBoard === boardIdx;
            
            return (
              <div key={boardIdx} className="board-wrapper">
                <MiniBoard
                  cells={board}
                  winner={miniWinners[boardIdx]}
                  onCellClick={(cellIdx) => makeMove(cellIdx)}
                  isActive={isCurrentlyActive}
                  winningLine={miniWinningLines[boardIdx]}
                  highlightWin={isHighlighted}
                  isSelectable={isSelectable}
                  onBoardSelect={() => selectBoard(boardIdx)}
                />
              </div>
            );
          })}
        </div>

        {gameState === 'gameOver' && (
          <button onClick={() => startGame(mode)} className="play-again-btn">
            Play Again
          </button>
        )}
      </div>
    </div>
  );
}
