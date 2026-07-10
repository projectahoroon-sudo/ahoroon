import React from 'react';
import { useAuth } from '../context/AuthContext'; // Assuming AuthContext exists, I'll need to check or create one if not.
import { Permissions } from '../types';

interface PermissionGateProps {
  permission: string; // E.g., 'products.create'
  children: React.ReactNode;
}

export const PermissionGate = ({ permission, children }: PermissionGateProps) => {
  // This is a placeholder until I set up the auth context to hold user permissions
  const { user } = useAuth(); 

  if (!user) return null;
  if (user.role === 'Super Admin') return <>{children}</>;

  const [category, action] = permission.split('.') as [keyof Permissions, string];
  
  // Need to safely access nested permissions
  const permissions = user.permissions;
  if (permissions[category] && (permissions[category] as any)[action]) {
    return <>{children}</>;
  }

  return null;
};
