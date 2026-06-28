const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../components/media');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const checkScrollRegex = /const checkScroll = useCallback\(\(\) => \{[\s\S]*?\}, \[\]\);/m;

const replacementThrottle = `  // Cache dimensions to avoid layout thrashing
  const dimensions = useRef({ width: 0, client: 0 });

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    if (dimensions.current.client === 0) {
      dimensions.current.width = el.scrollWidth;
      dimensions.current.client = el.clientWidth;
    }
    
    const maxScroll = dimensions.current.width - dimensions.current.client;
    setCanScrollLeft(el.scrollLeft > 20);
    setCanScrollRight(el.scrollLeft < maxScroll - 15);
  }, []);

  // Throttle scroll events via requestAnimationFrame for 60fps buttery smooth scrolling
  const isScrolling = useRef(false);
  const handleScroll = useCallback(() => {
    if (!isScrolling.current) {
      isScrolling.current = true;
      requestAnimationFrame(() => {
        checkScroll();
        isScrolling.current = false;
      });
    }
  }, [checkScroll]);`;

for (const file of files) {
  const filepath = path.join(dir, file);
  let content = fs.readFileSync(filepath, 'utf8');
  
  if (content.includes('const checkScroll = useCallback(() => {') && !content.includes('dimensions.current.client')) {
    
    // Replace checkScroll
    content = content.replace(checkScrollRegex, replacementThrottle);
    
    // Replace window resize handler to reset cache
    const useEffectRegex = /useEffect\(\(\) => \{\s*checkScroll\(\);\s*const timer = setTimeout\(checkScroll, 500\);\s*window\.addEventListener\('resize', checkScroll\);\s*return \(\) => \{\s*clearTimeout\(timer\);\s*window\.removeEventListener\('resize', checkScroll\);\s*\};\s*\}, \[checkScroll, (.*?)\]\);/m;
    
    const useEffectReplacement = `useEffect(() => {
    const handleResize = () => {
      dimensions.current.client = 0;
      checkScroll();
    };
    handleResize();
    const timer = setTimeout(handleResize, 500);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [checkScroll, $1]);`;
  
    content = content.replace(useEffectRegex, useEffectReplacement);
    
    // Replace onScroll attribute
    content = content.replace(/onScroll=\{checkScroll\}/g, 'onScroll={handleScroll}');
    
    // Add willChange for GPU accel
    content = content.replace(/paddingBottom: '24px',/g, "paddingBottom: '24px',\n            willChange: 'transform',\n            transform: 'translateZ(0)',");
    
    fs.writeFileSync(filepath, content);
    console.log("Updated", file);
  }
}
