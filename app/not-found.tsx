import Link from "next/link";

export default function NotFound() {
  return <main className="standalone-message"><p>404</p><h1>这页记录暂时不存在。</h1><Link className="text-link" href="/">返回首页 →</Link></main>;
}
