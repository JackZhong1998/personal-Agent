import type { Metadata, Viewport } from 'next';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import './globals.css';
import './rose.css';
export const metadata: Metadata = {
  title: 'Between · ROSÉ 平行心动',
  description: 'ROSÉ 非官方虚构同人语音故事。从相识到相恋，十二章日常、语音和场景插画。合成配音，与本人及所属团队无关联。',
  icons: { icon: '/icon.svg' }
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f8f7f3' };
export default function Layout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
