import { Link } from 'preact-router/match';

export default function NavBar() {
  return (
    <nav style={{ marginBottom: "20px" }}>
      <Link activeClassName="active" href="/">🏠 Home</Link> |{" "}
      <Link activeClassName="active" href="/login">🔑 Login</Link>
    </nav>
  );
}
