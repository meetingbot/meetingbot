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
  title?: string;
  description?: string;
  content?: string | React.ReactNode;
  icon?: React.ReactNode;
  link?: {
    type: "EXTERNAL" | "INTERNAL";
    url: string;
    text: string;
  };
}

export default function DashboardCard({
  title,
  description,
  content,
  icon,
  link,
}: DashboardCardProps) {
  return (
    <Card>
      {(!!title || !!description || !!icon) && (
        <CardHeader className="relative">
          {!!icon && <div className="absolute right-2 top-2">{icon}</div>}
          {!!title && <CardTitle>{title}</CardTitle>}
          {!!description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}

      {!!content && <CardContent>{content}</CardContent>}
      {!!link && (
        <CardFooter>
          <Link href={link.url}>{link.text}</Link>
          {link.type === "EXTERNAL" ? (
            <ExternalLink className="ml-2 h-4 w-4" />
          ) : (
            <ChevronRight className="ml-2 h-4 w-4" />
          )}
        </CardFooter>
      )}
    </Card>
  );
}
