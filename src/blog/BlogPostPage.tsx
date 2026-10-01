import Layout from '../components/Layout';
import EnquiryForm from '../components/EnquiryForm';
import Picture from '../components/Picture';
import { FormSection } from '../components/sections';
import { TEAM } from '../data/team';
import PostCard from './PostCard';
import { POST_BODY_ID, formatDate, type PostMeta } from './types';

interface BlogPostPageProps {
  post: PostMeta;
  /** The post body, already rendered from Markdown. */
  bodyHtml: string;
  related: PostMeta[];
}

export default function BlogPostPage({ post, bodyHtml, related }: BlogPostPageProps) {
  // Only credit a real team member; anything else falls back to APN.
  const author = TEAM.find((m) => m.name === post.author);

  return (
    <Layout>
      <article className="post">
        <header className="post__head">
          <div className="wrap post__inner">
            <nav className="post__crumbs" aria-label="Breadcrumb">
              <a href="/">Home</a>
              <span aria-hidden="true">/</span>
              <a href="/blog/">Blog</a>
            </nav>

            {post.draft && (
              <p className="post__draft" role="note">
                Draft: only visible on the dev server. Remove <code>draft: true</code> to publish.
              </p>
            )}

            <h1 className="h-display post__title">{post.title}</h1>
            <p className="lede post__lede">{post.description}</p>

            <p className="post__meta">
              <span>{author ? author.name : 'APN Real Estate'}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              {post.updated && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    Updated <time dateTime={post.updated}>{formatDate(post.updated)}</time>
                  </span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>{post.readingMinutes} min read</span>
            </p>
          </div>
        </header>

        <div className="section section-white">
          <div className="wrap post__inner">
            {post.image && <img className="post__hero" src={post.image} alt={post.imageAlt ?? ''} />}

            <div id={POST_BODY_ID} className="post-prose" dangerouslySetInnerHTML={{ __html: bodyHtml }} />

            {author && (
              <aside className="post__author" aria-label="About the author">
                <Picture
                  photo={author.photo}
                  alt=""
                  style={author.focalPoint ? { objectPosition: author.focalPoint } : undefined}
                  sizes="72px"
                />
                <div>
                  <p className="post__author-name">{author.name}</p>
                  <p className="post__author-role">{author.role}, APN Real Estate</p>
                </div>
              </aside>
            )}
          </div>
        </div>
      </article>

      {/* The posts so far are for landlords, so they end on the rental
          appraisal. Make this depend on the post if sales posts arrive. */}
      <FormSection
        id="appraisal"
        eyebrow="Free rental appraisal"
        title="What could your property rent for?"
        copy="Tell us about your property. A local APN property manager will review the details and contact you directly."
      >
        <EnquiryForm kind="rental-appraisal" submitLabel="Get My Free Rental Appraisal" />
      </FormSection>

      {related.length > 0 && (
        <section className="section section-white" aria-labelledby="post-more-heading">
          <div className="wrap">
            <h2 id="post-more-heading" className="h-1 post-more__heading">
              More from the blog
            </h2>
            <ul className="post-grid">
              {related.map((p) => (
                <li key={p.slug}>
                  <PostCard post={p} headingLevel="h3" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </Layout>
  );
}
