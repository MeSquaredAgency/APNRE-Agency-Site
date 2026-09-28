import Icon from '../components/Icon';
import { formatDate, type PostMeta } from './types';

interface PostCardProps {
  post: PostMeta;
  /** h2 on the blog index; h3 in a post's "More from the blog". */
  headingLevel: 'h2' | 'h3';
}

export default function PostCard({ post, headingLevel: Heading }: PostCardProps) {
  const href = `/blog/${post.slug}/`;
  return (
    <article className="post-card">
      {post.image && (
        <a href={href} className="post-card__media" tabIndex={-1} aria-hidden="true">
          <img src={post.image} alt="" loading="lazy" />
        </a>
      )}
      <div className="post-card__body">
        <p className="post-card__meta">
          <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.readingMinutes} min read
          {post.draft && <span className="post-card__draft">Draft</span>}
        </p>
        <Heading className="h-3 post-card__title">
          <a href={href}>{post.title}</a>
        </Heading>
        <p className="post-card__desc">{post.description}</p>
        <span className="post-card__more" aria-hidden="true">
          Read more <Icon name="arrow" size={16} />
        </span>
      </div>
    </article>
  );
}
