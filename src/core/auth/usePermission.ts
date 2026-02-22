import { useAuth } from './AuthProvider';

export const usePermission = () => {
    const { user } = useAuth();

    const can = (permission: string) => {
        return user?.permissions?.includes(permission) || false;
    };

    const hasRole = (role: string) => {
        return user?.role === role;
    };

    return { can, hasRole };
};
