import { getSortedPostsData } from '@/lib/posts';
import Link from 'next/link';

export default function Home() {
  const allPostsData = getSortedPostsData();

  return (
    <>
      <section className="hero">
        <h1>David S. Maynard</h1>
        <p>Software Artist. Exploring the intersection of code, art, and software development since the 1969.</p>
      </section>

      <section>
        <h2>Latest Explorations</h2>
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
    </>
  );
}
