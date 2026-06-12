# Object Storage (S3)

User uploads and static assets on S3-compatible storage (not the app server disk).

Doc index: [README](../README.md)

Provider endpoint:

```text
https://nos.wjv-1.neo.id/
```

## Buckets

| Bucket          | Purpose                                     |
| --------------- | ------------------------------------------- |
| `tb-media-dev`  | User uploads — images, documents, raw files |
| `tb-web-dev`    | Compiled frontend assets (`public/build`)   |
| `tb-backup-dev` | Database backup files                       |

Use the matching `-main` / `-dev` bucket names in other environments.

## Credentials

Access key and secret key are available in the **Biznet GIO** account.

Do not commit credentials to the repository. Store them in `.env` on the app server and in local credential files only.

---

## Policies

Policy JSON files live in `infra/s3/`. Apply them in the **Biznet GIO** console (or equivalent S3 admin UI). Replace `-dev` bucket names with `-main` / `-stg` in other environments.

### IAM user policies

Attach one policy per access key. Do not share one key across app, deploy, and backup.

| File                                                                                      | Use for                                   | Buckets                     |
| ----------------------------------------------------------------------------------------- | ----------------------------------------- | --------------------------- |
| [`infra/s3/iam-app-media-dev.json`](../infra/s3/iam-app-media-dev.json)                   | Laravel app (`.env` on app server)        | `tb-media-dev`              |
| [`infra/s3/iam-web-deploy-dev.json`](../infra/s3/iam-web-deploy-dev.json)                 | CI / deploy script syncing `public/build` | `tb-web-dev`                |
| [`infra/s3/iam-backup-dev.json`](../infra/s3/iam-backup-dev.json)                         | WAL-G / database backup                   | `tb-backup-dev`             |
| [`infra/s3/iam-developer-readonly-dev.json`](../infra/s3/iam-developer-readonly-dev.json) | Local s3fs, Cyberduck, debugging          | all dev buckets (read-only) |

Example — Laravel app user (`iam-app-media-dev.json`):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "MediaObjectReadWriteDelete",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:AbortMultipartUpload"
            ],
            "Resource": "arn:aws:s3:::tb-media-dev/*"
        },
        {
            "Sid": "MediaBucketList",
            "Effect": "Allow",
            "Action": ["s3:ListBucket"],
            "Resource": "arn:aws:s3:::tb-media-dev",
            "Condition": {
                "StringLike": {
                    "s3:prefix": ["images/*", "media/*"]
                }
            }
        }
    ]
}
```

`tb-backup-dev` has **no public bucket policy**. Access is IAM-only (same pattern as [Production Database Server](./production-database-server.md) WAL-G config).

### Bucket policies (anonymous read)

Apply on the bucket itself for browser/CDN access to public objects.

| File                                                                                | Bucket         | Public prefixes                 |
| ----------------------------------------------------------------------------------- | -------------- | ------------------------------- |
| [`infra/s3/bucket-policy-media-dev.json`](../infra/s3/bucket-policy-media-dev.json) | `tb-media-dev` | `images/*`, `media/documents/*` |
| [`infra/s3/bucket-policy-web-dev.json`](../infra/s3/bucket-policy-web-dev.json)     | `tb-web-dev`   | entire bucket                   |

Example — media bucket public read (`bucket-policy-media-dev.json`):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadImages",
            "Effect": "Allow",
            "Principal": "*",
            "Action": ["s3:GetObject"],
            "Resource": "arn:aws:s3:::tb-media-dev/images/*"
        },
        {
            "Sid": "PublicReadTourDocuments",
            "Effect": "Allow",
            "Principal": "*",
            "Action": ["s3:GetObject"],
            "Resource": "arn:aws:s3:::tb-media-dev/media/documents/*"
        }
    ]
}
```

Example — web build bucket (`bucket-policy-web-dev.json`):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadWebBuild",
            "Effect": "Allow",
            "Principal": "*",
            "Action": ["s3:GetObject"],
            "Resource": "arn:aws:s3:::tb-web-dev/*"
        }
    ]
}
```

**Security note:** identity cards (`identity-card` subtype) are also stored under `media/documents/`. Public read on that prefix exposes them. Plan to move sensitive uploads to `media/private/*` (no public bucket rule) and serve via signed URLs or an authenticated download route.

`media/raw/*` is not included in the public bucket policy.

---

## Laravel configuration (live)

Set these values in the app server `.env`:

```env
FILESYSTEM_DISK=s3

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=tb-media-dev
AWS_URL=https://nos.wjv-1.neo.id/tb-media-dev
AWS_ENDPOINT=https://nos.wjv-1.neo.id
AWS_USE_PATH_STYLE_ENDPOINT=true
```

Install the S3 Flysystem adapter if it is not already present:

```bash
composer require league/flysystem-aws-s3-v3 "^3.0" --with-all-dependencies
```

The local `php artisan storage:link` symlink is only needed when files are served from `storage/app/public`. On live, media URLs are generated from the bucket.

---

## GUI / CLI clients

Any S3-compatible client works. Configure with:

| Setting           | Value                       |
| ----------------- | --------------------------- |
| Endpoint          | `https://nos.wjv-1.neo.id/` |
| Path-style access | Enabled                     |
| Access key        | From Biznet GIO             |
| Secret key        | From Biznet GIO             |

Examples:

- **Cyberduck** — S3 connection, set path-style / custom endpoint
- **AWS CLI** — `aws s3 ls s3://tb-media-dev --endpoint-url https://nos.wjv-1.neo.id`
- **rclone** — `s3` provider with `force_path_style = true`
- **MinIO Client (`mc`)** — alias pointing at the Neo endpoint

---

## Mount bucket on Linux (s3fs)

Useful for browsing or manually copying files from a workstation.

### 1. Install s3fs

Debian / Ubuntu:

```bash
sudo apt install s3fs
```

Arch Linux:

```bash
sudo pacman -S s3fs-fuse
```

### 2. Store credentials

Create a passwd file (mode `600`):

```bash
echo 'ACCESS_KEY_ID:SECRET_ACCESS_KEY' > "${HOME}/.passwd-s3fs"
chmod 600 "${HOME}/.passwd-s3fs"
```

Replace `ACCESS_KEY_ID` and `SECRET_ACCESS_KEY` with values from Biznet GIO.

### 3. Create mount point

```bash
mkdir -p "${HOME}/s3/tb-media-dev"
```

### 4. Mount read-write

```bash
s3fs tb-media-dev "${HOME}/s3/tb-media-dev" \
  -o passwd_file="${HOME}/.passwd-s3fs" \
  -o url=https://nos.wjv-1.neo.id/ \
  -o use_path_request_style \
  -o rw \
  -o umask=0022
```

- `-o rw` — read-write mount (default, but set explicitly to avoid accidental read-only)
- `-o umask=0022` — new files are user-writable
- Omit `-o ro` unless you intentionally want read-only access

To allow other users on the same machine to access the mount, add `-o allow_other` and enable `user_allow_other` in `/etc/fuse.conf`.

### 5. Unmount

```bash
fusermount -u "${HOME}/s3/tb-media-dev"
```

### 6. Optional: `/etc/fstab` entry

```text
s3fs#tb-media-dev  /home/ivn/s3/tb-media-dev  fuse  _netdev,allow_other,use_path_request_style,url=https://nos.wjv-1.neo.id/,passwd_file=/home/ivn/.passwd-s3fs,rw,umask=0022  0  0
```

Adjust the mount path and passwd file location for your user.

---

## Troubleshooting

| Symptom              | Check                                                   |
| -------------------- | ------------------------------------------------------- |
| 403 on upload        | App IAM key uses `iam-app-media-dev.json` on the bucket |
| 403 on browser URL   | Bucket policy allows `GetObject` on that prefix         |
| Wrong URL in browser | `AWS_URL` and `AWS_USE_PATH_STYLE_ENDPOINT=true`        |
| s3fs mount empty     | Bucket name, endpoint URL, path-style flag              |
| s3fs read-only       | Remove `-o ro`; ensure `-o rw` is set                   |
| Laravel cannot write | `composer require league/flysystem-aws-s3-v3` installed |
| Backup upload fails  | WAL-G key uses `iam-backup-dev.json`, not the app key   |
