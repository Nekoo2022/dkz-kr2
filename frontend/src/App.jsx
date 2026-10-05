import { useEffect, useMemo, useState } from "react";
import { createProduct, deleteProduct, getProducts, updateProduct } from "./api/productsApi";
import { clearTokens, getAccessToken } from "./api/apiClient";
import { getMe, loginUser, registerUser } from "./api/authApi";

function roleLabel(role) {
  if (role === "employee") return "Сотрудник";
  if (role === "user") return "Обычный пользователь";
  return role || "—";
}

function errorText(error) {
  const status = error?.response?.status;
  const message = error?.response?.data?.message || error?.message || "Неизвестная ошибка";
  return status ? `${status}: ${message}` : String(message);
}

export default function App() {
  const [mode, setMode] = useState("login");
  const [me, setMe] = useState(null);
  const [accessToken, setAccessToken] = useState(() => getAccessToken() || "");
  const [authError, setAuthError] = useState("");
  const [authInfo, setAuthInfo] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [registerRole, setRegisterRole] = useState("user");

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forbiddenDemo, setForbiddenDemo] = useState("");

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");

  const isEmployee = me?.role === "employee";
  const canSubmit = useMemo(() => title.trim() !== "" && price !== "", [title, price]);

  async function loadMe() {
    const token = getAccessToken();
    setAccessToken(token || "");
    if (!token) {
      setMe(null);
      setItems([]);
      return;
    }

    try {
      const data = await getMe();
      setMe(data);
      setAccessToken(getAccessToken() || "");
    } catch {
      clearTokens();
      setAccessToken("");
      setMe(null);
      setItems([]);
    }
  }

  async function loadProducts() {
    setError("");
    setLoading(true);
    try {
      const data = await getProducts();
      setItems(data);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  useEffect(() => {
    if (me) loadProducts();
  }, [me?.id]);

  async function onRegister(e) {
    e.preventDefault();
    setAuthError("");
    setAuthInfo("");
    setAuthLoading(true);
    try {
      const created = await registerUser({
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        password,
        role: registerRole,
      });
      setAuthInfo(`Аккаунт создан: ${created.email}, роль — ${roleLabel(created.role)}. Теперь войдите.`);
      setMode("login");
      setPassword("");
    } catch (e2) {
      setAuthError(errorText(e2));
    } finally {
      setAuthLoading(false);
    }
  }

  async function onLogin(e) {
    e.preventDefault();
    setAuthError("");
    setAuthInfo("");
    setAuthLoading(true);
    try {
      const tokens = await loginUser({ email: email.trim(), password });
      setAccessToken(tokens.accessToken || "");
      setForbiddenDemo("");
      await loadMe();
    } catch (e2) {
      setAuthError(errorText(e2));
    } finally {
      setAuthLoading(false);
    }
  }

  function onLogout() {
    clearTokens();
    setMe(null);
    setAccessToken("");
    setItems([]);
    setError("");
    setForbiddenDemo("");
    setMode("login");
  }

  async function onAdd(e) {
    e.preventDefault();
    if (!canSubmit || !isEmployee) return;
    setError("");
    try {
      await createProduct({ title: title.trim(), price: Number(price) });
      setTitle("");
      setPrice("");
      await loadProducts();
    } catch (e2) {
      setError(errorText(e2));
    }
  }

  async function onDelete(id) {
    setError("");
    try {
      await deleteProduct(id);
      await loadProducts();
    } catch (e2) {
      setError(errorText(e2));
    }
  }

  async function onPricePlus(id, currentPrice) {
    setError("");
    try {
      await updateProduct(id, { price: Number(currentPrice) + 10 });
      await loadProducts();
    } catch (e2) {
      setError(errorText(e2));
    }
  }

  async function onForbiddenCreate() {
    setForbiddenDemo("");
    setError("");
    try {
      await createProduct({ title: "Проверка прав", price: 1 });
      setForbiddenDemo("Сервер неожиданно разрешил создание.");
    } catch (e2) {
      setForbiddenDemo(errorText(e2));
    }
  }

  async function copyToken() {
    if (!accessToken) return;
    try {
      await navigator.clipboard.writeText(accessToken);
      setAuthInfo("Access-токен скопирован.");
    } catch {
      setAuthInfo("Не удалось скопировать токен. Выделите его вручную.");
    }
  }

  const s = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(180deg, #f7f8fb 0%, #ffffff 40%)",
      color: "#111827",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    },
    wrap: { maxWidth: 1040, margin: "0 auto", padding: "24px 16px 48px" },
    header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 18 },
    titleBlock: { display: "flex", flexDirection: "column", gap: 8 },
    h1: { margin: 0, fontSize: 22, lineHeight: 1.2, letterSpacing: "-0.02em" },
    subtitle: { margin: 0, color: "#6b7280", fontSize: 14, lineHeight: 1.4 },
    badgeRow: { display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" },
    badge: (tone = "neutral") => {
      const map = {
        neutral: { bg: "#eef2ff", fg: "#3730a3", bd: "#c7d2fe" },
        ok: { bg: "#ecfdf5", fg: "#065f46", bd: "#a7f3d0" },
        warn: { bg: "#fffbeb", fg: "#92400e", bd: "#fde68a" },
      };
      const t = map[tone] || map.neutral;
      return {
        padding: "6px 10px",
        borderRadius: 999,
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.bd}`,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
      };
    },
    code: {
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: 12,
      wordBreak: "break-all",
    },
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
    card: {
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: 14,
      boxShadow: "0 10px 25px rgba(17, 24, 39, 0.04)",
      padding: 16,
    },
    cardTitleRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 },
    h2: { margin: 0, fontSize: 16, letterSpacing: "-0.01em" },
    helper: { margin: "10px 0 0", color: "#6b7280", fontSize: 13, lineHeight: 1.45 },
    tabs: {
      display: "inline-flex",
      gap: 6,
      background: "#f3f4f6",
      border: "1px solid #e5e7eb",
      padding: 6,
      borderRadius: 12,
    },
    tabBtn: (active) => ({
      padding: "8px 12px",
      borderRadius: 10,
      border: "1px solid transparent",
      background: active ? "#ffffff" : "transparent",
      boxShadow: active ? "0 6px 14px rgba(17, 24, 39, 0.06)" : "none",
      color: "#111827",
      fontWeight: 800,
      fontSize: 13,
      cursor: active ? "default" : "pointer",
    }),
    form: { marginTop: 12, display: "grid", gap: 10 },
    field: { display: "grid", gap: 6 },
    label: { fontSize: 12, color: "#374151", fontWeight: 800 },
    input: {
      border: "1px solid #d1d5db",
      borderRadius: 10,
      padding: "10px 12px",
      fontSize: 14,
      outline: "none",
      background: "#fff",
    },
    row: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
    btn: (variant = "primary", disabled = false) => {
      const base = {
        borderRadius: 10,
        padding: "10px 12px",
        fontWeight: 800,
        fontSize: 13,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        border: "1px solid transparent",
      };
      const variants = {
        primary: { background: "#111827", color: "#fff" },
        secondary: { background: "#fff", color: "#111827", border: "1px solid #e5e7eb" },
        danger: { background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" },
        ghost: { background: "transparent", color: "#111827", border: "1px solid #e5e7eb" },
      };
      return { ...base, ...(variants[variant] || variants.primary) };
    },
    alert: (tone = "error") => {
      const map = {
        error: { bg: "#fef2f2", fg: "#991b1b", bd: "#fecaca" },
        info: { bg: "#eff6ff", fg: "#1d4ed8", bd: "#bfdbfe" },
        ok: { bg: "#ecfdf5", fg: "#065f46", bd: "#a7f3d0" },
      };
      const t = map[tone] || map.error;
      return {
        marginTop: 10,
        padding: "10px 12px",
        borderRadius: 12,
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.bd}`,
        fontSize: 13,
        lineHeight: 1.45,
      };
    },
    list: { marginTop: 12, padding: 0, listStyle: "none", display: "grid", gap: 10 },
    item: {
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      padding: 12,
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      background: "#fff",
    },
    itemLeft: { display: "grid", gap: 2, minWidth: 0 },
    itemTitle: { margin: 0, fontWeight: 800, fontSize: 14 },
    itemMeta: { margin: 0, color: "#6b7280", fontSize: 12 },
    itemActions: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" },
  };

  return (
    <div style={s.page}>
      <style>{`
        @media (max-width: 860px) {
          .layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={s.wrap}>
        <header style={s.header}>
          <div style={s.titleBlock}>
            <h1 style={s.h1}>Контрольное задание №2</h1>
            <p style={s.subtitle}>
              Регистрация, вход, JWT и две роли: обычный пользователь смотрит товары, сотрудник управляет ими.
            </p>
          </div>
          <div style={s.badgeRow}>
            <span style={s.badge(me ? "ok" : "warn")}>{me ? roleLabel(me.role) : "Не авторизован"}</span>
            <span style={s.badge("neutral")}>API: http://localhost:3000</span>
          </div>
        </header>

        <main className="layout" style={s.grid}>
          <section style={s.card}>
            <div style={s.cardTitleRow}>
              <h2 style={s.h2}>Аутентификация</h2>
              {!me && (
                <div style={s.tabs}>
                  <button type="button" style={s.tabBtn(mode === "login")} onClick={() => setMode("login")}>
                    Вход
                  </button>
                  <button type="button" style={s.tabBtn(mode === "register")} onClick={() => setMode("register")}>
                    Регистрация
                  </button>
                </div>
              )}
            </div>

            {me ? (
              <>
                <div style={s.alert("ok")}>
                  Вы вошли как <b>{me.email}</b>
                  <div style={{ marginTop: 6 }}>
                    {me.first_name} {me.last_name} · {roleLabel(me.role)}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    Данные получены защищённым запросом <span style={s.code}>GET /api/auth/me</span>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={s.label}>JWT access-токен</div>
                  <div style={{ ...s.alert("info"), marginTop: 6 }}>
                    <span style={s.code}>{accessToken || "токен не найден"}</span>
                  </div>
                </div>

                <div style={{ ...s.row, marginTop: 12 }}>
                  <button type="button" onClick={onLogout} style={s.btn("secondary")}>Выйти</button>
                  <button type="button" onClick={loadMe} style={s.btn("ghost")}>Обновить /me</button>
                  <button type="button" onClick={copyToken} style={s.btn("ghost")}>Копировать токен</button>
                </div>
              </>
            ) : mode === "register" ? (
              <form onSubmit={onRegister} style={s.form}>
                <div style={s.field}>
                  <div style={s.label}>Email</div>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ivan@mail.ru" style={s.input} />
                </div>
                <div style={s.row}>
                  <div style={{ ...s.field, flex: 1, minWidth: 140 }}>
                    <div style={s.label}>Имя</div>
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Иван" style={s.input} />
                  </div>
                  <div style={{ ...s.field, flex: 1, minWidth: 140 }}>
                    <div style={s.label}>Фамилия</div>
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Иванов" style={s.input} />
                  </div>
                </div>
                <div style={s.field}>
                  <div style={s.label}>Пароль</div>
                  <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="не короче 6 символов" style={s.input} />
                </div>
                <div style={s.field}>
                  <div style={s.label}>Роль</div>
                  <select value={registerRole} onChange={(e) => setRegisterRole(e.target.value)} style={s.input}>
                    <option value="user">Обычный пользователь — только просмотр</option>
                    <option value="employee">Сотрудник — просмотр и управление товарами</option>
                  </select>
                </div>
                <button disabled={authLoading} style={s.btn("primary", authLoading)}>
                  {authLoading ? "Создаём..." : "Создать аккаунт"}
                </button>
              </form>
            ) : (
              <form onSubmit={onLogin} style={s.form}>
                <div style={s.field}>
                  <div style={s.label}>Email</div>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@mail.ru" style={s.input} />
                </div>
                <div style={s.field}>
                  <div style={s.label}>Пароль</div>
                  <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="user12345" style={s.input} />
                </div>
                <button disabled={authLoading} style={s.btn("primary", authLoading)}>
                  {authLoading ? "Входим..." : "Войти"}
                </button>
                <p style={s.helper}>
                  Демо-аккаунты: <span style={s.code}>user@mail.ru</span> / <span style={s.code}>user12345</span> и{" "}
                  <span style={s.code}>employee@mail.ru</span> / <span style={s.code}>employee12345</span>
                </p>
              </form>
            )}

            {authInfo && <div style={s.alert("ok")}>{authInfo}</div>}
            {authError && <div style={s.alert("error")}>{authError}</div>}

            {!me && (
              <p style={s.helper}>
                Пароль на сервере хранится как bcrypt-хеш. После входа сервер выдаёт JWT, клиент подставляет его в заголовок{" "}
                <span style={s.code}>Authorization: Bearer ...</span>
              </p>
            )}
          </section>

          <section style={s.card}>
            <div style={s.cardTitleRow}>
              <h2 style={s.h2}>Товары</h2>
              {me && (
                <button type="button" onClick={loadProducts} style={s.btn("secondary")}>
                  Обновить список
                </button>
              )}
            </div>

            {!me ? (
              <div style={s.alert("info")}>
                Список товаров доступен после входа. Запрос <span style={s.code}>GET /api/products</span> без токена сервер отклоняет.
              </div>
            ) : (
              <>
                <p style={s.helper}>
                  Просмотр доступен обеим ролям. Создание, изменение и удаление — только сотруднику.
                </p>

                {isEmployee ? (
                  <form onSubmit={onAdd} style={{ ...s.row, marginTop: 10 }}>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Название товара"
                      style={{ ...s.input, flex: 1, minWidth: 180 }}
                    />
                    <input
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Цена"
                      type="number"
                      min="0"
                      style={{ ...s.input, width: 120 }}
                    />
                    <button disabled={!canSubmit} style={s.btn("primary", !canSubmit)}>
                      Создать
                    </button>
                  </form>
                ) : (
                  <div style={s.alert("info")}>
                    Вы вошли как обычный пользователь: кнопки управления скрыты.
                    <div style={{ ...s.row, marginTop: 10 }}>
                      <button type="button" onClick={onForbiddenCreate} style={s.btn("danger")}>
                        Попробовать создать товар
                      </button>
                    </div>
                    {forbiddenDemo && (
                      <div style={{ marginTop: 8 }}>
                        Ответ сервера: <b>{forbiddenDemo}</b>
                      </div>
                    )}
                  </div>
                )}

                {loading && <div style={s.alert("info")}>Загрузка списка...</div>}
                {error && <div style={s.alert("error")}>{error}</div>}

                <ul style={s.list}>
                  {items.map((p) => (
                    <li key={p.id} style={s.item}>
                      <div style={s.itemLeft}>
                        <p style={s.itemTitle}>{p.title}</p>
                        <p style={s.itemMeta}>
                          {p.category || "Без категории"} · {p.price} ₽
                        </p>
                      </div>
                      {isEmployee && (
                        <div style={s.itemActions}>
                          <button type="button" onClick={() => onPricePlus(p.id, p.price)} style={s.btn("secondary")}>
                            +10 ₽
                          </button>
                          <button type="button" onClick={() => onDelete(p.id)} style={s.btn("danger")}>
                            Удалить
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
