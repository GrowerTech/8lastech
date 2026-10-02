"use client";

import ResourceManager from "./ResourceManager";
import { CONFIGS } from "./configs";

export default function ResourcePage({ resource, permissions }: { resource: string; permissions: string[] }) {
  const config = CONFIGS[resource];
  if (!config) return null;
  return <ResourceManager config={config} permissions={permissions} />;
}
