import { useState } from 'react';

function AtlasArtwork({ usa }) {  const outline = usa ? 'M60 65 115 72 153 76 190 77 220 73 246 61 258 72 271 69 278 82 303 79 321 87 343 77 341 96 322 114 306 122 298 141 279 146 271 133 255 133 239 145 211 142 198 129 175 130 163 116 142 113 137 98 102 98 83 91 69 91Z' : 'M93 102 111 86 112 66 137 71 153 62 166 75 194 75 202 59 226 59 240 44 253 57 252 75 268 82 282 76 293 91 313 91 307 105 321 117 303 132 291 136 290 153 270 159 263 172 246 169 237 177 218 171 214 155 194 155 185 139 162 143 153 126 130 130 114 116 97 120Z';
  return <svg className="atlas-art" viewBox="0 0 400 230" aria-hidden="true"><defs><pattern id={usa ? 'us-grid' : 'cn-grid'} width="18" height="18" patternUnits="userSpaceOnUse"><path d="M18 0H0V18" fill="none" stroke="currentColor" strokeOpacity=".12" /></pattern><clipPath id={usa ? 'us-clip' : 'cn-clip'}><path d={outline} /></clipPath></defs><rect width="400" height="230" fill={`url(#${usa ? 'us-grid' : 'cn-grid'})`} /><text x="23" y="29" className="art-small">COCA-COLA BOTTLER SYSTEM</text><path d={outline} fill="currentColor" fillOpacity=".08" stroke="currentColor" strokeOpacity=".6" strokeWidth="1.3" /><g clipPath={`url(#${usa ? 'us-clip' : 'cn-clip'})`} stroke="currentColor" strokeOpacity=".35" fill="none"><path d="m130 49 9 60 20 18-9 39m39-126-5 46 19 21-15 60m46-129-10 53 17 20-9 55m39-128-12 58 15 24-4 46m-164-64 49-8 42 17 48-12 52 8m-178 10 42-2 35 16 47-9 46 5" /></g><g stroke="currentColor" strokeOpacity=".5" strokeDasharray="3 3" fill="none"><path d="M155 101 222 119 273 101M222 119l34 30M222 119l-41 17" /></g>{[[155, 101], [222, 119], [273, 101], [256, 149], [181, 136]].map(([x,y],i) => <g key={i}><circle cx={x} cy={y} r="7" fill="currentColor" fillOpacity=".12" /><circle cx={x} cy={y} r="2.5" fill="currentColor" /></g>)}<text x="24" y="206" className="art-region">{usa ? 'UNITED STATES' : 'CHINA'}</text><text x="335" y="206" className="art-small">{usa ? 'US / 02' : 'CN / 01'}</text><path d="M365 49v20m-6-14 6-6 6 6" fill="none" stroke="currentColor" /><text x="361" y="82" className="art-small">N</text></svg>;
}

/* ---- artwork for the 2026 batch of standalone toys ---- */

const ORBIT_DOTS = [
  [120, 96], [168, 82], [262, 90], [300, 124], [240, 148],
  [158, 140], [206, 72], [330, 110], [96, 126], [286, 158],
];

function GravityArtwork() {
  return (
    <svg viewBox="0 0 400 230" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeOpacity=".26">
        <ellipse cx="205" cy="112" rx="128" ry="46" />
        <ellipse cx="205" cy="112" rx="92" ry="33" />
        <ellipse cx="205" cy="112" rx="56" ry="20" />
      </g>
      <circle cx="205" cy="112" r="34" fill="#ff9a5a" fillOpacity=".1" />
      <circle cx="205" cy="112" r="11" fill="#ff9a5a" fillOpacity=".85" />
      {ORBIT_DOTS.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 2.6 : 1.8} fill="currentColor" fillOpacity={0.4 + (i % 4) * 0.14} />
      ))}
      <text x="24" y="206" className="art-region">GRAVITY WELL</text>
      <text x="332" y="206" className="art-small">01</text>
    </svg>
  );
}

const BEAT_ROWS = ['#ff6b9d', '#ffc663', '#5ad2f4', '#c8f560'];
const BEAT_ON = [[0, 4, 8], [2, 6], [0, 2, 4, 6, 8, 10], [6]];

function BeatArtwork() {
  return (
    <svg viewBox="0 0 400 230" aria-hidden="true">
      {BEAT_ROWS.map((color, row) =>
        Array.from({ length: 12 }, (_, col) => (
          <rect
            key={`${row}-${col}`}
            x={62 + col * 24}
            y={48 + row * 27}
            width="18"
            height="18"
            rx="3"
            fill={BEAT_ON[row].includes(col) ? color : 'currentColor'}
            fillOpacity={BEAT_ON[row].includes(col) ? 0.85 : 0.12}
          />
        )),
      )}
      <text x="24" y="206" className="art-region">BEAT FORGE</text>
      <text x="332" y="206" className="art-small">02</text>
    </svg>
  );
}

const MAZE_PATH =
  'M56 166 H104 V134 H152 V102 H104 V70 H152 V38 H216 V70 H264 V102 H216 V134 H264 V166 H332';

function MazeArtwork() {
  return (
    <svg viewBox="0 0 400 230" aria-hidden="true">
      <g stroke="currentColor" strokeOpacity=".1">
        {Array.from({ length: 7 }, (_, i) => (
          <line key={`h${i}`} x1="40" y1={38 + i * 32} x2="360" y2={38 + i * 32} />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`v${i}`} x1={40 + i * 40} y1="38" x2={40 + i * 40} y2="198" />
        ))}
      </g>
      <path d={MAZE_PATH} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" strokeOpacity=".75" />
      <circle cx="56" cy="166" r="4" fill="#c9503a" />
      <circle cx="332" cy="166" r="4" fill="#c9503a" />
      <text x="24" y="222" className="art-region">MAZE WEAVE</text>
      <text x="332" y="222" className="art-small">03</text>
    </svg>
  );
}

function ClockArtwork() {
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const major = i % 3 === 0;
    const inner = major ? 62 : 66;
    return (
      <line
        key={i}
        x1={200 + Math.cos(angle) * inner}
        y1={112 + Math.sin(angle) * inner}
        x2={200 + Math.cos(angle) * 72}
        y2={112 + Math.sin(angle) * 72}
        stroke="currentColor"
        strokeOpacity={major ? 0.55 : 0.22}
        strokeWidth={major ? 2 : 1.2}
      />
    );
  });
  return (
    <svg viewBox="0 0 400 230" aria-hidden="true">
      <circle cx="200" cy="112" r="80" fill="none" stroke="currentColor" strokeOpacity=".16" />
      {ticks}
      <line x1="200" y1="112" x2="200" y2="68" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="200" y1="112" x2="248" y2="130" stroke="#c9503a" strokeWidth="2" strokeLinecap="round" />
      <circle cx="200" cy="112" r="3.6" fill="currentColor" />
      <text x="24" y="206" className="art-region">TYPE CLOCK</text>
      <text x="332" y="206" className="art-small">04</text>
    </svg>
  );
}

function PosterArtwork() {
  return (
    <svg viewBox="0 0 400 230" aria-hidden="true">
      <rect x="126" y="22" width="148" height="164" fill="currentColor" fillOpacity=".05" stroke="currentColor" strokeOpacity=".16" />
      <rect x="232" y="32" width="22" height="22" fill="#e4572e" />
      <text x="142" y="92" fontSize="38" fontWeight="800" fill="currentColor" letterSpacing="-1">海报</text>
      <text x="142" y="130" fontSize="38" fontWeight="800" fill="currentColor" letterSpacing="-1">实验</text>
      <line x1="142" y1="146" x2="258" y2="146" stroke="currentColor" strokeOpacity=".45" strokeWidth="1.5" />
      <text x="142" y="164" fontSize="7" fill="currentColor" fillOpacity=".5" letterSpacing="2.4">POSTER LAB</text>
      <text x="24" y="206" className="art-region">POSTER LAB</text>
      <text x="332" y="206" className="art-small">05</text>
    </svg>
  );
}

const EXTRAS = {
  gravity: <GravityArtwork />,
  beat: <BeatArtwork />,
  maze: <MazeArtwork />,
  clock: <ClockArtwork />,
  poster: <PosterArtwork />,
};

export default function ProjectArtwork({ project, compact = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const type = project.artwork;
  return <div className={`project-artwork artwork-${type} ${compact ? 'artwork-compact' : ''}`} aria-hidden="true">
    {project.thumbnail && !imageFailed ? <img src={project.thumbnail} alt="" loading="lazy" onError={() => setImageFailed(true)} />
      : EXTRAS[type] ? EXTRAS[type]
      : type === 'china' || type === 'usa' ? <AtlasArtwork usa={type === 'usa'} />
      : type === 'neon' ? <><span className="art-corner-label">REACTION ARENA / 001</span><div className="neon-target"><i /><i /><i /><span>↗</span></div><strong className="neon-word">NEON<span>PULSE</span></strong><span className="art-bottom-label">HOW FAST CAN YOU GO? <span>↗</span></span></>
      : type === 'load' ? <><span className="art-corner-label">MAKE ROOM FOR MORE.</span><div className="container-illustration"><div className="container-front">{Array.from({length: 8}, (_, i) => <i key={i} />)}</div><div className="container-side" /><span>20′ / 40′</span></div><span className="art-bottom-label">LOAD PLANNER <span>↗</span></span></>
      : type === 'finance' ? <><span className="art-corner-label">A CLEARER PICTURE.</span><div className="mini-chart"><span>PET SPREAD <small>MARKET OVERVIEW</small></span><svg viewBox="0 0 240 90"><path d="M0 80H240M0 50H240M0 20H240" stroke="#e7e9e4" strokeDasharray="3 4" /><path d="M0 74 20 65 40 69 60 42 80 49 100 37 120 42 140 23 160 30 180 16 200 25 220 9 240 14" fill="none" stroke="#4d8e78" strokeWidth="3" /><path d="m0 62 20-5 20 8 20-10 20 6 20-13 20 9 20-6 20-7 20 6 20-6 20 2 20-7" fill="none" stroke="#d2aa75" strokeWidth="2" /></svg><div><i /> PET <i /> PX <i /> MEG</div></div></>
      : type === 'portfolio' ? <><span className="art-corner-label">A WORK IN PROGRESS, ALWAYS.</span><span className="portfolio-monogram">M<span>↗</span></span><span className="art-bottom-label">MING CHEN <span>RESEARCH & BUILD</span></span></>
      : type === 'resume' ? <><span className="art-corner-label">NICE TO MEET YOU.</span><div className="resume-paper"><span>俞可宁 <i>PROFILE / CV</i></span><b /><b /><em /><b /><b /><em /><b /><b /></div><span className="art-bottom-label">THE NEXT CHAPTER <span>↗</span></span></>
      : type === 'sbti' ? <><span className="art-corner-label">NOT YOUR USUAL PERSONALITY TEST.</span><div className="quiz-cards"><span>WHO<br />AM I<span>?</span></span><span>SBTI<small>100% 赛博成分</small><b>✳</b></span></div><span className="art-bottom-label">STAY WEIRD. <span>↗</span></span></>
      : type === 'motion' ? <><span className="motion-fallback">MOTION<br /><i>IN EVERY FRAME.</i></span><span className="art-bottom-label">CREATIVE CODING <span>30s</span></span></>
      : <><span className="art-corner-label">A LITTLE EXPERIMENT</span><span className="default-symbol">✳</span><span className="art-bottom-label">IDEA → REALITY <span>↗</span></span></>}
  </div>;
}
