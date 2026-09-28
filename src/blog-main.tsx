import React from 'react';
import ReactDOM from 'react-dom/client';
import BlogIndexPage from './blog/BlogIndexPage';
import BlogPostPage from './blog/BlogPostPage';
import { BLOG_DATA_ID, POST_BODY_ID, type BlogPageData } from './blog/types';
import { PathContext } from './lib/route';
import './index.css';

// Browser entry for every /blog/ page. They arrive fully rendered
// (src/blog-server.tsx, at build time, or the dev server's blog
// middleware); this hydrates that markup so the menu and forms work. The
// page's data comes from the JSON block the renderer embeds, and a
// post's body is read back from the page rather than downloaded twice.
const root = document.getElementById('root')!;
const data = JSON.parse(document.getElementById(BLOG_DATA_ID)!.textContent!) as BlogPageData;

const page =
  data.kind === 'index' ? (
    <BlogIndexPage posts={data.posts} />
  ) : (
    <BlogPostPage
      post={data.post}
      related={data.related}
      bodyHtml={document.getElementById(POST_BODY_ID)?.innerHTML ?? ''}
    />
  );

ReactDOM.hydrateRoot(
  root,
  <React.StrictMode>
    <PathContext.Provider value={window.location.pathname}>{page}</PathContext.Provider>
  </React.StrictMode>,
);
