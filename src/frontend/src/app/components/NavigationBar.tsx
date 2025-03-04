"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import SessionButton from "./SessionButton";
import { ExternalLink } from "lucide-react";
import { env } from "~/env";

const components: { title: string | React.ReactNode; href: string }[] = [
  {
    title: "Dashboard",
    href: "/",
  },

  {
    title: "API Keys",
    href: "/keys",
  },
  {
    title: "Bots",
    href: "/bots",
  },
  {
    title: "Usage",
    href: "/usage",
  },
  {
    title: (
      <span className="flex items-center">
        Docs <ExternalLink className="h-4" />
      </span>
    ),
    href: `${env.NEXT_PUBLIC_BACKEND_URL}/docs`,
  },
];

export default function NavigationBar() {
  return (
    <div className="flex w-full flex-row items-center justify-between p-2">
      <NavigationMenu className="flex-1">
        <div className="flex items-center">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={32}
            height={32}
            className="mr-2"
          />
          <NavigationMenuList>
            {components.map((component, index) => (
              <NavigationMenuItem key={index}>
                <Link href={component.href} legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    {component.title}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </div>
      </NavigationMenu>
      <div className="flex items-center">
        <SessionButton />
      </div>
    </div>
  );
}
