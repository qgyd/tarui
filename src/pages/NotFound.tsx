import { Link } from "react-router";

function NotFound() {
  return (
    <section>
      <h1>404</h1>
      <p>页面不存在，请检查访问地址是否正确。</p>
      <Link to="/">返回首页</Link>
    </section>
  );
}

export default NotFound;
