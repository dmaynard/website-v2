import { getPostData, getAllPostSlugs } from '@/lib/posts';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  const posts = getAllPostSlugs();
  return posts.map((post) => ({
    slug: post.params.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  try {
    const postData = await getPostData(resolvedParams.slug);
    return {
      title: `${postData.title} | David Maynard`,
      description: postData.teaser,
    };
  } catch (e) {
    return {
      title: 'Post Not Found',
    };
  }
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  let postData;
  try {
    postData = await getPostData(resolvedParams.slug);
  } catch (e) {
    notFound();
  }

  return (
    <article className="glass-panel" style={{ padding: '3rem' }}>
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>{postData.title}</h1>
        <div className="post-card-date" style={{ fontSize: '1.1rem' }}>
          {new Date(postData.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>

      </header>

      {postData.thumbnail && (
        <img 
          src={postData.thumbnail} 
          alt={postData.title} 
          style={{ width: '100%', maxHeight: '500px', objectFit: 'cover', borderRadius: '12px', marginBottom: '3rem' }} 
        />
      )}

      <div 
        className="markdown-body" 
        dangerouslySetInnerHTML={{ __html: postData.contentHtml }} 
      />
    </article>
  );
}
