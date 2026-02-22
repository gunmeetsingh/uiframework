# OAM Portal: Complete Production Deployment Guide (AWS)

This guide provides step-by-step instructions for deploying the OAM Portal and its dependencies in a production-grade environment on AWS using Docker and ECS.

## 1. System Architecture & Dependencies

The portal relies on several key architectural components:
*   **Networking**: VPC with Public (ALB) and Private (Apps/DB) subnets.
*   **Identity (Keycloak)**: Handles RBAC and OIDC authentication.
*   **Database (RDS)**: Persistent storage for users, configs, and Keycloak data.
*   **Monitoring (Grafana)**: Optional component embedded via iframe for analytics.
*   **Application (Next.js)**: The core metadata-driven portal.

---

## 1.1 Assumptions

*   **MySQL Database**: This guide primarily assumes a **MySQL 8.0+** instance is already provisioned and reachable. 
*   **Credentials**: You possess the necessary endpoint, database name (e.g., `oam_portal`), and credentials.

---

## 2. Infrastructure Setup (AWS Console/Terraform)

### Step 2.1: Networking
1.  **VPC**: Create a VPC with CIDR `10.0.0.0/16`.
2.  **Subnets**: Create 2 Public subnets and 2 Private subnets across 2 Availability Zones.
3.  **IGW**: Attach an Internet Gateway to the Public subnets.
4.  **NAT Gateway**: Setup a NAT Gateway in the Public subnet to allow Private subnets to reach the internet for image pulls.

### Step 2.2: Security Groups
*   **ALB-SG**: Inbound 80/443 from `0.0.0.0/0`.
*   **App-SG**: Inbound 3000 (Portal) and 8080 (Keycloak) from **ALB-SG**.
*   **DB-SG**: Inbound 5432 (Postgres) from **App-SG**.

---

## 3. Database Deployment (Amazon RDS)

1.  Create a **PostgreSQL 15+ Instance** using the `db-sg`.
2.  Use **Multi-AZ** for production high availability.
3.  Initialize the schema using the provided [`db/init.sql`](file:///home/guest/Desktop/Code/UIFrameWork/db/init.sql) script:
    ```bash
    # Example using mysql client
    mysql -h <rds-endpoint> -u <user> -p oam_portal < db/init.sql
    ```
    (Repeat for other logical databases if product-specific schemas are required).

---

## 4. Identity Provider Setup (Keycloak)

### Deployment
Deploy Keycloak as an ECS Service using the official `quay.io/keycloak/keycloak` image.

**Key Environment Variables**:
*   `KC_DB`: `mysql`
*   `KC_DB_URL`: `jdbc:mysql://<rds-endpoint>:3306/keycloak`
*   `KC_HOSTNAME`: `auth.yourdomain.com`

### Configuration
1.  Login to the Admin Console.
2.  **Create Realm**: `spartified`.
3.  **Create Client**: `oam-portal`.
    *   **Access Type**: `confidential`.
    *   **Valid Redirect URIs**: `https://portal.yourdomain.com/api/auth/callback/keycloak`.
4.  **Roles/Groups**: Define roles like `admin`, `viewer` and map them to users.

---

## 5. Portal Application Deployment

### Build and Push Image
```bash
# Build
docker build -t oam-portal .

# Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin <aws-id>.dkr.ecr.<region>.amazonaws.com
docker tag oam-portal <aws-id>.dkr.ecr.<region>.amazonaws.com/oam-portal:prod
docker push <aws-id>.dkr.ecr.<region>.amazonaws.com/oam-portal:prod
```

### ECS Task Configuration
Inject the following secrets from **AWS Secrets Manager**:
*   `DATABASE_URL`: `mysql://user:pass@<rds-endpoint>:3306/oam_portal` (or postgres equivalent)
*   `NEXTAUTH_SECRET`: Random 32+ char string.
*   `KEYCLOAK_SECRET`: Client secret from Step 4.

---

## 6. Integrating Optional Products

The platform supports hot-installation of new products via metadata.

### How to install a new product:
1.  **Drop Schema**: Put the product's JSON schema in `src/schemas/`.
2.  **Register Module**: Add the module definition to `src/config/modules.ts`.
    ```typescript
    {
       id: 'product-x-config',
       title: 'Product X Setup',
       path: '/configuration/product-x',
       category: 'Configuration',
       permission: 'product:x:manage',
       schema: '/schemas/product-x.json'
    }
    ```
3.  **Add Permission**: Add `product:x:manage` to the "Granular Permissions" list in `src/schemas/users.json`.
4.  **Redeploy**: Perform a rolling update to the ECS Service.

---

## 7. Monitoring Deployment (Grafana)

1.  Deploy Grafana as a sidecar or a separate ECS service.
2.  Enable **Anonymous Auth** (or OIDC) to allow the portal to embed dashboards.
3.  Ensure the `GF_SECURITY_ALLOW_EMBEDDING` environment variable is set to `true`.

---

> [!TIP]
> Use **Amazon CloudWatch** for centralized logging of all ECS containers to troubleshoot deployment or permission issues.
