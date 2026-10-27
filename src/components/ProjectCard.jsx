import { ArrowUpRight, ExternalLink } from 'lucide-react';
import ProjectArtwork from './ProjectArtwork';
import { tagLabels } from '../data/projectPresentation';

export default function ProjectCard({ project, index = 0, onClick, onOpenNew, onTagClick }) {
  const tags = project.tags.filter((tag) => tag !== 'project').slice(0, 2);
  const open = () => onClick(project);

  return (
    <article
      className="project-card animate-card-enter"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="card-cover">
        <button className="cover-button" onClick={open} aria-label={`预览项目：${project.displayTitle}`}>
          <ProjectArtwork project={project} />
          <span className="cover-hover">
            <span>
              进入作品 <ArrowUpRight size={16} />
            </span>
          </span>
        </button>
        <span className="card-number">{String(index + 1).padStart(2, '0')}</span>
        <button
          className="card-external"
          onClick={() => onOpenNew(project)}
          title="在新标签页打开"
          aria-label={`在新标签页打开 ${project.displayTitle}`}
        >
          <ExternalLink size={15} />
        </button>
      </div>

      <div className="card-content">
        <p className="card-eyebrow">{project.label}</p>
        <h3>
          {/* The cover button already opens this project, so the title and the
              arrow below stay out of the tab order — three equivalent tab stops
              per card made keyboard browsing painfully slow. */}
          <button onClick={open} tabIndex={-1}>
            {project.displayTitle}
          </button>
        </h3>
        <p className="card-description">{project.description}</p>
        <div className="card-bottom">
          <div className="project-tags">
            {tags.map((tag) => (
              <button key={tag} onClick={() => onTagClick(tag)}>
                {tagLabels[tag] || tag}
              </button>
            ))}
          </div>
          <button className="card-arrow" onClick={open} tabIndex={-1} aria-hidden="true">
            <ArrowUpRight size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
