import React from "react";
import { logout } from "../../services/authService.js";
import { getAvatarLetter } from "../../store/authStore.js";

export default function Navbar({ user }) {
  const avatarLetter = getAvatarLetter(user);

  return (
    <nav className="nav">
      <div className="nav__brand">
        <svg id="logo" viewBox="-2 -20 40 44" width="70" xmlns="http://www.w3.org/2000/svg">
          <path d="M -1 1 L 20 23 L 24 19 L 7 1 L 24 -16 L 20 -20 Z" fill="#E53935" />
          <path d="M 11 1 L 26 -14 L 30 -10 L 25 -5 L 37 7 L 33 11 L 21 -1 L 19 1 L 31 13 L 27 17 Z" fill="#E53935" />
        </svg>
        <span className="brand-text">Livit Interiors</span>
      </div>
      <div className="nav__right">
        <div className="nav__user">
          <div className="nav__avatar" aria-hidden="true">{avatarLetter}</div>
          <span className="nav__email">{user?.email}</span>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={logout}>
          Sign out
        </button>
      </div>
    </nav>
  );
}
