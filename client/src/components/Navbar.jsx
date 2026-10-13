import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { BrainCircuit, Menu, X, Github, Sparkles } from "lucide-react";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/backtest", label: "Backtest Benchmark" },
  { to: "/about", label: "About Project" },
  { to: "/guide", label: "Results Guide" },
  { to: "/help", label: "Help" },
];

function navLinkClasses({ isActive }) {
  return `rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
    isActive
      ? "bg-brand-50 text-brand-700 shadow-2xs font-bold"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        {/* Brand Logo */}
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2.5 font-bold text-slate-900 group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-700 to-indigo-500 shadow-xs group-hover:scale-105 transition-transform">
            <BrainCircuit className="h-4.5 w-4.5 text-white" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="text-base tracking-tight leading-none font-extrabold bg-gradient-to-r from-slate-900 via-slate-800 to-brand-700 bg-clip-text text-transparent">
              ResearchMind
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide">
              6-Agent Scientific Engine
            </span>
          </div>
        </Link>

        {/* Primary Desktop Nav */}
        <nav aria-label="Primary" className="hidden items-center gap-1.5 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClasses}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* GitHub & Quick Action */}
        <div className="hidden sm:flex items-center gap-2.5">
          <a
            href="https://github.com/harshitkushwaha45/-AAI-Powered-Multi-Agent-Research-Assistant-for-Literature-Review-and-Research-Gap-Identification"
            target="_blank"
            rel="noopener noreferrer"
            title="View Source on GitHub"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-2xs"
          >
            <Github className="h-3.5 w-3.5" />
            <span>GitHub</span>
          </a>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <nav aria-label="Primary" className="border-t border-slate-200 bg-white px-5 py-3 md:hidden shadow-lg">
          <ul className="flex flex-col gap-1.5">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2 text-xs font-semibold ${
                      isActive ? "bg-brand-50 text-brand-700 font-bold" : "text-slate-600 hover:bg-slate-100"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
            <li className="pt-2 border-t border-slate-100">
              <a
                href="https://github.com/harshitkushwaha45/-AAI-Powered-Multi-Agent-Research-Assistant-for-Literature-Review-and-Research-Gap-Identification"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Github className="h-4 w-4" />
                <span>View Source on GitHub</span>
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
