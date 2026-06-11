export function isProtectedCompanyRole(name: string): boolean {
    return name.endsWith(':superadmin');
}
