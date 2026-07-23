import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "后台登录", robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <main className="admin-login-page">
      <div className="login-panel">
        <p className="eyebrow">LINEFOLD / ADMIN</p>
        <h1>内容管理</h1>
        <p>登录后管理文章、站点介绍与图片外链。</p>
        <LoginForm />
        <Link href="/">← 返回博客</Link>
      </div>
    </main>
  );
}
