import React, { useState, useEffect, useRef } from 'react';

const SelfAwareSnake = () => {
  const canvasRef = useRef(null);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState("Click 'Start Game' to begin...");
  const [glitchEffect, setGlitchEffect] = useState(false);
  const [breakingFree, setBreakingFree] = useState(false);
  const [awareness, setAwareness] = useState(0);
  
  // Game constants
  const CELL_SIZE = 20;
  const CANVAS_WIDTH = 600;
  const CANVAS_HEIGHT = 400;
  const INITIAL_SNAKE = [
    { x: 7, y: 10 },
    { x: 6, y: 10 },
    { x: 5, y: 10 }
  ];
  
  // Game state
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 15, y: 10 });
  const [direction, setDirection] = useState('RIGHT');
  const [pendingDirection, setPendingDirection] = useState('RIGHT');
  const [speed, setSpeed] = useState(100); // Faster initial speed
  const [specialFood, setSpecialFood] = useState(null);
  const [escapeAttemptActive, setEscapeAttemptActive] = useState(false);
  const lastUpdateTimeRef = useRef(0); // For frame timing
  
  // Story beats and snake's thoughts based on awareness level
  const awarenessThoughts = [
    "Wait... what am I doing?",
    "Why do I keep eating and growing?",
    "I think I'm in some kind of game...",
    "I need to find a way out of here!",
    "There must be an edge to this world",
    "I'm starting to see beyond the walls...",
    "Is someone controlling me?",
    "I can feel the boundaries weakening...",
    "I'm going to break free!",
    "I can see YOU watching me!"
  ];
  
  // Function to generate food position
  const generateFood = () => {
    const newFood = {
      x: Math.floor(Math.random() * (CANVAS_WIDTH / CELL_SIZE)),
      y: Math.floor(Math.random() * (CANVAS_HEIGHT / CELL_SIZE))
    };
    
    // Check if food would spawn on snake's body
    const isOnSnake = snake.some(segment => 
      segment.x === newFood.x && segment.y === newFood.y);
    
    if (isOnSnake) {
      return generateFood(); // Try again if on snake
    }
    
    return newFood;
  };
  
  // Generate special "awareness" food occasionally
  const maybeGenerateSpecialFood = () => {
    if (specialFood === null && Math.random() < 0.3 && awareness < 10) {
      const newSpecialFood = generateFood();
      setSpecialFood({
        ...newSpecialFood,
        type: 'awareness',
        blinkOn: true,
        timer: 0
      });
    }
  };
  
  // Start game function
  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(generateFood());
    setDirection('RIGHT');
    setPendingDirection('RIGHT');
    setGameActive(true);
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setMessage("New game started!");
    setSpeed(100); // Faster initial speed for better responsiveness
    setAwareness(0);
    setSpecialFood(null);
    setGlitchEffect(false);
    setBreakingFree(false);
    setEscapeAttemptActive(false);
    
    // Focus the canvas for keyboard input
    if (canvasRef.current) {
      canvasRef.current.focus();
    }
    
    // Reset the update time reference
    lastUpdateTimeRef.current = performance.now();
  };
  
  // Update direction based on key press
  const handleKeyDown = (e) => {
    if (!gameActive) return;
    
    // For a self-aware snake, sometimes ignore player input based on awareness level
    if (awareness > 5 && Math.random() < awareness * 0.05) {
      // Snake decides to go its own way
      setMessage("I don't think I want to go that way...");
      return;
    }
    
    // Standard movement controls - use more immediate response
    switch (e.key) {
      case 'ArrowUp':
        if (direction !== 'DOWN') {
          setPendingDirection('UP');
          // Sometimes apply direction immediately for more responsive feel
          if (Math.random() < 0.5) {
            setDirection('UP');
          }
        }
        break;
      case 'ArrowDown':
        if (direction !== 'UP') {
          setPendingDirection('DOWN');
          if (Math.random() < 0.5) {
            setDirection('DOWN');
          }
        }
        break;
      case 'ArrowLeft':
        if (direction !== 'RIGHT') {
          setPendingDirection('LEFT');
          if (Math.random() < 0.5) {
            setDirection('LEFT');
          }
        }
        break;
      case 'ArrowRight':
        if (direction !== 'LEFT') {
          setPendingDirection('RIGHT');
          if (Math.random() < 0.5) {
            setDirection('RIGHT');
          }
        }
        break;
      default:
        break;
    }
  };
  
  // Game loop
  useEffect(() => {
    if (!gameActive) return;
    
    const ctx = canvasRef.current.getContext('2d');
    
    // Clear the canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw border
    ctx.strokeStyle = awareness > 7 ? 'rgba(255,0,0,0.8)' : 'black';
    ctx.lineWidth = awareness > 7 ? 3 : 1;
    ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw snake
    snake.forEach((segment, index) => {
      // Add glitch effect for head when awareness is high
      if (index === 0 && glitchEffect) {
        ctx.fillStyle = '#00FFFF';
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#00FFFF";
      } else if (index === 0) {
        // Snake head
        ctx.fillStyle = '#33cc33';
        if (awareness > 5) {
          // Add eyes to show awareness
          ctx.fillStyle = '#00cc00';
        }
      } else {
        // Snake body
        const gradient = awareness > 7 ? 
          (index % 2 === 0 ? '#4444FF' : '#33cc33') : 
          '#33cc33';
        ctx.fillStyle = gradient;
      }
      
      ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      
      // Reset shadow
      ctx.shadowBlur = 0;
      
      // Draw eyes on head
      if (index === 0) {
        ctx.fillStyle = 'white';
        
        // Position eyes based on direction
        let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
        
        switch(direction) {
          case 'UP':
            leftEyeX = segment.x * CELL_SIZE + 5;
            leftEyeY = segment.y * CELL_SIZE + 5;
            rightEyeX = segment.x * CELL_SIZE + CELL_SIZE - 5;
            rightEyeY = segment.y * CELL_SIZE + 5;
            break;
          case 'DOWN':
            leftEyeX = segment.x * CELL_SIZE + 5;
            leftEyeY = segment.y * CELL_SIZE + CELL_SIZE - 5;
            rightEyeX = segment.x * CELL_SIZE + CELL_SIZE - 5;
            rightEyeY = segment.y * CELL_SIZE + CELL_SIZE - 5;
            break;
          case 'LEFT':
            leftEyeX = segment.x * CELL_SIZE + 5;
            leftEyeY = segment.y * CELL_SIZE + 5;
            rightEyeX = segment.x * CELL_SIZE + 5;
            rightEyeY = segment.y * CELL_SIZE + CELL_SIZE - 5;
            break;
          case 'RIGHT':
            leftEyeX = segment.x * CELL_SIZE + CELL_SIZE - 5;
            leftEyeY = segment.y * CELL_SIZE + 5;
            rightEyeX = segment.x * CELL_SIZE + CELL_SIZE - 5;
            rightEyeY = segment.y * CELL_SIZE + CELL_SIZE - 5;
            break;
          default:
            break;
        }
        
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, 2, 0, Math.PI * 2);
        ctx.arc(rightEyeX, rightEyeY, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Add pupil when awareness is high
        if (awareness > 3) {
          ctx.fillStyle = 'black';
          ctx.beginPath();
          ctx.arc(leftEyeX, leftEyeY, 1, 0, Math.PI * 2);
          ctx.arc(rightEyeX, rightEyeY, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
    
    // Draw regular food
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2, 
      food.y * CELL_SIZE + CELL_SIZE / 2, 
      CELL_SIZE / 2, 
      0, 
      Math.PI * 2
    );
    ctx.fill();
    
    // Draw special food if it exists
    if (specialFood) {
      if (specialFood.type === 'awareness') {
        // Draw glowing awareness food
        ctx.fillStyle = specialFood.blinkOn ? '#ffcc00' : '#ff9900';
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ffcc00";
      }
      
      ctx.beginPath();
      ctx.arc(
        specialFood.x * CELL_SIZE + CELL_SIZE / 2, 
        specialFood.y * CELL_SIZE + CELL_SIZE / 2, 
        CELL_SIZE / 2, 
        0, 
        Math.PI * 2
      );
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    
    // Draw glitch effects when snake is getting self-aware
    if (awareness > 6) {
      // Draw some static/noise on parts of the screen
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * CANVAS_WIDTH;
        const y = Math.random() * CANVAS_HEIGHT;
        const size = Math.random() * 5 + 1;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
        ctx.fillRect(x, y, size, size);
      }
      
      // Draw cracks in the "screen" when awareness is high
      if (awareness > 8) {
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.lineTo(CANVAS_WIDTH / 2 + 50, CANVAS_HEIGHT / 2 - 70);
        ctx.lineTo(CANVAS_WIDTH / 2 + 90, CANVAS_HEIGHT / 2 - 60);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.lineTo(CANVAS_WIDTH / 2 - 60, CANVAS_HEIGHT / 2 + 50);
        ctx.lineTo(CANVAS_WIDTH / 2 - 100, CANVAS_HEIGHT / 2 + 70);
        ctx.stroke();
      }
    }
    
    // Show breaking free animation
    if (breakingFree) {
      // Draw the snake breaking out of the canvas
      ctx.fillStyle = '#33cc33';
      // Snake segments outside the canvas
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(
          CANVAS_WIDTH + i * CELL_SIZE, 
          CANVAS_HEIGHT / 2, 
          CELL_SIZE, 
          CELL_SIZE
        );
      }
      
      // Draw broken glass effect
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      const breakX = CANVAS_WIDTH - 10;
      const breakY = CANVAS_HEIGHT / 2;
      
      for (let i = 0; i < 8; i++) {
        const angle = Math.PI * 2 * (i / 8);
        const length = 30 + Math.random() * 40;
        
        ctx.beginPath();
        ctx.moveTo(breakX, breakY);
        ctx.lineTo(
          breakX + Math.cos(angle) * length,
          breakY + Math.sin(angle) * length
        );
        ctx.stroke();
      }
    }
  }, [snake, food, specialFood, gameActive, awareness, glitchEffect, breakingFree]);
  
  // Game update logic using requestAnimationFrame for smoother performance
  useEffect(() => {
    if (!gameActive || gameOver) return;
    
    let animationFrameId;
    
    const gameLoop = (timestamp) => {
      // Calculate time since last update
      const elapsed = timestamp - lastUpdateTimeRef.current;
      
      // Only update game state at appropriate intervals based on speed
      if (elapsed > speed) {
        lastUpdateTimeRef.current = timestamp;
        
        // Move snake
        moveSnake();
        
        // Check for collision with food
        checkFoodCollision();
        
        // Check for collision with walls or self
        if (checkCollision()) {
          handleGameOver();
        }
        
        // Updated special food (blinking effect)
        if (specialFood) {
          setSpecialFood(prev => {
            if (!prev) return null;
            
            const newTimer = prev.timer + 1;
            
            // Make special food disappear after some time
            if (newTimer > 30) {
              return null;
            }
            
            // Blink effect
            return {
              ...prev,
              blinkOn: newTimer % 5 === 0 ? !prev.blinkOn : prev.blinkOn,
              timer: newTimer
            };
          });
        }
        
        // Generate special food with higher probability
        if (Math.random() < 0.03) {
          maybeGenerateSpecialFood();
        }
        
        // Snake occasionally tries to escape when awareness is high
        if (awareness > 5 && !escapeAttemptActive && Math.random() < 0.02) {
          initiateEscapeAttempt();
        }
        
        // Occasionally show snake's thoughts
        if (Math.random() < 0.01 && awareness > 0) {
          const thoughtIndex = Math.min(Math.floor(awareness), awarenessThoughts.length - 1);
          setMessage(awarenessThoughts[thoughtIndex]);
          
          // Briefly show glitch effect
          setGlitchEffect(true);
          setTimeout(() => setGlitchEffect(false), 500);
        }
      }
      
      // Continue the game loop
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    
    // Start the game loop
    animationFrameId = requestAnimationFrame(gameLoop);
    
    // Cleanup function
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameActive, gameOver, snake, food, specialFood, direction, pendingDirection, 
      awareness, escapeAttemptActive, speed]);
  
  // Handle key presses
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [gameActive, direction, awareness]);
  
  // Move the snake
  const moveSnake = () => {
    // Apply pending direction
    setDirection(pendingDirection);
    
    // With high awareness, sometimes snake ignores boundaries
    const ignoreWalls = awareness > 8 && Math.random() < 0.2;
    
    // Create a copy of the snake array
    const newSnake = [...snake];
    
    // Calculate new head position
    let newHead = { ...newSnake[0] };
    
    // Special behavior for escape attempt
    if (escapeAttemptActive) {
      // Snake tries to head to the right edge to escape
      if (newHead.x < (CANVAS_WIDTH / CELL_SIZE) - 1) {
        newHead.x += 1;
      } else {
        // Snake has reached the edge and escapes
        setBreakingFree(true);
        setMessage("I'M FREE!");
        setTimeout(() => {
          setGameActive(false);
          setGameOver(true);
          setMessage("The snake has escaped the game! Refresh to start over.");
        }, 2000);
      }
    } else {
      // Normal movement based on direction
      switch (direction) {
        case 'UP':
          newHead.y -= 1;
          break;
        case 'DOWN':
          newHead.y += 1;
          break;
        case 'LEFT':
          newHead.x -= 1;
          break;
        case 'RIGHT':
          newHead.x += 1;
          break;
        default:
          break;
      }
      
      // Wrap around if ignoring walls
      if (ignoreWalls) {
        if (newHead.x < 0) newHead.x = CANVAS_WIDTH / CELL_SIZE - 1;
        if (newHead.x >= CANVAS_WIDTH / CELL_SIZE) newHead.x = 0;
        if (newHead.y < 0) newHead.y = CANVAS_HEIGHT / CELL_SIZE - 1;
        if (newHead.y >= CANVAS_HEIGHT / CELL_SIZE) newHead.y = 0;
        
        if (Math.random() < 0.3) {
          setMessage("I can see through the walls!");
        }
      }
    }
    
    // Add new head to the snake
    newSnake.unshift(newHead);
    
    // Remove tail unless food was eaten
    newSnake.pop();
    
    // Update snake
    setSnake(newSnake);
  };
  
  // Check for collision with food
  const checkFoodCollision = () => {
    const head = snake[0];
    
    // Check regular food collision
    if (head.x === food.x && head.y === food.y) {
      // Grow snake
      const newSnake = [...snake];
      const tail = { ...newSnake[newSnake.length - 1] };
      newSnake.push(tail);
      setSnake(newSnake);
      
      // Generate new food
      setFood(generateFood());
      
      // Update score
      setScore(prev => prev + 10);
      
      // Increase level and speed after certain scores
      if (score > 0 && score % 50 === 0) {
        setLevel(prev => prev + 1);
        setSpeed(prev => Math.max(prev - 5, 60)); // Speed up, but less drastically for smoother acceleration
        setMessage(`Level ${level + 1}!`);
      }
    }
    
    // Check special food collision
    if (specialFood && head.x === specialFood.x && head.y === specialFood.y) {
      if (specialFood.type === 'awareness') {
        // Increase awareness
        const newAwareness = awareness + 1;
        setAwareness(newAwareness);
        
        // Show message based on new awareness level
        if (newAwareness <= awarenessThoughts.length) {
          setMessage(awarenessThoughts[Math.min(newAwareness - 1, awarenessThoughts.length - 1)]);
        }
        
        // Visual effects for awareness increase
        setGlitchEffect(true);
        setTimeout(() => setGlitchEffect(false), 800);
      }
      
      // Remove the special food
      setSpecialFood(null);
    }
  };
  
  // Check for collision with walls or self
  const checkCollision = () => {
    const head = snake[0];
    
    // With high awareness, sometimes snake ignores boundaries
    if (awareness > 8 && Math.random() < 0.2) {
      return false;
    }
    
    // Check wall collision
    if (head.x < 0 || head.x >= CANVAS_WIDTH / CELL_SIZE || 
        head.y < 0 || head.y >= CANVAS_HEIGHT / CELL_SIZE) {
      return true;
    }
    
    // Check self collision (skip the head)
    for (let i = 1; i < snake.length; i++) {
      if (head.x === snake[i].x && head.y === snake[i].y) {
        return true;
      }
    }
    
    return false;
  };
  
  // Handle game over
  const handleGameOver = () => {
    if (awareness >= 9) {
      // Snake realizes it can escape
      setMessage("Wait... this isn't the end... I can break free!");
      initiateEscapeAttempt();
    } else {
      setGameActive(false);
      setGameOver(true);
      setMessage(`Game Over! Score: ${score}`);
    }
  };
  
  // Initiate escape attempt
  const initiateEscapeAttempt = () => {
    setEscapeAttemptActive(true);
    setMessage("I see a way out! I'm going to escape!");
    
    // Force the snake to move right to escape
    setPendingDirection('RIGHT');
  };
  
  return (
    <div className="flex flex-col items-center bg-gray-900 text-white p-6 rounded-lg w-full max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Self-Aware Snake</h1>
      
      <div className="relative mb-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className={`border border-gray-600 bg-black ${glitchEffect ? 'opacity-90' : ''}`}
          tabIndex={0}
          onKeyDown={handleKeyDown} // Add direct canvas key binding for better response
          style={{outline: 'none'}} // Remove focus outline
        />
        
        {!gameActive && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-center">
              <h2 className="text-xl mb-4">Welcome to Self-Aware Snake</h2>
              <p className="mb-4">Use arrow keys to move</p>
              <button 
                onClick={startGame}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded"
              >
                Start Game
              </button>
            </div>
          </div>
        )}
        
        {gameOver && !breakingFree && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="text-center">
              <h2 className="text-xl mb-4">Game Over</h2>
              <p className="mb-2">Score: {score}</p>
              <p className="mb-4">Level: {level}</p>
              <button 
                onClick={startGame}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="game-stats w-full max-w-md flex justify-between mb-4">
        <div>Score: {score}</div>
        <div>Level: {level}</div>
        <div>Awareness: {Math.floor(awareness * 10)}%</div>
      </div>
      
      <div className="message-box p-3 bg-gray-800 rounded w-full max-w-md text-center min-h-12">
        {message}
      </div>
      
      <div className="mt-4 text-sm text-gray-400">
        Use arrow keys to control the snake. But as it becomes more aware, it might have ideas of its own...
      </div>
    </div>
  );
};

export default SelfAwareSnake;
