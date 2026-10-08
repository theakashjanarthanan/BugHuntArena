import { SignupPage } from "@/components/signup";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function Signup() {
  return (
    <div className="relative">
      {/* Theme Switcher - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeSwitcher />
      </div>
      
      {/* Signup Component */}
      <SignupPage />
    </div>
  );
}
