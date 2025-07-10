import { cn } from "@/lib/utils";

type StatsCardProps = {
  title: string;
  value: number | string;
  change: string;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  changeColor: string;
  borderColor: string;
  arrow?: "up" | "down" | "none";
};

export default function StatsCard({
  title,
  value,
  change,
  icon,
  iconBgColor,
  iconColor,
  changeColor,
  borderColor,
  arrow = "up"
}: StatsCardProps) {
  return (
    <div className={cn("bg-white rounded-lg shadow p-5", `border-l-4 ${borderColor}`)}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-neutral-500 text-sm font-medium">{title}</p>
          <p className="text-3xl font-semibold mt-1">{value}</p>
          <p className={cn("text-sm font-medium flex items-center mt-2", changeColor)}>
            {arrow !== "none" && (
              <span className="material-icons text-sm mr-1">
                {arrow === "up" ? "arrow_upward" : "arrow_downward"}
              </span>
            )}
            {arrow === "none" ? (
              <span className="material-icons text-sm mr-1">check_circle</span>
            ) : null}
            {change}
          </p>
        </div>
        <div className={cn("p-3 rounded-full", iconBgColor)}>
          <span className={cn("material-icons", iconColor)}>{icon}</span>
        </div>
      </div>
    </div>
  );
}
