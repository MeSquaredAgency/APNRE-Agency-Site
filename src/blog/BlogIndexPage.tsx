import Layout from '../components/Layout';
import { CtaBand, PageHero } from '../components/sections';
import PostCard from './PostCard';
import type { PostMeta } from './types';

export default function BlogIndexPage({ posts }: { posts: PostMeta[] }) {
  return (
    <Layout>
      <PageHero
        eyebrow="Blog"
        title="Property advice."
        lede="Practical guides on renting, selling and managing property in Adelaide and Mount Gambier, from the APN team."
      />
      <section className="section section-white">
        <div className="wrap">
          {posts.length > 0 ? (
            <ul className="post-grid">
              {posts.map((post) => (
                <li key={post.slug}>
                  <PostCard post={post} headingLevel="h2" />
                </li>
              ))}
            </ul>
          ) : (
            <p className="lede">The first articles are on their way.</p>
          )}
        </div>
      </section>
      <CtaBand
        title="Got a question about your property?"
        copy="Ask a local APN agent, or book a free sales or rental appraisal."
      />
    </Layout>
  );
}
