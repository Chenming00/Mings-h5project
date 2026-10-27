import { Sparkles } from 'lucide-react';

// Two-digit counters shared by the overview strip. While the project manifest is
// still loading we show an em dash instead of a real-looking zero, so "00" is
// never mistaken for a genuinely empty collection.
function Counter({ value, loading }) {
  return <strong>{loading ? '—' : String(value).padStart(2, '0')}</strong>;
}

export default function SpaceOverview({ projectCount, categoryCount, loading }) {
  return (
    <div className="space-overview">
      <span>
        <span className="overview-icon">
          <Sparkles size={16} />
        </span>{' '}
        一个存放灵感的地方
      </span>
      <div>
        <span>
          <Counter value={projectCount} loading={loading} /> 个创意项目
        </span>
        <i />
        <span>
          <Counter value={categoryCount} loading={loading} /> 个探索方向
        </span>
        <i />
        <span className="overview-last">
          <span className="status-dot" /> 自由探索，无限可能
        </span>
      </div>
    </div>
  );
}
