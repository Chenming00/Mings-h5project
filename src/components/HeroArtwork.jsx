export default function HeroArtwork() {
  return <div className="hero-artwork" aria-hidden="true">
    <svg className="orbital-art" viewBox="0 0 480 350" fill="none">
      <defs><radialGradient id="globe-shade" cx=".3" cy=".25" r=".85"><stop stopColor="#cbd3b4" /><stop offset=".65" stopColor="#a7b494" /><stop offset="1" stopColor="#6e8467" /></radialGradient><clipPath id="globe-clip"><circle cx="248" cy="180" r="91" /></clipPath><linearGradient id="orbit-shade"><stop stopColor="#f39b6b" /><stop offset="1" stopColor="#db6c41" /></linearGradient></defs>
      <path d="M53 263C20 190 95 57 219 41c118-16 223 42 211 152" stroke="#dad9cd" strokeDasharray="4 6" />
      <circle cx="248" cy="180" r="91" fill="url(#globe-shade)" />
      <g clipPath="url(#globe-clip)" stroke="#f3f3e6" strokeOpacity=".45"><ellipse cx="248" cy="180" rx="37" ry="91" transform="rotate(-24 248 180)" /><ellipse cx="248" cy="180" rx="68" ry="91" transform="rotate(-24 248 180)" /><ellipse cx="248" cy="180" rx="91" ry="30" transform="rotate(-24 248 180)" /><ellipse cx="248" cy="180" rx="91" ry="64" transform="rotate(-24 248 180)" /><path d="m207 92 82 177M165 217l166-74" /></g>
      <ellipse cx="248" cy="180" rx="159" ry="48" transform="rotate(-31 248 180)" stroke="url(#orbit-shade)" strokeWidth="14" />
      <path d="M176 127a91 91 0 0 1 145 0" stroke="#c3cdae" strokeWidth="4" />
      <circle cx="97" cy="238" r="10" fill="#d87750" /><circle cx="385" cy="89" r="5" fill="#7d937b" />
      <path d="M366 225v24m-12-12h24m-21-9 18 18m0-18-18 18" stroke="#d78052" strokeWidth="2" /><path d="M110 80v17m-8-8h16" stroke="#849579" strokeWidth="2" />
      <path d="M330 300c26 3 48-5 60-19m-8-1h9l-1 9" stroke="#c7c9bc" strokeWidth="1.5" />
    </svg>
    <div className="floating-code"><span className="code-window-dots"><i /><i /><i /></span><span><b>const</b> idea = <em>“what if?”</em>;</span><span><b>create</b>(idea)<span className="code-comment"> // ✨</span></span></div>
    <div className="floating-label"><span>✳</span> Made of little possibilities</div><div className="art-coordinate">IMAGINE. BUILD. REPEAT.</div>
  </div>;
}
