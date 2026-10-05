/**
 * usersStore.js — учебное хранилище пользователей в памяти процесса Node.js.
 *
 * Пароль хранится только как bcrypt-хеш (passwordHash).
 * Роли контрольного задания:
 * - user     — обычный пользователь, может просматривать товары
 * - employee — сотрудник, может просматривать и изменять товары
 *
 * Демо-аккаунты создаются при старте, чтобы можно было войти
 * под разными ролями без предварительной регистрации.
 * После перезапуска сервера зарегистрированные вручную пользователи пропадают,
 * демо-аккаунты создаются снова.
 */
const bcrypt = require("bcrypt");

const users = [
  {
    id: "user-demo",
    email: "user@mail.ru",
    first_name: "Анна",
    last_name: "Иванова",
    passwordHash: bcrypt.hashSync("user12345", 10),
    role: "user",
  },
  {
    id: "employee-demo",
    email: "employee@mail.ru",
    first_name: "Пётр",
    last_name: "Смирнов",
    passwordHash: bcrypt.hashSync("employee12345", 10),
    role: "employee",
  },
];

function publicUser(u) {
  // Никогда не отдаём passwordHash наружу
  // eslint-disable-next-line no-unused-vars
  const { passwordHash, ...rest } = u;
  return rest;
}

module.exports = { users, publicUser };
