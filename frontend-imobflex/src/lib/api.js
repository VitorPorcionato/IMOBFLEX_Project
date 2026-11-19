export async function api(path, options = {}) {
  const method = options.method || "GET";
  const headers = { ...options.headers };
  if (!["GET", "HEAD"].includes(method)) {
    const csrf = await fetch("/api/v1/auth/csrf", { cache: "no-store" });
    if (!csrf.ok)
      throw new Error(
        "Não foi possível iniciar o formulário. Tente novamente.",
      );
    const token = await csrf.json();
    headers[token.headerName] = token.token;
  }
  let body = options.body;
  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }
  const response = await fetch("/api/v1" + path, {
    ...options,
    method,
    headers,
    body,
    cache: "no-store",
  });
  if (!response.ok) {
    const problem = await response.json().catch(() => ({}));
    const error = new Error(
      problem.detail || "Não foi possível concluir. Tente novamente.",
    );
    error.status = response.status;
    error.fields = problem.errors;
    throw error;
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
export async function publicApi(path) {
  const response = await fetch(
    `${process.env.BACKEND_URL || "http://127.0.0.1:8080"}/api/v1/public${path}`,
    { cache: "no-store", signal: AbortSignal.timeout(5000) },
  );
  if (!response.ok) {
    const error = new Error("Serviço indisponível");
    error.status = response.status;
    throw error;
  }
  return response.json();
}
