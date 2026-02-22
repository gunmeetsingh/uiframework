export const DEV_USERS = [
    {
        id: "1",
        username: "admin",
        password: "admin", // In a real app, hash this!
        name: "Dev Admin",
        email: "admin@example.com",
        role: "admin",
        permissions: ["grafana", "node:create", "node:update", "node:delete", "node:read"]
    },
    {
        id: "2",
        username: "viewer",
        password: "viewer",
        name: "Dev Viewer",
        email: "viewer@example.com",
        role: "viewer",
        permissions: ["grafana", "node:read", "node:update"]
    }
];
