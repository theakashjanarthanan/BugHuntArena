import { AuthPage as Auth2 } from "@/components/auth";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function AuthPage() {
  return (
    <div className="relative">
      {/* Theme Switcher - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeSwitcher />
      </div>
      
      {/* Auth Component */}
      <Auth2 />
    </div>
  );
}
