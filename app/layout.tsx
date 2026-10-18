import type { Metadata, Viewport } from 'next';
import './globals.css';
import './rosie.css';
import './experience.css';
export const metadata: Metadata = {
  title: 'Between · Rosie，与你一起',
  description: '和 Rosie 聊日常，一起走进美国旅行英语冒险。非官方 AI 角色演绎，合成配音，与本人及所属团队无关联。',
  icons: { icon: '/icon.svg' }
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#f5f5f3' };
export default function Layout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
