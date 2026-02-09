"use client";

import * as React from "react";
import {
  IconBrush,
  IconDashboard,
  IconInnerShadowTop,
  IconLayoutGrid,
  IconSettings,
  IconShoppingCart,
  IconUserPlus,
  IconUsers,
} from "@tabler/icons-react";

import { NavMain } from "@/components/admin-sidebar/nav-main";
import { NavSecondary } from "@/components/admin-sidebar/nav-secondary";
import { NavUser } from "@/components/admin-sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: IconDashboard,
    },
    {
      title: "Add Category",
      url: "/admin/categories",
      icon: IconLayoutGrid,
    },
    {
      title: "Add Design",
      url: "/admin/add-design",
      icon: IconBrush,
    },
    {
      title: "My Orders",
      url: "#",
      icon: IconShoppingCart,
    },
    {
      title: "Users",
      url: "#",
      icon: IconUsers,
    },
    {
      title: "Add Admin",
      url: "#",
      icon: IconUserPlus,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
