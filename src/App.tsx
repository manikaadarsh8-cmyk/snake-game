import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, Volume2, VolumeX, RotateCcw, Gamepad2, AlertTriangle, TerminalSquare } from 'lucide-react';

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_FOOD = { x: 15, y: 5 };
const GAME_SPEED = 90;

const TRACKS = [
  { id: 1, title: 'SYS.CORRUPT // 01', artist: 'NULL_PTR', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 2, title: 'MEM.LEAK // 02', artist: 'NULL_PTR', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 3, title: 'OVERRIDE // 03', artist: 'NULL_PTR', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }
];

export default function App() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(5000);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);

  const snakeRef = useRef(snake);
  const dirRef = useRef(direction);
  const foodRef = useRef(food);

  useEffect(() => { snakeRef.current = snake }, [snake]);
  useEffect(() => { dirRef.current = direction }, [direction]);
  useEffect(() => { foodRef.current = food }, [food]);
  useEffect(() => {
    if (score > highScore) setHighScore(score);
  }, [score, highScore]);

  const visualizerStyles = useMemo(() => {
    return Array.from({length: 20}).map(() => ({
       animationDelay: `-${Math.random() * 2}s`,
       animationDuration: `${0.2 + Math.random() * 0.4}s`
    }));
  }, []);

  const generateFood = useCallback(() => {
     let newFood;
     while (true) {
       newFood = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
       if (!snakeRef.current.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
         break;
       }
     }
     return newFood;
  }, []);

  const resetGame = () => {
     setSnake(INITIAL_SNAKE);
     setDirection(INITIAL_DIRECTION);
     setFood(generateFood());
     setScore(0);
     setGameOver(false);
     setGameStarted(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === ' ') {
         if (!gameStarted || gameOver) resetGame();
         return;
      }

      const currDir = dirRef.current;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currDir.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currDir.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currDir.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currDir.x !== -1) setDirection({ x: 1, y: 0 });
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;
    const moveSnake = () => {
      const head = { ...snakeRef.current[0] };
      head.x += dirRef.current.x;
      head.y += dirRef.current.y;

      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true); return;
      }
      if (snakeRef.current.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true); return;
      }

      const newSnake = [head, ...snakeRef.current];
      if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
        setScore(prev => prev + 10);
        setFood(generateFood());
      } else {
        newSnake.pop();
      }
      setSnake(newSnake);
    };
    const intervalId = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(intervalId);
  }, [gameStarted, gameOver, generateFood]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(console.error);
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  const prevTrack = () => setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);

  useEffect(() => {
    if (audioRef.current && isPlaying) audioRef.current.play().catch(console.error);
  }, [currentTrackIndex, isPlaying]);

  useEffect(() => {
     const audio = audioRef.current;
     if (!audio) return;
     const onEnded = () => nextTrack();
     audio.addEventListener('ended', onEnded);
     return () => audio.removeEventListener('ended', onEnded);
  }, [currentTrackIndex]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-base text-white font-vt relative selection:bg-magenta selection:text-black">
      {/* Effects Overlays */}
      <div className="absolute inset-0 static-bg z-0" />
      <div className="absolute inset-0 scanline z-50 pointer-events-none" />

      {/* Glitch Frame */}
      <div className="absolute inset-4 border-2 border-cyan/40 pointer-events-none z-40 clip-corners flex flex-col justify-between p-1 mix-blend-screen">
         <div className="text-cyan text-[10px] font-pixel">ID: 0x8A4B // SYS.ONLINE</div>
         <div className="text-magenta text-[10px] font-pixel text-right">ERR_RTE_004</div>
      </div>

      <div className="grid grid-cols-[300px_1fr_300px] h-full w-full relative z-10">
        
        {/* Header / Sidebar Left */}
        <aside className="border-r-[2px] border-dashed border-cyan/30 flex flex-col bg-black/60 backdrop-blur-sm">
           <header className="h-[80px] border-b-[2px] border-dashed border-cyan/30 flex items-center px-6">
              <div className="font-pixel text-[14px] text-cyan glitch-text glitch-wrapper uppercase" data-text="SYNDICATE.OS">
                 SYNDICATE.OS
              </div>
           </header>

           <div className="p-6 flex flex-col h-full gap-8">
             <div>
                <div className="flex items-center gap-2 text-magenta mb-4">
                   <TerminalSquare size={16} />
                   <span className="font-pixel text-[10px] uppercase opacity-80 drop-shadow-md">Manifest_</span>
                </div>
                
                <div className="flex flex-col gap-3">
                  {TRACKS.map((track, idx) => (
                     <div 
                        key={track.id} 
                        onClick={() => setCurrentTrackIndex(idx)}
                        className={`group relative flex items-center gap-3 p-2 cursor-pointer transition-all border ${idx === currentTrackIndex ? 'border-magenta bg-magenta/10 shadow-[0_0_10px_magenta]' : 'border-transparent hover:border-cyan/50 hover:bg-cyan/5'}`}
                     >
                        {idx === currentTrackIndex && <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-magenta animate-pulse" />}
                        <div className={`w-8 h-8 flex items-center justify-center shrink-0 border ${idx === currentTrackIndex ? 'bg-magenta text-black border-magenta' : 'bg-transparent text-cyan border-cyan/40'}`}>
                           <Music size={14} className={idx === currentTrackIndex ? 'animate-bounce' : ''} />
                        </div>
                        <div className="overflow-hidden">
                           <h4 className="font-pixel text-[9px] mb-1 truncate text-white uppercase">{track.title}</h4>
                           <p className="text-[14px] text-cyan/70 truncate">{track.artist}</p>
                        </div>
                     </div>
                  ))}
                </div>
             </div>

             {/* Visualizer */}
             <div className="mt-auto border border-cyan/20 p-2 bg-black/80 shadow-[inset_0_0_20px_rgba(0,255,255,0.1)]">
                <div className="font-pixel text-[8px] text-cyan/50 mb-2">SIG.ANALYSIS //</div>
                <div className="flex items-end justify-between h-16 gap-[2px]">
                   {Array.from({length: 30}).map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-full bg-cyan transition-all ${!isPlaying ? 'opacity-20 transform scale-y-10' : 'opacity-90 shadow-[0_0_5px_cyan]'}`}
                        style={isPlaying ? { 
                           transformOrigin: 'bottom',
                           animation: `visualizer-bounce ${visualizerStyles[i % 20].animationDuration} ease-in-out infinite alternate`,
                           animationDelay: visualizerStyles[i % 20].animationDelay
                        } : { transform: 'scaleY(0.1)' }}
                      />
                   ))}
                </div>
             </div>
           </div>
        </aside>

        {/* Main Game Interface */}
        <main className="flex flex-col items-center justify-center relative bg-black/90">
            {/* Crosshairs & Grid aesthetic */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.05)_0%,transparent_60%)] pointer-events-none" />
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-cyan/10 pointer-events-none" />
            <div className="absolute top-0 left-1/2 w-[1px] h-full bg-cyan/10 pointer-events-none" />

            <div className="w-[480px] h-[480px] border-[2px] border-cyan bg-black relative shadow-[0_0_30px_rgba(0,255,255,0.15)] clip-edges"
                 style={{
                    backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent ${480/GRID_SIZE - 1}px, rgba(0,255,255,0.1) ${480/GRID_SIZE}px), repeating-linear-gradient(90deg, transparent, transparent ${480/GRID_SIZE - 1}px, rgba(0,255,255,0.1) ${480/GRID_SIZE}px)`,
                    backgroundSize: `${480/GRID_SIZE}px ${480/GRID_SIZE}px`
                 }}
            >
                {!gameStarted && !gameOver && (
                   <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 backdrop-blur-[2px]">
                      <Gamepad2 size={48} className="text-cyan mb-6 animate-pulse" />
                      <button onClick={resetGame} className="px-6 py-4 bg-transparent border-2 border-cyan text-cyan font-pixel text-[12px] uppercase shadow-[0_0_15px_rgba(0,255,255,0.4)] hover:bg-cyan hover:text-black transition-all cursor-pointer">
                         INITIALIZE_LINK
                      </button>
                   </div>
                )}
                
                {gameOver && (
                    <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 glitch-screen">
                      <AlertTriangle size={48} className="text-magenta mb-4" />
                      <div className="text-magenta font-pixel text-[16px] mb-2 drop-shadow-[0_0_10px_magenta] uppercase glitch-text" data-text="FATAL_EXCEPTION">FATAL_EXCEPTION</div>
                      <div className="text-cyan text-2xl font-mono uppercase tracking-widest mb-8 border-b border-cyan/40 pb-2">Cycles Survived: {score}</div>
                      <button onClick={resetGame} className="px-6 py-4 bg-transparent border-2 border-magenta text-magenta font-pixel text-[10px] uppercase shadow-[0_0_15px_rgba(255,0,255,0.4)] hover:bg-magenta hover:text-black transition-all flex items-center gap-3 cursor-pointer group">
                         <RotateCcw size={16} className="group-hover:-rotate-180 transition-transform duration-500" /> REBOOT_SYSTEM
                      </button>
                   </div>
                )}

                {/* Snake Rendering */}
                {snake.map((segment, i) => {
                   return (
                      <div 
                         key={i} 
                         style={{ 
                            left: `${(segment.x / GRID_SIZE) * 100}%`,
                            top: `${(segment.y / GRID_SIZE) * 100}%`,
                            width: `${100 / GRID_SIZE}%`,
                            height: `${100 / GRID_SIZE}%`
                         }}
                         className="absolute flex items-center justify-center"
                      >
                         <div className={`w-[90%] h-[90%] rounded-none ${i===0 ? 'bg-white shadow-[0_0_15px_white]' : 'bg-cyan shadow-[0_0_8px_cyan] opacity-80'}`} />
                      </div>
                   )
                })}

                {/* Food Rendering */}
                <div 
                   style={{ 
                        left: `${(food.x / GRID_SIZE) * 100}%`,
                        top: `${(food.y / GRID_SIZE) * 100}%`,
                        width: `${100 / GRID_SIZE}%`,
                        height: `${100 / GRID_SIZE}%`
                   }}
                   className="absolute flex items-center justify-center"
                >
                    <div className="w-[80%] h-[80%] bg-magenta shadow-[0_0_15px_magenta] animate-pulse" />
                </div>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-6 flex justify-center text-cyan text-[14px] uppercase tracking-[0.2em] items-center gap-4 border border-cyan/20 bg-black p-3">
                <span className="opacity-70">W A S D _ M O V E</span>
                <span className="w-2 h-2 bg-magenta" />
                <span className="opacity-70">S P A C E _ I N I T</span>
            </div>
        </main>

        {/* Sidebar Right */}
        <aside className="border-l-[2px] border-dashed border-cyan/30 p-6 flex flex-col gap-10 bg-black/60 relative backdrop-blur-sm z-20">
           <div className="absolute top-0 right-0 p-4 font-pixel text-[10px] text-magenta text-right leading-relaxed opacity-50">
              SEC: 0x9B <br/>
              MEM: 12TB <br/>
              NET: UPLINK
           </div>

           <div className="flex flex-col gap-12 mt-16">
             {/* SCORE */}
             <div className="relative p-4 border border-cyan/40 bg-cyan/5">
                <div className="absolute -top-3 left-2 bg-black px-2 text-[10px] font-pixel text-cyan">PRCSS_SCORE</div>
                <div className="font-pixel text-3xl text-white drop-shadow-[0_0_10px_cyan] text-right mt-2">
                   {score.toString().padStart(6, '0')}
                </div>
             </div>

             {/* HIGH SCORE */}
             <div className="relative p-4 border border-magenta/40 bg-magenta/5">
                <div className="absolute -top-3 left-2 bg-black px-2 text-[10px] font-pixel text-magenta">PRCSS_PEAK</div>
                <div className="font-pixel text-3xl text-white drop-shadow-[0_0_10px_magenta] text-right mt-2">
                   {highScore.toString().padStart(6, '0')}
                </div>
             </div>
           </div>

           {/* MEDIA PLAYER */}
           <div className="flex flex-col gap-6 mt-auto pb-6 relative">
              <div className="absolute -top-6 left-0 text-[10px] font-pixel text-cyan/70">WAV.EXEC //</div>
              
              <div>
                <div className="font-pixel text-[12px] text-white truncate drop-shadow-[0_0_5px_white]">
                   {TRACKS[currentTrackIndex].title}
                </div>
                <div className="text-[16px] text-cyan/80 mt-1">STATUS: {isPlaying ? 'STREAMING' : 'IDLE'}</div>
              </div>
              
              {/* Progress var */}
              <div className="w-full h-3 border border-magenta/50 bg-black/50 p-[2px]">
                 <div className={`h-full bg-magenta shadow-[0_0_10px_magenta] transition-all`} style={{ width: isPlaying ? '95%' : '5%', transitionDuration: isPlaying ? '30s' : '0s', transitionTimingFunction: 'linear' }} />
              </div>

              <div className="flex justify-between items-center mt-2">
                 <button onClick={prevTrack} className="w-12 h-12 border border-cyan/40 text-cyan flex items-center justify-center hover:bg-cyan hover:text-black cursor-pointer transition-colors">
                    <SkipBack size={18} className="fill-current" />
                 </button>
                 
                 <button 
                    onClick={togglePlay} 
                    className="w-16 h-16 border-[2px] border-magenta bg-magenta/10 text-magenta shadow-[0_0_15px_rgba(255,0,255,0.3)] flex items-center justify-center hover:bg-magenta hover:text-black hover:shadow-[0_0_25px_magenta] transition-all cursor-pointer"
                 >
                    {isPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current translate-x-[2px]" />}
                 </button>

                 <button onClick={nextTrack} className="w-12 h-12 border border-cyan/40 text-cyan flex items-center justify-center hover:bg-cyan hover:text-black cursor-pointer transition-colors">
                    <SkipForward size={18} className="fill-current" />
                 </button>
              </div>

              <div className="flex items-center gap-4 mt-4 bg-black/40 p-3 border border-cyan/20">
                 <button onClick={() => setIsMuted(!isMuted)} className="text-cyan hover:text-white transition-colors cursor-pointer">
                     {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                 </button>
                 <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05"
                    value={volume}
                    onChange={(e) => {
                       setVolume(parseFloat(e.target.value));
                       if (parseFloat(e.target.value) > 0) setIsMuted(false);
                    }}
                    className="w-full h-2 bg-cyan/20 appearance-none cursor-pointer accent-magenta"
                 />
              </div>
           </div>
        </aside>

      </div>
      <audio ref={audioRef} src={TRACKS[currentTrackIndex].url} loop={false} />
    </div>
  );
}
