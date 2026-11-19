"use client";
export default function ErrorPage({ reset }) {
  return (
    <div className="container section">
      <h1>Não foi possível carregar esta página</h1>
      <p>Tente novamente em alguns instantes.</p>
      <button className="btn" onClick={reset}>
        Tentar novamente
      </button>
    </div>
  );
}
