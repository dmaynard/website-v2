import { getSortedPostsData } from '@/lib/posts';
import Link from 'next/link';

export const metadata = {
  title: 'Blog | David Maynard',
  description: 'Articles, thoughts, and explorations by David S. Maynard.',
};

export default function BlogIndex() {
  const allPostsData = getSortedPostsData();

  return (
    <section>
      <h1 style={{ fontSize: '3rem', marginBottom: '2rem', textAlign: 'center' }}>Blog & Explorations</h1>
      <div className="posts-grid">
        {allPostsData.map(({ slug, date, title, teaser, thumbnail }) => (
          <Link href={`/blog/${slug}`} key={slug} className="glass-panel post-card">
            {thumbnail && (
              <img src={thumbnail} alt={title} className="post-card-image" />
            )}
            <div className="post-card-date">
              {new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <h3>{title}</h3>
            <p>{teaser}</p>
            <span className="read-more">Read Article</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
