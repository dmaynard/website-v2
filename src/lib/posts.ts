import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';

const postsDirectory = path.join(process.cwd(), 'src/content/posts');

export interface PostData {
  slug: string;
  title: string;
  date: string;
  teaser: string;
  contentHtml: string;
  thumbnail?: string;
  categories?: string[];
  tags?: string[];
}

export function getSortedPostsData(): Omit<PostData, 'contentHtml'>[] {
  const fileNames = fs.readdirSync(postsDirectory).filter(file => file.endsWith('.md') && file !== 'TEMPLATE.md');
  const allPostsData = fileNames.map((fileName) => {
    // Remove ".md" from file name to get slug
    const id = fileName.replace(/\.md$/, '');

    // Read markdown file as string
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');

    // Use gray-matter to parse the post metadata section
    const matterResult = matter(fileContents);

    let slug = matterResult.data.slug || id;

    // Combine the data with the slug
    return {
      slug,
      ...(matterResult.data as { date: string; title: string; teaser: string; thumbnail: string; categories: string[]; tags: string[] }),
      // Handle the fact that some thumbnails use '../thumbnails/' relative path, convert to absolute public path
      thumbnail: matterResult.data.thumbnail ? matterResult.data.thumbnail.replace(/^\.\.\/thumbnails\//, '/thumbnails/') : undefined,
    };
  });

  // Sort posts by date
  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
  });
}

export async function getPostData(slug: string): Promise<PostData> {
  // Find the file that matches the slug
  const fileNames = fs.readdirSync(postsDirectory).filter(file => file.endsWith('.md') && file !== 'TEMPLATE.md');
  let targetFileName = fileNames.find(file => {
    const fullPath = path.join(postsDirectory, file);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const matterResult = matter(fileContents);
    const fileSlug = matterResult.data.slug || file.replace(/\.md$/, '');
    return fileSlug === slug;
  });

  if (!targetFileName) {
    throw new Error(`No post found for slug: ${slug}`);
  }

  const fullPath = path.join(postsDirectory, targetFileName);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents);

  // Replace image paths in the markdown content
  // Convert relative paths like `../images/` to absolute `/images/`
  let processedContent = matterResult.content.replace(/\]\(\.\.\/images\//g, '](/images/');

  // Use unified with remark and rehype plugins to convert markdown and LaTeX math into HTML string
  const processedHtml = await unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeKatex)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(processedContent);
  const contentHtml = processedHtml.toString();

  // Combine the data with the slug and contentHtml
  return {
    slug,
    contentHtml,
    ...(matterResult.data as { date: string; title: string; teaser: string; thumbnail: string; categories: string[]; tags: string[] }),
    thumbnail: matterResult.data.thumbnail ? matterResult.data.thumbnail.replace(/^\.\.\/thumbnails\//, '/thumbnails/') : undefined,
  };
}

export function getAllPostSlugs() {
  const fileNames = fs.readdirSync(postsDirectory).filter(file => file.endsWith('.md') && file !== 'TEMPLATE.md');
  return fileNames.map((fileName) => {
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const matterResult = matter(fileContents);
    return {
      params: {
        slug: matterResult.data.slug || fileName.replace(/\.md$/, ''),
      },
    };
  });
}
