import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

export const LeverSwitch = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center gap-3">
      {/* Dark Label */}
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Dark
      </span>

      {/* Lever Switch */}
      <div className="toggle-container">
        <input
          className="toggle-input"
          type="checkbox"
          checked={theme === 'light'}
          onChange={toggleTheme}
        />
        <div className="toggle-handle-wrapper">
          <div className="toggle-handle">
            <div className="toggle-handle-knob"></div>
            <div className="toggle-handle-bar-wrapper">
              <div className="toggle-handle-bar"></div>
            </div>
          </div>
        </div>
        <div className="toggle-base">
          <div className="toggle-base-inside"></div>
        </div>
      </div>

      {/* Light Label */}
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Light
      </span>
    </div>
  );
};
