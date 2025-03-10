export interface RolePermissionDto {
    id: string;
    roleId: string;
    permissionId: string;
    permissionName: string;
    categoryId: string;
    categoryName: string;
}

export interface RolePermissionForAssignmentDto {
    roleId: string;
    categoryAssignments: CategoryPermissionAssignmentDto[];
}

export interface CategoryPermissionAssignmentDto {
    categoryId: string;
    permissionIds: string[];
}
export interface RolePermissionForManipulationDto{
    roleId ?: string;
    permissionId?: string;
    categoryId ?: string;
}