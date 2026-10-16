import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Between · ROSÉ 平行心动',
  description: 'ROSÉ 非官方虚构同人语音故事。从相识到相恋，十二章日常、语音和场景插画。合成配音，与本人及所属团队无关联。',
  icons: { icon: '/icon.svg' }
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f5f5f3' };
export default function Layout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
