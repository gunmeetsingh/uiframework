# Standalone Server Deployment Guide (EC2/VM)

If you have a pre-provisioned AWS server (e.g., EC2 running Amazon Linux or Ubuntu), follow these steps to deploy the UI using Docker.

## 1. Prerequisites (Already Met)

*   **Docker & Docker Compose**: Installed and running on the server.
*   **MySQL 8.0+**: Installed and reachable.

---

## 2. Initialize Database Schema

Since MySQL is already installed, connect to your instance and run the provided initialization script to create the necessary metadata tables:

```bash
# Connect and run the init script
# Replace <user> as necessary. 
mysql -u <user> -p oam_portal < db/init.sql
```

(Note: Ensure the `oam_portal` and `keycloak` databases are created first).

---

## 3. Copying the Package to the Server

Choose one of the following methods to transfer the OAM Portal codebase to your AWS server:

### Option A: Using SCP (From your local machine)
If you have the code locally, you can upload it as a compressed archive:
```bash
# 1. Create an archive locally
tar -czvf oam-portal.tar.gz . 

# 2. Upload to the server
scp -i <your-key.pem> oam-portal.tar.gz ec2-user@<server-ip>:~/

# 3. Extract on the server
ssh -i <your-key.pem> ec2-user@<server-ip> "tar -xzvf oam-portal.tar.gz"
```

### Option B: Using Git (Directly on the server)
If your code is on GitHub:
```bash
ssh -i <your-key.pem> ec2-user@<server-ip>
git clone https://github.com/gunmeetsingh/uiframework.git
cd uiframework
```

---

## 4. Configuration

1. Clone or copy the project files to the server.
2. Edit the `docker-compose.yml` file to set your actual environment variables:
   - `DATABASE_URL`: Your MySQL connection string.
   - `KC_DB_URL`: The JDBC connection string for Keycloak.
   - Replace `<server-ip>` with your actual AWS Public IP or Domain.

---

## 5. Automated Deployment via GitHub

If you use the built-in GitHub Actions workflow, the server can pull the latest image automatically without you building it locally.

### Step 1: Login to GitHub Registry on Server
```bash
echo <YOUR_GITHUB_TOKEN> | docker login ghcr.io -u <YOUR_USERNAME> --password-stdin
```

### Step 2: Update Docker Compose
Update your `docker-compose.yml` to use the GitHub image instead of a local build:
```yaml
services:
  oam-portal:
    image: ghcr.io/<your-username>/uiframework:main
    ...
```

### Step 3: Pull and Restart
```bash
docker-compose pull oam-portal
docker-compose up -d oam-portal
```

---

## 6. Post-Installation

1. **Firewall**: Ensure your AWS Security Group allows inbound traffic on:
   - **Port 3000**: For the OAM Portal UI.
   - **Port 8080**: For the Keycloak Admin Console.
2. **Health Check**: Access `http://your-server-ip:3000` to verify the application is running.

---

> [!NOTE]
> For production environments, it is highly recommended to run an **Nginx** reverse proxy in front of Docker to handle WebSockets and SSL (HTTPS).
