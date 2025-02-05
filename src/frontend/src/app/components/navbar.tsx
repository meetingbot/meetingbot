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
import ProfileButton from "./profileButton";

const components: { title: string; href: string }[] = [
  {
    title: "Dashboard",
    href: "/",
  },
  {
    title: "Docs",
    href: "/docs",
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
];

export default function Navbar() {
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
            {components.map((component) => (
              <NavigationMenuItem key={component.title}>
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
        <ProfileButton />
      </div>
    </div>
  );
}
