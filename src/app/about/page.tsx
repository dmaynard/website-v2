import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
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

  const processedHtml = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeKatex)
    .use(rehypeStringify, { allowDangerousHtml: true })
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
