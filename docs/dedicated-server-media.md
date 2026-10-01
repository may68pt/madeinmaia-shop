# Persistent media on the dedicated server

Studio uploads are stored on the server filesystem. They are not committed to Git.

Recommended production environment:

```env
UPLOADS_DIR=/var/lib/madeinmaia/uploads
UPLOADS_PUBLIC_URL=/uploads
```

Create the persistent directory and grant write access to the account that runs the Node service. Configure Nginx to serve it:

```nginx
location /uploads/ {
    alias /var/lib/madeinmaia/uploads/;
    try_files $uri =404;
    add_header X-Content-Type-Options nosniff;
    expires 30d;
}
```

Back up `/var/lib/madeinmaia/uploads` together with PostgreSQL. Deployments should replace only the application directory and must never delete the persistent uploads directory.

On Render, mount a persistent disk at `/var/data` and use:

```env
UPLOADS_DIR=/var/data/uploads
UPLOADS_PUBLIC_URL=/uploads
```

The application serves `/uploads/<filename>` itself, so the persistent disk also works without Nginx.
