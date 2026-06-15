const fs = require('fs');
let code = fs.readFileSync('d:/Projects/voidstream/components/media/VideoPlayer.tsx', 'utf8');

const imports = `import { SettingsModal } from './player/SettingsModal';
import { QuickServerStrip } from './player/QuickServerStrip';
import { PlayerTopBar } from './player/PlayerTopBar';
import { TutorialSpotlight } from './player/TutorialSpotlight';
import { ConnectingOverlay } from './player/ConnectingOverlay';
import { TestingSourcesOverlay } from './player/TestingSourcesOverlay';
import { UpNextOverlay } from './player/UpNextOverlay';
`;
code = code.replace(/import \{ getSupportAccess, SUPPORT_ACCESS_KEY, SUPPORT_ACCESS_UPDATED_EVENT \} from '@\/lib\/support-access';/, match => match + '\n' + imports);

code = code.replace(/const \[showNextOverlay, setShowNextOverlay\] = useState\(false\);/, 
  `const [showNextOverlay, setShowNextOverlay] = useState(false);
  const showNextOverlayRef = useRef(false);
  useEffect(() => { showNextOverlayRef.current = showNextOverlay; }, [showNextOverlay]);`);

code = code.replace(/if \(type === 'tv' && hasNextEpisode && realProgress >= 90 && !showNextOverlay\) \{/, 
  `if (type === 'tv' && hasNextEpisode && realProgress >= 90 && !showNextOverlayRef.current) {`);

code = code.replace(/const works = Math\.random\(\) > \(i === 0 \? 0\.1 : 0\.4\);/, 
  `const works = true; // Deterministic: always prefer the top source or cached source`);
code = code.replace(/const checkTime = Math\.random\(\) \* 800 \+ 400;/, 
  `const checkTime = 500;`);

code = code.replace(/<AnimatePresence>\s*\{showTutorial && \(.*?<\/AnimatePresence>/s, 
  `<TutorialSpotlight showTutorial={showTutorial} setShowTutorial={setShowTutorial} tutorialCountdown={tutorialCountdown} />`);

code = code.replace(/\{mounted && typeof document !== 'undefined' && createPortal\(\s*<AnimatePresence>\s*\{showSettingsModal && \(.*?<\/AnimatePresence>,\s*document\.body\s*\)/s, 
  `{mounted && typeof document !== 'undefined' && createPortal(
        <SettingsModal
          showSettingsModal={showSettingsModal}
          setShowSettingsModal={setShowSettingsModal}
          sources={sources}
          currentSourceId={currentSourceId}
          handleSwitchServer={handleSwitchServer}
          favoriteServers={favoriteServers}
          toggleFavServer={toggleFavServer}
          showAllServers={showAllServers}
          setShowAllServers={setShowAllServers}
          useSandbox={useSandbox}
          setUseSandbox={setUseSandbox}
          autoSandboxOnSwitch={autoSandboxOnSwitch}
          setAutoSandboxOnSwitch={setAutoSandboxOnSwitch}
          type={type}
          autoPlayNext={autoPlayNext}
          setAutoPlayNext={setAutoPlayNext}
          dataSaver={dataSaver}
          updatePreferences={updatePreferences}
          showToast={showToast}
          id={id}
          storage={storage}
        />, document.body)}`);

code = code.replace(/\{!isFullscreen && \(\s*<div className="relative flex items-center justify-between gap-2 px-2\.5 py-2 bg-void-950 border-b border-zinc-800\/60 shrink-0 w-full".*?<\/div>\s*\)\}/s,
  `{/* PlayerTopBar replaced */}\n      <PlayerTopBar
        isFullscreen={isFullscreen}
        setShowSettingsModal={setShowSettingsModal}
        source={source}
        setShowShareModal={setShowShareModal}
        useSandbox={useSandbox}
        setUseSandbox={setUseSandbox}
        currentSourceId={currentSourceId}
        showToast={showToast}
        isFav={isFav}
        toggleFavorite={() => toggleFavorite({ id, type, title: title || '', poster, release_date: releaseYear })}
        toggleFullscreen={toggleFullscreen}
      />`);

code = code.replace(/\{!isFullscreen && \(\(\) => \{[^}]*const top7 = sources\.filter\(s => TOP_8_IDS\.includes\(s\.id\)\);.*?\}\)\(\)\}/s,
  `<QuickServerStrip
        isFullscreen={isFullscreen}
        currentSourceId={currentSourceId}
        sources={sources}
        handleSwitchServer={handleSwitchServer}
        setShowSettingsModal={setShowSettingsModal}
        activeTabRef={activeTabRef}
      />`);

code = code.replace(/\{testingSources \? \(\s*<div className="absolute inset-0 z-40 bg-void-950 flex flex-col items-center justify-center p-4 text-center overflow-hidden">.*?<\/div>\s*\) :/s,
  `{testingSources ? (
          <TestingSourcesOverlay
            testingSources={testingSources}
            poster={poster}
            testingCurrentName={testingCurrentName}
            testProgress={testProgress}
          />
        ) :`);

code = code.replace(/<AnimatePresence>\s*\{isConnecting && \(\s*<motion\.div\s*initial=\{\{ opacity: 0 \}\}.*?<\/motion\.div>\s*\)\s*\}\s*<\/AnimatePresence>/s,
  `<ConnectingOverlay
              isConnecting={isConnecting}
              poster={poster}
              networkSpeed={networkSpeed}
              source={source}
              connectProgress={connectProgress}
            />`);

code = code.replace(/<AnimatePresence>\s*\{showNextOverlay && hasNextEpisode && \(.*?<\/AnimatePresence>/s,
  `<UpNextOverlay
          showNextOverlay={showNextOverlay}
          hasNextEpisode={hasNextEpisode || false}
          countdown={countdown}
          setShowNextOverlay={setShowNextOverlay}
          onPlayNext={onPlayNext}
        />`);

code = code.replace(/text-\[var\(--premium-text,#ffffff\)]/g, 'text-white');

fs.writeFileSync('d:/Projects/voidstream/components/media/VideoPlayer.tsx', code);
console.log('Done refactoring VideoPlayer.tsx');
