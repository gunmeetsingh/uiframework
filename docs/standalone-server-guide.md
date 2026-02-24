# Standalone Server Deployment Guide (EC2/VM)

This guide is optimized for deploying the OAM Portal on a pre-provisioned AWS server where **Docker** and **MySQL** are already installed.

## 1. Prerequisites (Already Met)
*   **Docker & Docker Compose**: Installed and running on the server.
*   **MySQL 8.0+**: Reachable for metadata storage.

---

## 2. Initialize Database Schema

Connect to your MySQL instance and run the initialization script provided in the repository to prepare the metadata tables.

```bash
# Connect and run the init script
# Replace <user> as necessary.
mysql -u <user> -p oam_portal < db/init.sql
```
*(Note: Ensure you have manually created the `oam_portal` and `keycloak` databases first).*

---

## 3. Choose Your Deployment Path

### Path A: Registry-Driven (Recommended)
**No need to copy the source code package to the server.**

1.  **Transfer Only Essentials**: You only need to copy the `docker-compose.yml` and `db/init.sql` files to the server.
2.  **Authenticate**: Login to the GitHub Container Registry:
    ```bash
    echo <YOUR_GITHUB_TOKEN> | docker login ghcr.io -u <YOUR_USERNAME> --password-stdin
    ```
3.  **Configure**: Edit `docker-compose.yml` on the server and ensure the `image:` property points to your repository.
4.  **Launch**:
    ```bash
    docker compose pull
    docker compose up -d
    ```

### Path B: Manual Build (Package-Driven)
**Requires copying the entire project source code to the server.**

1.  **Transfer Package**: Compress and upload the entire folder:
    ```bash
    # Local machine
    tar -czvf oam-portal.tar.gz .
    scp -i <key.pem> oam-portal.tar.gz ec2-user@<ip>:~/
    ```
2.  **Extract**: `tar -xzvf oam-portal.tar.gz` on the server.
3.  **Configure**: Edit `docker-compose.yml` and uncomment the `build:` section, while commenting out the `image:` property.
4.  **Launch**:
    ```bash
    docker compose up -d --build
    ```

---

## 4. Final Configuration

Regardless of the path chosen, update these variables in `docker-compose.yml`:
*   `CORE_DB_URL`: `mysql://user:pass@localhost:3306/oam_portal`
*   `GTP_PROXY_DB_URL`: `mysql://user:pass@localhost:3306/gtp_proxy` (Point to your product's DB)
*   `NEXTAUTH_URL`: `http://<your-server-ip>:3000`
*   `KC_HOSTNAME`: `<your-server-ip>`

---

## 5. Upgrading the Portal (Site Upgrade)

When a new package or version is released, follow these steps to upgrade your live site:

1.  **Pull Latest Image**:
    ```bash
    # Navigate to your deployment folder
    cd /path/to/oam-portal
    
    # Pull the latest version from registry
    docker compose pull
    ```
2.  **Apply Changes**:
    ```bash
    # Restart the containers with the new image
    docker compose up -d
    ```
3.  **Clean Up (Optional)**:
    ```bash
    # Remove old images to save space
    docker image prune -f
    ```

---

## 6. Post-Installation & Firewall

Ensure your AWS Security Group allows inbound traffic on:
*   **Port 3000**: OAM Portal UI.
*   **Port 8080**: Keycloak Console.

Verify the installation by visiting `http://your-server-ip:3000`.

---

> [!NOTE]
> For production, consider using an **Nginx** reverse proxy for SSL/HTTPS termination.
