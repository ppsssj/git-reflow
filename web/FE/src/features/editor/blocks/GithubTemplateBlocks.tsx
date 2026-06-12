import { Icon } from '../../../components/ui/Icon';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import type { TemplateBlock, TemplateBlockType } from '../../../types/template';

interface TemplateBlockComponentProps {
  block: TemplateBlock;
  selected: boolean;
  onSelect: (blockId: string) => void;
  onOpenContextMenu?: (blockId: string, x: number, y: number) => void;
}

interface BlockFrameProps extends TemplateBlockComponentProps {
  children: ReactNode;
}

interface RepoSummary {
  name: string;
  description?: string;
  language?: string;
  stars?: string;
  reason?: string;
  visibility?: string;
}

interface ActivityEvent {
  actor: string;
  action: string;
  subject: string;
  time: string;
  summary?: string;
}

interface WorkQueueItem {
  label: string;
  count: number;
}

interface RepoUpdate {
  repo: string;
  message: string;
  status: string;
}

function getAppearanceStyle(block: TemplateBlock) {
  const appearance = block.props.appearance;

  if (!appearance || typeof appearance !== 'object' || Array.isArray(appearance)) {
    return undefined;
  }

  const styles = appearance as Record<string, unknown>;
  const marginY = Number(styles.marginY);
  const padding = Number(styles.padding);
  const elementGap = Number(styles.elementGap);
  const fontSize = Number(styles.fontSize);
  const borderRadius = Number(styles.borderRadius);
  const style: CSSProperties = {};
  const customStyle = style as Record<string, string>;

  if (typeof styles.backgroundColor === 'string' && styles.backgroundColor) {
    style.background = styles.backgroundColor;
    style.backgroundColor = styles.backgroundColor;
    customStyle['--github-block-background'] = styles.backgroundColor;
  }

  if (typeof styles.innerBackgroundColor === 'string' && styles.innerBackgroundColor) {
    customStyle['--github-block-inner-background'] = styles.innerBackgroundColor;
  }

  if (typeof styles.textColor === 'string' && styles.textColor) {
    style.color = styles.textColor;
    customStyle['--github-block-text-color'] = styles.textColor;
  }

  if (typeof styles.linkColor === 'string' && styles.linkColor) {
    customStyle['--github-block-link-color'] = styles.linkColor;
  }

  if (typeof styles.mutedTextColor === 'string' && styles.mutedTextColor) {
    customStyle['--github-block-muted-text-color'] = styles.mutedTextColor;
  }

  if (Number.isFinite(marginY)) {
    style.marginTop = `${marginY}px`;
    style.marginBottom = `${marginY}px`;
  }

  if (Number.isFinite(padding)) {
    style.padding = `${padding}px`;
    customStyle['--github-block-padding'] = `${padding}px`;
  }

  if (Number.isFinite(elementGap)) {
    customStyle['--github-block-gap'] = `${elementGap}px`;
  }

  if (typeof styles.fontFamily === 'string' && styles.fontFamily) {
    style.fontFamily = styles.fontFamily;
    customStyle['--github-block-font-family'] = styles.fontFamily;
  }

  if (Number.isFinite(fontSize)) {
    style.fontSize = `${fontSize}px`;
    customStyle['--github-block-font-size'] = `${fontSize}px`;
  }

  if (Number.isFinite(borderRadius)) {
    style.borderRadius = `${borderRadius}px`;
    customStyle['--github-block-radius'] = `${borderRadius}px`;
  }

  return style;
}

function hasAppearance(block: TemplateBlock) {
  const appearance = block.props.appearance;

  return !!appearance && typeof appearance === 'object' && !Array.isArray(appearance);
}

function getTextAppearanceStyle(block: TemplateBlock) {
  const appearance = block.props.appearance;

  if (!appearance || typeof appearance !== 'object' || Array.isArray(appearance)) {
    return undefined;
  }

  const styles = appearance as Record<string, unknown>;
  const fontSize = Number(styles.fontSize);
  const style: CSSProperties = {};

  if (typeof styles.fontFamily === 'string' && styles.fontFamily) {
    style.fontFamily = styles.fontFamily;
  }

  if (typeof styles.textColor === 'string' && styles.textColor) {
    style.color = styles.textColor;
  }

  if (Number.isFinite(fontSize)) {
    style.fontSize = `${fontSize}px`;
  }

  return style;
}

function handleContextMenu(
  block: TemplateBlock,
  onOpenContextMenu: TemplateBlockComponentProps['onOpenContextMenu'],
  event: MouseEvent<HTMLElement>,
) {
  if (!onOpenContextMenu) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  onOpenContextMenu(block.id, event.clientX, event.clientY);
}

function BlockFrame({ block, selected, children, onSelect, onOpenContextMenu }: BlockFrameProps) {
  return (
    <section
      className={[
        'github-block',
        `github-block--${block.type}`,
        hasAppearance(block) ? 'has-appearance' : '',
        selected ? 'is-selected' : '',
      ].join(' ').trim()}
      data-block-id={block.id}
      data-block-type={block.type}
      style={getAppearanceStyle(block)}
      onClick={() => onSelect(block.id)}
      onContextMenu={(event) => handleContextMenu(block, onOpenContextMenu, event)}
    >
      <div className="github-block__style-scope" style={getTextAppearanceStyle(block)}>
      {children}
      </div>
    </section>
  );
}

function BlockHeader({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="github-block__header">
      <h2>{title}</h2>
      <Icon name={icon} />
    </div>
  );
}

function LanguageDot({ language = 'TypeScript' }: { language?: string }) {
  return <span className={`language-dot language-dot--${language.toLowerCase().replace(/\s+/g, '-')}`} />;
}

function GithubHomeMark() {
  return (
    <span className="github-home-mark" aria-hidden="true">
      <span>GH</span>
    </span>
  );
}

function RepoName({ name }: { name: string }) {
  const [owner, repo] = name.split('/');

  if (!repo) {
    return <span>{name}</span>;
  }

  return (
    <span>
      {owner}
      <span className="repo-name__slash">/</span>
      {repo}
    </span>
  );
}

function getItemLimit(value: unknown, fallback: number) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? Math.min(12, Math.max(1, Math.round(parsed))) : fallback;
}

function TopNavBlock({ block, selected, onSelect, onOpenContextMenu }: TemplateBlockComponentProps) {
  const props = block.props as { context?: string; searchPlaceholder?: string; links?: string[]; actions?: string[] };
  const links = props.links ?? [];
  const actions = props.actions ?? [];

  return (
    <header
      className={[
        'github-home-topnav',
        'github-block',
        hasAppearance(block) ? 'has-appearance' : '',
        selected ? 'is-selected' : '',
      ].join(' ').trim()}
      data-block-id={block.id}
      data-block-type={block.type}
      style={getAppearanceStyle(block)}
      onClick={() => onSelect(block.id)}
      onContextMenu={(event) => handleContextMenu(block, onOpenContextMenu, event)}
    >
      <div className="github-block__style-scope" style={getTextAppearanceStyle(block)}>
      <div className="github-home-topnav__brand">
        <button aria-label="Open navigation" type="button">
          <Icon name="menu" />
        </button>
        <div className="github-home-topnav__mark">
          <GithubHomeMark />
        </div>
      </div>
      <div className="github-home-topnav__context">
        <strong>{props.context ?? 'Dashboard'}</strong>
      </div>
      <label className="github-home-topnav__search">
        <Icon name="search" />
        <input aria-label="Template search" readOnly value={props.searchPlaceholder ?? 'Search'} />
      </label>
      <nav aria-label="Template GitHub-style navigation">
        {links.map((link) => (
          <a href={`#${link.toLowerCase().replace(/\s+/g, '-')}`} key={link}>
            {link}
          </a>
        ))}
      </nav>
      <div className="github-home-topnav__actions">
        {actions.slice(0, 5).map((action) => (
          <button aria-label={action} key={action} type="button">
            <Icon
              name={
                action === 'Copilot'
                  ? 'smart_toy'
                  : action === 'Create'
                    ? 'add'
                    : action === 'Issues'
                      ? 'radio_button_unchecked'
                      : action === 'Pull requests'
                        ? 'merge_type'
                        : action === 'Repositories'
                          ? 'folder'
                          : 'inbox'
              }
            />
            {action === 'Copilot' || action === 'Create' ? <Icon name="keyboard_arrow_down" /> : null}
          </button>
        ))}
        <span aria-hidden="true" />
      </div>
      </div>
    </header>
  );
}

function ProfileSummaryBlock({ block, selected, onSelect, onOpenContextMenu }: TemplateBlockComponentProps) {
  const props = block.props as {
    name?: string;
    handle?: string;
    bio?: string;
    stats?: Array<{ label: string; value: string }>;
  };

  return (
    <BlockFrame block={block} selected={selected} onSelect={onSelect} onOpenContextMenu={onOpenContextMenu}>
      <div className="profile-summary">
        <div className="profile-summary__avatar">{props.name?.slice(0, 1) ?? 'R'}</div>
        <div>
          <h1>{props.name}</h1>
          <p>{props.handle}</p>
        </div>
        <button aria-label="Switch dashboard context" type="button">
          <Icon name="keyboard_arrow_down" />
        </button>
      </div>
      {props.bio ? <p className="profile-summary__bio">{props.bio}</p> : null}
      {(props.stats ?? []).length > 0 ? (
        <div className="profile-summary__stats">
          {(props.stats ?? []).map((stat) => (
            <span key={stat.label}>
              <strong>{stat.value}</strong>
              {stat.label}
            </span>
          ))}
        </div>
      ) : null}
    </BlockFrame>
  );
}

function CopilotPromptBlock({ block, selected, onSelect, onOpenContextMenu }: TemplateBlockComponentProps) {
  const props = block.props as { placeholder?: string; model?: string; chips?: string[] };

  return (
    <BlockFrame block={block} selected={selected} onSelect={onSelect} onOpenContextMenu={onOpenContextMenu}>
      <div className="home-feed-heading">
        <h2>Home</h2>
      </div>
      <div className="copilot-prompt">
        <div className="copilot-prompt__field">
          <span>{props.placeholder}</span>
        </div>
        <div className="copilot-prompt__toolbar">
          <button type="button">
            <Icon name="chat_bubble" />
            Ask
            <Icon name="keyboard_arrow_down" />
          </button>
          <button type="button">
            <Icon name="folder" />
            All repositories
          </button>
          <span>{props.model}</span>
          <button aria-label="Send" type="button">
            <Icon name="send" />
          </button>
        </div>
        <div className="copilot-prompt__chips">
          {(props.chips ?? []).map((chip) => (
            <button key={chip} type="button">
              {chip}
            </button>
          ))}
        </div>
      </div>
    </BlockFrame>
  );
}

function PinnedReposBlock({ block, selected, onSelect, onOpenContextMenu }: TemplateBlockComponentProps) {
  const props = block.props as { repositories?: RepoSummary[] };
  const repositories = props.repositories ?? [];
  const itemLimit = getItemLimit(block.props.itemLimit, repositories.length);

  return (
    <BlockFrame block={block} selected={selected} onSelect={onSelect} onOpenContextMenu={onOpenContextMenu}>
      <BlockHeader icon="push_pin" title="Pinned" />
      <div className="pinned-repo-grid">
        {repositories.slice(0, itemLimit).map((repo) => (
          <article className="repo-card" key={repo.name}>
            <div className="repo-card__title">
              <Icon name="folder" />
              <strong>{repo.name}</strong>
            </div>
            <p>{repo.description}</p>
            <div className="repo-card__meta">
              <LanguageDot language={repo.language} />
              <span>{repo.language}</span>
              <Icon name="star" />
              <span>{repo.stars}</span>
            </div>
          </article>
        ))}
      </div>
    </BlockFrame>
  );
}

function RecentReposBlock({ block, selected, onSelect, onOpenContextMenu }: TemplateBlockComponentProps) {
  const props = block.props as { searchPlaceholder?: string; repositories?: RepoSummary[] };
  const repositories = props.repositories ?? [];
  const itemLimit = getItemLimit(block.props.itemLimit, repositories.length);

  return (
    <BlockFrame block={block} selected={selected} onSelect={onSelect} onOpenContextMenu={onOpenContextMenu}>
      <div className="top-repositories-heading">
        <BlockHeader icon="folder" title={block.title} />
        <button type="button">
          <Icon name="add" />
          New
        </button>
      </div>
      <label className="top-repositories-search">
        <Icon name="search" />
        <input readOnly value={props.searchPlaceholder ?? 'Find a repository...'} />
      </label>
      <div className="compact-list">
        {repositories.slice(0, itemLimit).map((repo) => (
          <a href={`#${repo.name}`} key={repo.name}>
            <span className="compact-list__avatar">{repo.name.slice(0, 1).toUpperCase()}</span>
            <RepoName name={repo.name} />
            <em>{repo.visibility}</em>
          </a>
        ))}
      </div>
      <button className="compact-list__more" type="button">
        Show more
      </button>
    </BlockFrame>
  );
}

function ActivityFeedBlock({ block, selected, onSelect, onOpenContextMenu }: TemplateBlockComponentProps) {
  const props = block.props as { filters?: string[]; events?: ActivityEvent[] };
  const events = props.events ?? [];
  const itemLimit = getItemLimit(block.props.itemLimit, events.length);

  return (
    <BlockFrame block={block} selected={selected} onSelect={onSelect} onOpenContextMenu={onOpenContextMenu}>
      <div className="home-feed-heading">
        <h2>Feed</h2>
        <div>
          {(props.filters ?? []).map((filter, index) => (
            <button className={index === 0 ? 'is-active' : ''} key={filter} type="button">
              <Icon name={filter === 'Filter' ? 'filter_alt' : 'tune'} />
              {filter}
            </button>
          ))}
          <button aria-label="Open explore sidebar" type="button">
            <Icon name="dock_to_right" />
          </button>
        </div>
      </div>
      <div className="activity-feed-list">
        {events.slice(0, itemLimit).map((event) => (
          <article key={`${event.actor}-${event.subject}-${event.time}`}>
            <span className="activity-feed-list__avatar">{event.actor.slice(0, 1).toUpperCase()}</span>
            <div className="activity-feed-list__content">
              <div className="activity-feed-list__heading">
                <p>
                  <strong>{event.actor}</strong> {event.action} <a href={`#${event.subject}`}>{event.subject}</a>
                </p>
                <time>{event.time} ago</time>
              </div>
              {event.summary ? <div className="activity-feed-list__summary">{event.summary}</div> : null}
              <div className="activity-feed-list__footer">
                <button type="button">
                  <Icon name="star" />
                  Star
                </button>
                <button type="button">
                  <Icon name="fork_right" />
                  Fork
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </BlockFrame>
  );
}

function RepoUpdatesBlock({ block, selected, onSelect, onOpenContextMenu }: TemplateBlockComponentProps) {
  const props = block.props as { updates?: RepoUpdate[] };
  const updates = props.updates ?? [];
  const itemLimit = getItemLimit(block.props.itemLimit, updates.length);

  return (
    <BlockFrame block={block} selected={selected} onSelect={onSelect} onOpenContextMenu={onOpenContextMenu}>
      <BlockHeader icon="campaign" title="Repository updates" />
      <div className="repo-update-list">
        {updates.slice(0, itemLimit).map((update) => (
          <article key={`${update.repo}-${update.status}`}>
            <Icon name={update.status === 'Release' ? 'sell' : 'merge_type'} />
            <div>
              <span>{update.status}</span>
              <strong>{update.repo}</strong>
              <p>{update.message}</p>
            </div>
          </article>
        ))}
      </div>
    </BlockFrame>
  );
}

function IssuePrUpdatesBlock({ block, selected, onSelect, onOpenContextMenu }: TemplateBlockComponentProps) {
  const props = block.props as { items?: WorkQueueItem[] };
  const items = props.items ?? [];
  const itemLimit = getItemLimit(block.props.itemLimit, items.length);

  return (
    <BlockFrame block={block} selected={selected} onSelect={onSelect} onOpenContextMenu={onOpenContextMenu}>
      <BlockHeader icon="merge_type" title="Issues and PRs" />
      <div className="work-queue">
        {items.slice(0, itemLimit).map((item) => (
          <button key={item.label} type="button">
            <Icon name={item.label.includes('issues') ? 'radio_button_unchecked' : 'merge_type'} />
            <span>{item.label}</span>
            <strong>{item.count}</strong>
          </button>
        ))}
      </div>
    </BlockFrame>
  );
}

function TrendingReposBlock({ block, selected, onSelect, onOpenContextMenu }: TemplateBlockComponentProps) {
  const props = block.props as { repositories?: RepoSummary[] };
  const repositories = props.repositories ?? [];
  const itemLimit = getItemLimit(block.props.itemLimit, repositories.length);

  return (
    <BlockFrame block={block} selected={selected} onSelect={onSelect} onOpenContextMenu={onOpenContextMenu}>
      <BlockHeader icon="history" title={block.title} />
      <div className="changelog-list">
        {repositories.slice(0, itemLimit).map((repo) => (
          <article key={repo.name}>
            <span />
            <time>{repo.stars}</time>
            <strong>{repo.name}</strong>
          </article>
        ))}
      </div>
      <a className="changelog-list__more" href="#changelog">
        View changelog
      </a>
    </BlockFrame>
  );
}

function RecommendedReposBlock({ block, selected, onSelect, onOpenContextMenu }: TemplateBlockComponentProps) {
  const props = block.props as { repositories?: RepoSummary[] };
  const repositories = props.repositories ?? [];
  const itemLimit = getItemLimit(block.props.itemLimit, repositories.length);

  return (
    <BlockFrame block={block} selected={selected} onSelect={onSelect} onOpenContextMenu={onOpenContextMenu}>
      <BlockHeader icon="explore" title="Recommended" />
      <div className="recommendation-list">
        {repositories.slice(0, itemLimit).map((repo) => (
          <article key={repo.name}>
            <Icon name="folder" />
            <strong>{repo.name}</strong>
            <p>{repo.reason}</p>
          </article>
        ))}
      </div>
    </BlockFrame>
  );
}

export const githubBlockRegistry: Record<TemplateBlockType, (props: TemplateBlockComponentProps) => JSX.Element> = {
  'top-nav': TopNavBlock,
  'profile-summary': ProfileSummaryBlock,
  'copilot-prompt': CopilotPromptBlock,
  'pinned-repos': PinnedReposBlock,
  'recent-repos': RecentReposBlock,
  'activity-feed': ActivityFeedBlock,
  'repo-updates': RepoUpdatesBlock,
  'issue-pr-updates': IssuePrUpdatesBlock,
  'trending-repos': TrendingReposBlock,
  'recommended-repos': RecommendedReposBlock,
};
