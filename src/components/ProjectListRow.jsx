import { ArrowUpRight } from 'lucide-react';
import ProjectArtwork from './ProjectArtwork';
import { tagLabels } from '../data/projectPresentation';

export default function ProjectListRow({ project, index = 0, onClick, onOpenNew, onTagClick }) {
  const open = () => onClick(project);

  return (
    <article
      className="project-list-row animate-card-enter"
      style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
    >
      <span className="list-number">{String(index + 1).padStart(2, '0')}</span>
      <button className="list-cover" onClick={open} aria-label={`预览项目：${project.displayTitle}`}>
        <ProjectArtwork project={project} compact />
      </button>
      {/* Same reasoning as ProjectCard: one tab stop opens the project. */}
      <div className="list-copy">
        <h3>
          <button onClick={open} tabIndex={-1}>
            {project.displayTitle}
          </button>
        </h3>
        <p>{project.description}</p>
      </div>
      <div className="project-tags">
        {project.tags
          .filter((tag) => tag !== 'project')
          .slice(0, 2)
          .map((tag) => (
            <button key={tag} onClick={() => onTagClick(tag)}>
              {tagLabels[tag] || tag}
            </button>
          ))}
      </div>
      <button
        className="icon-button"
        onClick={() => onOpenNew(project)}
        aria-label={`在新标签页打开 ${project.displayTitle}`}
        title="在新标签页打开"
      >
        <ArrowUpRight size={19} />
      </button>
    </article>
  );
}
