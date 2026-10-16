import type { Metadata, Viewport } from 'next';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import './globals.css';
export const metadata: Metadata = {
  title: 'Between 之间 · 让每一次开口，都更靠近',
  description: '每天两个生活章节，用英语认识一个人，也慢慢认识更自信的自己。语音英语陪伴体验。',
  icons: { icon: '/icon.svg' }
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f8f7f3' };
export default function Layout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
