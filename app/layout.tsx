import type { Metadata, Viewport } from 'next';
import './globals.css';
import './rosie.css';
import './experience.css';
import './white.css';
export const metadata: Metadata = {
  title: 'Between · Rosé',
  description: '和 Rosé 聊日常，一起走进美国旅行英语冒险。非官方 AI 角色演绎，合成配音，与本人及所属团队无关联。',
  icons: { icon: '/icon.svg' }
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#ffffff' };
export default function Layout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
