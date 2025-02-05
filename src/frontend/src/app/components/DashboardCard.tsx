import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";

interface DashboardCardProps {
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  content?: string | React.ReactNode;
  icon?: React.ReactNode;
  link?: {
    type: "EXTERNAL" | "INTERNAL";
    url: string;
    text: string;
  };
  className?: string;
}

export default function DashboardCard({
  title,
  description,
  content,
  icon,
  link,
  className,
}: DashboardCardProps) {
  return (
    <Card className={`flex flex-col ${className}`}>
      {(!!title || !!description || !!icon) && (
        <CardHeader className="relative">
          {!!icon && <div className="absolute right-2 top-2">{icon}</div>}
          {!!title && typeof title === "string" ? (
            <CardTitle>{title}</CardTitle>
          ) : (
            title
          )}
          {!!description &&
            (typeof description === "string" ? (
              <CardDescription>{description}</CardDescription>
            ) : (
              description
            ))}
        </CardHeader>
      )}

      {!!content && <CardContent>{content}</CardContent>}
      {!!link && (
        <CardFooter className="mt-auto">
          <Link href={link.url} className="flex items-center">
            {link.text}
            {link.type === "EXTERNAL" ? (
              <ExternalLink className="ml-2 h-4 w-4" />
            ) : (
              <ChevronRight className="ml-2 h-4 w-4" />
            )}
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
