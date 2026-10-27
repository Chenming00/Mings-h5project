import { LayoutGrid, List } from 'lucide-react';

export default function CollectionToolbar({
  categories,
  selectedTag,
  setSelectedTag,
  projectCount,
  viewMode,
  setViewMode,
}) {
  return (
    <div className="collection-toolbar">
      <div className="category-tabs" aria-label="筛选项目分类">
        <button
          className={!selectedTag ? 'active' : ''}
          onClick={() => setSelectedTag(null)}
          aria-pressed={!selectedTag}
        >
          全部作品 <span>{projectCount}</span>
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            className={selectedTag === category.id ? 'active' : ''}
            onClick={() => setSelectedTag(category.id)}
            aria-pressed={selectedTag === category.id}
          >
            {category.label}
          </button>
        ))}
      </div>
      <div className="view-switch" role="group" aria-label="显示方式">
        <button
          title="卡片视图"
          aria-label="切换到卡片视图"
          aria-pressed={viewMode === 'grid'}
          onClick={() => setViewMode('grid')}
          className={viewMode === 'grid' ? 'active' : ''}
        >
          <LayoutGrid size={17} />
        </button>
        <button
          title="列表视图"
          aria-label="切换到列表视图"
          aria-pressed={viewMode === 'list'}
          onClick={() => setViewMode('list')}
          className={viewMode === 'list' ? 'active' : ''}
        >
          <List size={18} />
        </button>
      </div>
    </div>
  );
}
