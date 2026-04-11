import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, Activity, Scan, TrendingUp, User } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { path: "/dashboard", icon: Home, label: "Home" },
  { path: "/routine", icon: Activity, label: "Routine" },
  { path: "/scan", icon: Scan, label: "Scan" },
  { path: "/progress", icon: TrendingUp, label: "Progress" },
  { path: "/account", icon: User, label: "Account" },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background font-inter">
      <div className="max-w-lg mx-auto pb-24">
        <Outlet />
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border z-50">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center gap-1 py-2 px-3"
              >
                <div className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -inset-2 bg-primary/10 rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}

                  <Icon
                    className={`relative w-5 h-5 transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                    strokeWidth={isActive ? 2.5 : 1.5}
                  />
                </div>

                <span
                  className={`text-[10px] font-medium transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}