import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { songs } from "./songs";
import "./Prompter.css";

const NOTES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const ENHARMONIC = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#",
};

function transposeNote(note, amount) {
  const normalized = ENHARMONIC[note] || note;
  const index = NOTES.indexOf(normalized);
  if (index < 0) return note;
  return NOTES[(index + amount + 120) % 12];
}

function transposeChord(chord, amount) {
  const match = chord.match(
    /^([A-G](?:#|b)?)([^/\s]*)(?:\/([A-G](?:#|b)?))?$/
  );

  if (!match) return chord;

  const [, root, suffix, bass] = match;
  const nextRoot = transposeNote(root, amount);
  const nextBass = bass ? `/${transposeNote(bass, amount)}` : "";
  return `${nextRoot}${suffix}${nextBass}`;
}

function transposeChordLine(line, amount) {
  if (amount === 0) return line;

  return line
    .split(/(\s+)/)
    .map((part) =>
      /^\s+$/.test(part) ? part : transposeChord(part, amount)
    )
    .join("");
}

function isChordLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return false;

  const chordRegex =
    /^[A-G](?:#|b)?(?:maj|min|sus|dim|aug|add|m)?\d*(?:\/[A-G](?:#|b)?)?$/i;

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  return tokens.length > 0 && tokens.every((token) => chordRegex.test(token));
}

export default function Prompter() {
  const appRef = useRef(null);
  const scrollRef = useRef(null);

  const [view, setView] = useState("home");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [transposeMap, setTransposeMap] = useState({});
  const [scrollSpeed, setScrollSpeed] = useState(30);

  const song = songs[selectedIndex];
  const transposeAmount = transposeMap[song.id] || 0;
  const currentKey = transposeNote(song.key, transposeAmount);

  const goHome = useCallback(() => {
    setPlaying(false);
    setView("home");

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const openSong = useCallback(
    (index = selectedIndex) => {
      setSelectedIndex(index);
      setPlaying(false);
      setView("song");

      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = 0;
        }
      });
    },
    [selectedIndex]
  );

  const previousSelection = useCallback(() => {
    setSelectedIndex((current) =>
      current === 0 ? songs.length - 1 : current - 1
    );
  }, []);

  const nextSelection = useCallback(() => {
    setSelectedIndex((current) => (current + 1) % songs.length);
  }, []);

  const scrollUp = useCallback(() => {
    scrollRef.current?.scrollBy({ top: -180, behavior: "smooth" });
  }, []);

  const scrollDown = useCallback(() => {
    scrollRef.current?.scrollBy({ top: 180, behavior: "smooth" });
  }, []);

  const togglePlay = useCallback(() => {
    setPlaying((value) => !value);
  }, []);

  // Mempercepat auto-scroll tanpa mengubah fungsi pedal.
  // Urutan: 30 -> 40 -> 50 -> 60 -> 70 -> 80 -> 20 -> ...
  const increaseScrollSpeed = useCallback(() => {
    setScrollSpeed((value) => {
      if (value >= 80) return 20;
      return value + 10;
    });
  }, []);

  const adjustTranspose = useCallback(
    (delta) => {
      setTransposeMap((current) => {
        const now = current[song.id] || 0;
        const next = Math.max(-6, Math.min(6, now + delta));
        return { ...current, [song.id]: next };
      });
    },
    [song.id]
  );

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await appRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen gagal:", error);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    if (view !== "song") return;

    let frame;
    let last = performance.now();

    const animate = (time) => {
      const delta = time - last;
      last = time;

      if (playing && scrollRef.current) {
        scrollRef.current.scrollTop += (scrollSpeed * delta) / 1000;
      }

      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [playing, scrollSpeed, view]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (view === "home") {
        if (event.code === "ArrowUp" || event.code === "ArrowLeft") {
          event.preventDefault();
          previousSelection();
          return;
        }

        if (event.code === "ArrowDown" || event.code === "ArrowRight") {
          event.preventDefault();
          nextSelection();
          return;
        }

        if (event.code === "Space" || event.code === "Enter") {
          event.preventDefault();
          openSong();
          return;
        }
      }

      if (view === "song") {
        if (event.code === "KeyS") {
          event.preventDefault();
          increaseScrollSpeed();
          return;
        }

        if (event.code === "ArrowUp") {
          event.preventDefault();
          scrollUp();
          return;
        }

        if (event.code === "ArrowDown") {
          event.preventDefault();
          scrollDown();
          return;
        }

        if (event.code === "Space") {
          event.preventDefault();
          togglePlay();
          return;
        }

        if (event.code === "Escape") {
          event.preventDefault();
          goHome();
          return;
        }

        if (event.code === "Equal" || event.code === "NumpadAdd") {
          event.preventDefault();
          adjustTranspose(1);
          return;
        }

        if (event.code === "Minus" || event.code === "NumpadSubtract") {
          event.preventDefault();
          adjustTranspose(-1);
          return;
        }

        if (event.code === "KeyF") {
          event.preventDefault();
          toggleFullscreen();
          return;
        }

        if (event.code === "BracketLeft") {
          event.preventDefault();
          setScrollSpeed((value) => Math.max(10, value - 5));
          return;
        }

        if (event.code === "BracketRight") {
          event.preventDefault();
          setScrollSpeed((value) => Math.min(80, value + 5));
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    adjustTranspose,
    goHome,
    increaseScrollSpeed,
    nextSelection,
    openSong,
    previousSelection,
    scrollDown,
    scrollUp,
    toggleFullscreen,
    togglePlay,
    view,
  ]);

  useEffect(() => {
    const onContextMenu = (event) => event.preventDefault();

    const onMouseDown = (event) => {
      const interactive = event.target.closest(
        "button, a, input, textarea, select"
      );

      if (interactive) return;

      if (view === "home") {
        if (event.button === 0) {
          event.preventDefault();
          previousSelection();
        } else if (event.button === 1) {
          event.preventDefault();
          openSong();
        } else if (event.button === 2) {
          event.preventDefault();
          nextSelection();
        }
        return;
      }

      if (view === "song") {
        if (event.button === 0) {
          event.preventDefault();
          scrollUp();
        } else if (event.button === 1) {
          event.preventDefault();
          togglePlay();
        } else if (event.button === 2) {
          event.preventDefault();
          scrollDown();
        }
      }
    };

    window.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("mousedown", onMouseDown);

    return () => {
      window.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [
    nextSelection,
    openSong,
    previousSelection,
    scrollDown,
    scrollUp,
    togglePlay,
    view,
  ]);

  const renderedLines = useMemo(() => {
    return song.content
      .replace(/^\n/, "")
      .split("\n")
      .map((line) => {
        if (isChordLine(line)) {
          return {
            type: "chord",
            text: transposeChordLine(line, transposeAmount),
          };
        }

        const trimmed = line.trim();

        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
          return { type: "section", text: trimmed.slice(1, -1) };
        }

        if (!trimmed) return { type: "blank", text: "" };
        return { type: "lyric", text: line };
      });
  }, [song.content, transposeAmount]);

  return (
    <div ref={appRef} className="app">
      {view === "home" ? (
        <main className="home">
          <div className="home-head">
            <h1>Music Prompter</h1>
            <p>Pilih lagu</p>
          </div>

          <div className="song-list">
            {songs.map((item, index) => (
              <button
                key={item.id}
                type="button"
                className={`song-card ${
                  index === selectedIndex ? "selected" : ""
                }`}
                onClick={() => openSong(index)}
              >
                <span className="song-number">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="song-info">
                  <strong>{item.title}</strong>
                  <small>
                    {item.artist} · Key {item.key}
                  </small>
                </span>
              </button>
            ))}
          </div>

          <div className="pedal-hint">
            <span>KIRI · SEBELUMNYA</span>
            <span>TENGAH · PILIH</span>
            <span>KANAN · BERIKUTNYA</span>
          </div>
        </main>
      ) : (
        <main className="song-view">
          {!isFullscreen && (
            <header className="song-topbar">
              <button type="button" className="home-button" onClick={goHome}>
                ← HOME
              </button>

              <div className="song-heading">
                <strong>{song.title}</strong>
                <small>{song.artist}</small>
              </div>

              <div className="transpose">
                <button
                  type="button"
                  onClick={() => adjustTranspose(-1)}
                  aria-label="Transpose turun"
                >
                  −
                </button>

                <div className="key-box">
                  <small>KEY</small>
                  <strong>{currentKey}</strong>
                </div>

                <button
                  type="button"
                  onClick={() => adjustTranspose(1)}
                  aria-label="Transpose naik"
                >
                  +
                </button>

                <button
                  type="button"
                  onClick={increaseScrollSpeed}
                  title="Percepat auto-scroll (S)"
                  aria-label="Percepat auto-scroll"
                  style={{
                    width: "auto",
                    minWidth: "70px",
                    padding: "0 10px",
                    color: "var(--accent)",
                    fontSize: "11px",
                    fontWeight: 800,
                  }}
                >
                  SPD {scrollSpeed}
                </button>
              </div>

              <button
                type="button"
                className="full-button"
                onClick={toggleFullscreen}
                title="Fullscreen"
              >
                ⛶
              </button>
            </header>
          )}

          <section
            ref={scrollRef}
            className={`lyrics ${isFullscreen ? "fullscreen" : ""}`}
          >
            <div className="lyrics-inner">
              {renderedLines.map((line, index) => {
                if (line.type === "blank") {
                  return (
                    <div key={index} className="blank">
                      &nbsp;
                    </div>
                  );
                }

                if (line.type === "section") {
                  return (
                    <div key={index} className="section">
                      {line.text}
                    </div>
                  );
                }

                return (
                  <div key={index} className={line.type}>
                    {line.text}
                  </div>
                );
              })}
            </div>
          </section>

          <div className="reading-line" />

          <div className="song-status">
            <span>{playing ? "PLAY" : "PAUSE"}</span>
            <span>KEY {currentKey}</span>
            <span>{scrollSpeed}px/s</span>
          </div>

          {!isFullscreen && (
            <div className="pedal-hint song-pedal">
              <span>KIRI · NAIK</span>
              <span>TENGAH · {playing ? "PAUSE" : "PLAY"}</span>
              <span>KANAN · TURUN</span>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
