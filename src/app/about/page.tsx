import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'About Me | David Maynard',
  description: 'About David S. Maynard',
};

export default async function About() {
  const pagesDirectory = path.join(process.cwd(), 'src/content/pages');
  const fullPath = path.join(pagesDirectory, 'me.md');
  
  if (!fs.existsSync(fullPath)) {
    notFound();
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const matterResult = matter(fileContents);

  // Replace relative image paths
  let processedContent = matterResult.content.replace(/\]\(\.\.\/images\//g, '](/images/');

  const processedHtml = await remark()
    .use(html, { sanitize: false })
    .process(processedContent);
  const contentHtml = processedHtml.toString();

  return (
    <article className="glass-panel" style={{ padding: '3rem' }}>
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>{matterResult.data.title}</h1>
      </header>
      <div 
        className="markdown-body" 
        dangerouslySetInnerHTML={{ __html: contentHtml }} 
      />
    </article>
  );
}
