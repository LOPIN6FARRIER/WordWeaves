// App.tsx
import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { bilingualText } from "./data";

interface Letter {
  char: string;
  status?: "correct" | "incorrect";
}

interface Word {
  english: string;
  spanish: string;
  letters: Letter[];
  typed: string;
  status?: "correct" | "marked";
}

type GameStatus = "init" | "playing" | "finished" | "paused";
type GameMode = "timed" | "free";
const App: React.FC = () => {
  // Estados del juego
  const [gameStatus, setGameStatus] = useState<GameStatus>("init");
  const [timeLeft, setTimeLeft] = useState<number>(32);
  const [gameDuration, setGameDuration] = useState<number>(32);
  const [wordCount, setWordCount] = useState<number>(32);
  const [words, setWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [currentInput, setCurrentInput] = useState<string>("");
  const [wpm, setWpm] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [gameMode, setGameMode] = useState<GameMode>("timed");

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Función para iniciar el juego
  // Función para iniciar el juego
  function sanitizeText(text: string): string {
    return text
      // Reemplaza múltiples espacios, saltos de línea y tabulaciones por un solo espacio
      .replace(/\s+/g, ' ')
      // Trim para quitar espacios sobrantes al inicio y al final
      .trim();
  }
  
  
  const initGame = () => {
    setGameStatus("playing");
    setCurrentWordIndex(0);
    setCurrentInput("");
    const numberOftext = bilingualText.length;
    const randomText = Math.floor(Math.random() * numberOftext) + 1;
    // Separamos el texto en inglés y en español en palabras
    const rawEnglish = bilingualText[randomText - 1].english;
    const rawSpanish = bilingualText[randomText - 1].spanish;

    // Limpias los textos
    const cleanedEnglish = sanitizeText(rawEnglish);
    const cleanedSpanish = sanitizeText(rawSpanish);

    // Finalmente separas por espacio
    const englishWords = cleanedEnglish.split(" ");
    const spanishWords = cleanedSpanish.split(" ");

    // Si el wordCount es menor que la cantidad total de palabras, usamos solo esa cantidad
    const count = Math.min(wordCount, englishWords.length);
    const wordObjs: Word[] = [];
    for (let i = 0; i < count; i++) {
      wordObjs.push({
        english: englishWords[i],
        spanish: spanishWords[i] || "",
        letters: englishWords[i].split("").map((ch) => ({ char: ch })),
        typed: "",
        status: undefined,
      });
    }
    setWords(wordObjs);
    setTimeLeft(gameDuration);
    // Enfocar el input

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
    
  };
  // Efecto para el temporizador
  useEffect(() => {
    if (gameStatus === "playing" && gameMode === "timed") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            gameOver();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStatus]);

  // Función que finaliza el juego y calcula resultados
  const gameOver = () => {
    setGameStatus("finished");
    let correctWords = 0;
    let correctLetters = 0;
    let incorrectLetters = 0;
    words.forEach((word) => {
      if (word.status === "correct") correctWords++;
      word.letters.forEach((letter) => {
        if (letter.status === "correct") correctLetters++;
        if (letter.status === "incorrect") incorrectLetters++;
      });
    });
    const totalLetters = correctLetters + incorrectLetters;
    const acc = totalLetters > 0 ? (correctLetters / totalLetters) * 100 : 0;
    setAccuracy(acc);
    const computedWpm = (correctWords * 60) / gameDuration;
    setWpm(computedWpm);
  };

  // Actualiza la letra actual en función del texto que escribe el usuario
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCurrentInput(value);
    setWords((prev) => {
      const newWords = [...prev];
      const currentWord = newWords[currentWordIndex];
      currentWord.typed = value;
      currentWord.letters = currentWord.english.split("").map((ch, idx) => {
        const typedChar = value[idx] || "";
        let status: "correct" | "incorrect" | undefined;
        if (typedChar) {
          status = typedChar === ch ? "correct" : "incorrect";
        }
        return { char: ch, status };
      });
      return newWords;
    });
  };

  // Maneja teclas especiales (espacio y backspace)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (gameStatus === "paused") gameOver();
    if (gameStatus !== "playing") return;
    if (e.key === " ") {
      e.preventDefault();
      // Actualizamos el estado de la palabra actual
      setWords((prev) => {
        const newWords = [...prev];
        const currentWord = newWords[currentWordIndex];
        const hasError = currentWord.letters.some(
          (letter) => letter.status !== "correct"
        );
        currentWord.status = hasError ? "marked" : "correct";
        return newWords;
      });
      // Si no es la última palabra, avanzamos normalmente
      if (currentWordIndex + 1 < words.length) {
        setCurrentWordIndex(currentWordIndex + 1);
        setCurrentInput("");
      } else {
        setGameStatus("paused");
        // Es la última palabra, esperamos un breve instante para que se renderice la traducción
      }
    } else if (e.key === "Backspace") {
      // Si el input está vacío y existe palabra anterior, permite regresar
      if (currentInput === "" && currentWordIndex > 0) {
        e.preventDefault();
        setCurrentWordIndex(currentWordIndex - 1);
        const prevTyped = words[currentWordIndex - 1].typed;
        setCurrentInput(prevTyped);
        setWords((prev) => {
          const newWords = [...prev];
          newWords[currentWordIndex - 1].status = undefined;
          return newWords;
        });
      }
    }else if (e.key === "Escape") {
      gameOver();
    }
  };

  // Renderiza el panel de texto en inglés (el que se escribe)
  const renderEnglishWords = () => {
    return words.map((word, wordIndex) => {
      const isActive =
        wordIndex === currentWordIndex && gameStatus === "playing";
      return (
        <span
          key={wordIndex}
          className={`word ${word.status ? word.status : ""} ${
            isActive ? "active" : ""
          }`}
        >
          {word.english.split("").map((ch, idx) => {
            let letterClass = "";
            if (isActive) {
              if (idx === currentInput.length) {
                letterClass += " active";
                if (
                  idx === word.english.length - 1 &&
                  currentInput.length >= word.english.length
                ) {
                  letterClass += " is-last";
                }
              }
            }
            const letterStatus = word.letters[idx]?.status;
            if (letterStatus) {
              letterClass += ` ${letterStatus}`;
            }
            return (
              <span key={idx} className={`letter${letterClass}`}>
                {ch}
              </span>
            );
          })}
        </span>
      );
    });
  };

  // Renderiza el panel de texto en español, revelando la traducción si la palabra fue tipeada correctamente
  // Renderiza el panel de texto en español, revelando la traducción
  // si la palabra fue tipeada correctamente, o asteriscos en rojo si fue marcada como errónea.
  const renderSpanishWords = () => {
    return words.map((word, wordIndex) => {
      if (word.status === "correct") {
        return (
          <span key={wordIndex} className="word spanish-word revealed">
            {word.spanish}
          </span>
        );
      } else if (word.status === "marked") {
        return (
          <span key={wordIndex} className="word spanish-word error">
            {"*".repeat(word.spanish.length)}
          </span>
        );
      } else {
        // Para palabras que aún no han sido tipeadas, se puede dejar vacío
        return (
          <span key={wordIndex} className="word spanish-word">
            &nbsp;
          </span>
        );
      }
    });
  };

  return (
    <div className="container">
      <main>
        <h4>Word Wæves</h4>
        {(gameStatus === "init" || gameStatus === "finished") && (
          <div id="options">
            {gameMode === "timed" && (
              <>
                <label htmlFor="time-select">Time:</label>
                <select
                  id="time-select"
                  value={gameDuration}
                  onChange={(e) => {
                    const t = parseInt(e.target.value);
                    setGameDuration(t);
                    setTimeLeft(t);
                  }}
                >
                  <option value="32">32 seconds</option>
                  <option value="64">64 seconds</option>
                  <option value="128">128 seconds</option>
                  <option value="256">256 seconds</option>
                  <option value="512">512 seconds</option>
                </select>
              </>
            )}
            <label htmlFor="time-select">Modo de Juego:</label>
            <select
              id="gameMode-select"
              value={gameMode}
              onChange={(e) => {
                setGameMode(e.target.value as GameMode);
              }}
            >
              <option value="timed">Contra Reloj</option>
              <option value="free">Free</option>
            </select>

            <label htmlFor="word-count-select">Word Count:</label>
            <select
              id="word-count-select"
              value={wordCount}
              onChange={(e) => setWordCount(parseInt(e.target.value))}
            >
              <option value="32">32 words</option>
              <option value="64">64 words</option>
              <option value="128">128 words</option>
              <option value="256">256 words</option>
              <option value="512">512 words</option>
              <option value="1024">1024 words</option>
            </select>
            <button id="init-button" onClick={initGame}>
              {/* Ícono de play */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="icon"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M7 4v16l13 -8z" />
              </svg>
            </button>
          </div>
        )}

        {(gameStatus === "playing" || gameStatus === "paused") && (
          <section id="game">
            {(gameMode==="timed" && (<time>{timeLeft} Sec.</time>))}
            <div className="panels">
              <div id="english-panel">
                <p>{renderEnglishWords()}</p>
                <input
                  ref={inputRef}
                  autoFocus
                  value={currentInput}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  onBlur={() => inputRef.current?.focus()}
                />
              </div>
              <div id="spanish-panel">
                <p>{renderSpanishWords()}</p>
              </div>
            </div>
          </section>
        )}

        {gameStatus === "finished" && (
          <section id="results">
            <h2>WPM</h2>
            <h3 id="wpm">{wpm.toFixed(0)}</h3>
            <h2>Accuracy</h2>
            <h3 id="results-accuracy">{accuracy.toFixed(2)}%</h3>
            <button id="reload-button" onClick={initGame}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M19.933 13.041a8 8 0 1 1 -9.925 -8.788c3.899 -1 7.935 1.007 9.425 4.747" />
                <path d="M20 4v5h-5" />
              </svg>
            </button>
          </section>
        )}
      </main>
    </div>
  );
};

export default App;
