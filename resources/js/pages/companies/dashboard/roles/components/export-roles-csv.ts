import type { RoleRow } from '../index';

function escapeCsvField(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
        return '';
    }

    const str = String(value);

    if (/[",\n\r]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
}

function roleCode(name: string, companyId: number): string {
    return name.replace(`company:${companyId}:`, '');
}

export function downloadRolesCsv(
    roles: RoleRow[],
    companyId: number,
    filename = 'roles.csv',
): void {
    if (roles.length === 0) {
        return;
    }

    const headers = [
        'ID',
        'Code',
        'Display Name',
        'Description',
        'Permissions',
        'Users Count',
    ];

    const lines = [
        headers.map(escapeCsvField).join(','),
        ...roles.map((role) =>
            [
                role.id,
                roleCode(role.name, companyId),
                role.display_name,
                role.description ?? '',
                role.permissions
                    .map((permission) => permission.name)
                    .join(', '),
                role.users_count,
            ]
                .map(escapeCsvField)
                .join(','),
        ),
    ];

    const csv = `\uFEFF${lines.join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = objectUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
}
