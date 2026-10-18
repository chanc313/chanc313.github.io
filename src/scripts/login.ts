// 读取后台（Sveltia CMS）保存在浏览器里的 GitHub 令牌。
// 后台与博客同源，登录后把登录信息存在 localStorage 的 "sveltia-cms.user"。
// 写作页用它调用 GitHub 接口发布文章；「+」等入口只用它判断是否显示。
// 每次使用时重新读取：令牌过期后在后台重新登录，这里无需刷新就能拿到新令牌。
export function getToken(): string | null {
  try {
    const user = JSON.parse(localStorage.getItem('sveltia-cms.user') ?? 'null');
    return typeof user?.token === 'string' && user.token ? user.token : null;
  } catch {
    return null;
  }
}
