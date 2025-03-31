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
} from "~/components/ui/navigation-menu";
import SessionButton from "./SessionButton";
import { ExternalLink } from "lucide-react";

const components: {
  title: string | React.ReactNode;
  href: string;
  target: string;
}[] = [
  {
    title: "Dashboard",
    href: "/",
    target: "_self",
  },

  {
    title: "API Keys",
    href: "/keys",
    target: "_self",
  },
  {
    title: "Bots",
    href: "/bots",
    target: "_self",
  },
  {
    title: "Usage",
    href: "/usage",
    target: "_self",
  },
  {
    title: "Docs",
    href: "/docs",
    target: "_self",
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
                  <NavigationMenuLink
                    className={navigationMenuTriggerStyle()}
                    target={component.target}
                  >
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
