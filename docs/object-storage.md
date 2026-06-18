# Object Storage (S3)

User uploads on S3-compatible storage (Neo). Frontend build assets are deployed to the app VPS (`public/build/`), not to the `tb-web-*` buckets unless you add a CDN later.

Doc index: [README](../README.md)

Provider endpoint:

```text
https://nos.wjv-1.neo.id/
```

## AWS CLI (required)

Install **AWS CLI v2** on your dev machine and on any server where you manage buckets from the shell.

```text
https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
```

Verify:

```bash
aws --version
```

Configure credentials from Biznet GIO (use a named profile — do not commit keys):

```bash
aws configure --profile travelboost-s3
```

Always pass the Neo endpoint and profile:

```bash
export AWS_PROFILE=travelboost-s3
export S3_ENDPOINT=https://nos.wjv-1.neo.id

aws s3 ls s3://tb-media-dev --endpoint-url "${S3_ENDPOINT}"
aws s3 cp ./local-file.jpg s3://tb-media-dev/images/test.jpg --endpoint-url "${S3_ENDPOINT}"
aws s3 sync ./folder s3://tb-media-dev/prefix/ --endpoint-url "${S3_ENDPOINT}"
```

On Arch Linux:

```bash
sudo pacman -S aws-cli-v2
```

---

## Buckets

| Bucket           | Environment | Purpose                                                       |
| ---------------- | ----------- | ------------------------------------------------------------- |
| `tb-media-dev`   | dev         | User uploads — images, documents, raw files                   |
| `tb-media-main`  | main        | User uploads (production)                                     |
| `tb-web-dev`     | dev         | Optional CDN for frontend assets (not used by default deploy) |
| `tb-web-main`    | main        | Optional CDN (not used by default deploy)                     |
| `tb-backup-dev`  | dev         | WAL-G database backup files                                   |
| `tb-backup-main` | main        | WAL-G database backup files (production)                      |

Presets set `AWS_BUCKET=tb-media-dev` or `tb-media-main` with matching `AWS_URL`. Frontend build assets go to the app VPS (`public/build/`), not these buckets.

## Credentials

Access key and secret key are created in the **Biznet GIO** portal (NEO Object Storage).

Do not commit credentials to the repository. Store them in `.env` on the app server, in `aws configure`, or local credential files only.

Create **separate access keys** for app media, backups, and optional web deploy. Do not reuse one key across roles.

---

## Biznet GIO portal (Neo)

The NEO console is **not** a full AWS IAM console. Access is configured in two places:

### 1. Access keys — Implicit access

When creating or editing an S3 access key, Biznet GIO offers **Implicit access** (no custom IAM policy editor in the portal).

Implicit access means: the key can only reach buckets you explicitly grant to that key in the portal. Scope each key to the minimum buckets it needs.

| Key purpose                 | Grant access to                                            | Typical portal buckets   |
| --------------------------- | ---------------------------------------------------------- | ------------------------ |
| Laravel app (media uploads) | `tb-media-dev` or `tb-media-main`                          | media bucket only        |
| WAL-G / database backup     | `tb-backup-dev` or `tb-backup-main`                        | backup bucket only       |
| Optional web / CDN deploy   | `tb-web-dev` or `tb-web-main`                              | web bucket only          |
| Developer debugging         | all dev buckets (if the portal allows multi-bucket grants) | read-only where possible |

Use one access key per row. Put the key/secret in the matching `.env` variables (`AWS_*` for Laravel, `WALG_*` for backups).

### 2. Bucket access level

Each bucket has a visibility / ACL setting in the portal, for example:

| Portal setting        | Meaning                                                |
| --------------------- | ------------------------------------------------------ |
| **Private**           | Anonymous users cannot list or read objects by default |
| **Public Read**       | Anyone with the object URL can read (whole bucket)     |
| **Public Read Write** | Anonymous read and write — **do not use** for app data |

Recommended settings for Travelboost:

| Bucket                             | Portal bucket access                    | Why                                                                                                                                                                                               |
| ---------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tb-media-dev` / `tb-media-main`   | **Private**                             | Laravel uploads set per-object `public-read` via `visibility => public` in [`config/filesystems.php`](../config/filesystems.php). Only uploaded objects are world-readable, not the whole bucket. |
| `tb-backup-dev` / `tb-backup-main` | **Private**                             | Backups must never be public. Access only via the backup access key (implicit).                                                                                                                   |
| `tb-web-dev` / `tb-web-main`       | **Public Read** (if used as static CDN) | Entire bucket is meant to be served to browsers. Not used by default deploy.                                                                                                                      |

Prefix-level public read (`images/*` only, not `media/raw/*`) is **not** available as a single portal toggle. Options:

- Keep the media bucket **Private** and rely on per-object `public-read` on upload (current Laravel setup), or
- Apply a custom bucket policy with [S3 Browser](https://kb.biznetgio.com/98042-neo-object-storage) (Biznet KB: “Custom Policy Bucket menggunakan S3 Browser”) using the reference JSON below.

Official Neo docs: [S3 API](https://kb.biznetgio.com/98042-neo-object-storage/s3-api-neo-object-storage) · [Manage objects / ACL](https://kb.biznetgio.com/98042-neo-object-storage/manage-object-on-neo-object-storage-service).

---

## Policy reference (`infra/s3/`)

JSON files under [`infra/s3/`](../infra/s3/) document the **intended** permissions for each key and bucket. They are **not** pasted into the Biznet GIO portal when using implicit access.

Use them as a checklist when creating keys and buckets, or as templates for custom bucket policies in S3 Browser.

Replace `-dev` bucket names with `-main` / `-stg` in other environments.

### Access key scope (reference)

Maps each key to buckets and actions. In the portal: create the key with **Implicit access** and grant only the listed bucket(s).

| File                                                                                      | Use for                                   | Buckets                     |
| ----------------------------------------------------------------------------------------- | ----------------------------------------- | --------------------------- |
| [`infra/s3/iam-app-media-dev.json`](../infra/s3/iam-app-media-dev.json)                   | Laravel app (`.env` on app server)        | `tb-media-dev`              |
| [`infra/s3/iam-web-deploy-dev.json`](../infra/s3/iam-web-deploy-dev.json)                 | Optional CDN / manual web asset uploads   | `tb-web-dev`                |
| [`infra/s3/iam-backup-dev.json`](../infra/s3/iam-backup-dev.json)                         | WAL-G / database backup                   | `tb-backup-dev`             |
| [`infra/s3/iam-developer-readonly-dev.json`](../infra/s3/iam-developer-readonly-dev.json) | Local AWS CLI, s3fs, Cyberduck, debugging | all dev buckets (read-only) |

Example — intended permissions for the Laravel app key (`iam-app-media-dev.json`):

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

`tb-backup-dev` stays **Private** in the portal with a backup-only implicit key. No public bucket policy.

### Bucket policies (reference — optional S3 Browser)

These JSON files describe prefix-level anonymous **read** for media and web buckets. The Biznet GIO portal bucket toggle is all-or-nothing; use these only if you apply a custom policy via S3 Browser or equivalent.

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

**AWS CLI v2 is the required CLI** for bucket operations. Other clients are optional.

Configure any client with:

| Setting           | Value                       |
| ----------------- | --------------------------- |
| Endpoint          | `https://nos.wjv-1.neo.id/` |
| Path-style access | Enabled                     |
| Access key        | From Biznet GIO             |
| Secret key        | From Biznet GIO             |

Optional alternatives:

- **Cyberduck** — S3 connection, set path-style / custom endpoint
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

| Symptom                                 | Check                                                                                                                             |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 403 on upload                           | App key has implicit access to `tb-media-dev`; bucket is not Public Read Write only for anonymous                                 |
| 403 on browser URL                      | Object uploaded with `public-read` ACL, or bucket/custom policy allows `GetObject` on that prefix                                 |
| Wrong URL in browser                    | `AWS_URL` and `AWS_USE_PATH_STYLE_ENDPOINT=true`                                                                                  |
| s3fs mount empty                        | Bucket name, endpoint URL, path-style flag                                                                                        |
| s3fs read-only                          | Remove `-o ro`; ensure `-o rw` is set                                                                                             |
| Laravel cannot write                    | `composer require league/flysystem-aws-s3-v3` installed                                                                           |
| Backup upload fails / admin panel empty | Backup key has implicit access to `tb-backup-dev` only; bucket **Private**; see [Database Backups](./database-backups.md)         |
| AWS CLI 403 / denied                    | Correct `--endpoint-url`, profile, and implicit bucket grant for that access key                                                  |
| AWS CLI not found                       | Install AWS CLI v2 — see [Getting started install](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) |
