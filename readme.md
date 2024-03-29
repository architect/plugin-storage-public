[<img src="https://assets.arc.codes/architect-logo-500b@2x.png" width=500>](https://www.npmjs.com/package/@architect/architect)

## [`@architect/plugin-storage-public`](https://www.npmjs.com/package/@architect/plugin-storage-public)

> Architect serverless framework plugin that defines any number of arbitrary **public** S3 buckets for your application

[`@architect/plugin-storage-public`](https://www.npmjs.com/package/@architect/plugin-storage-public) provisions **public** S3 buckets for your application. If you need to provision **private** S3 buckets, check out [`@architect/plugin-storage-private`](https://www.npmjs.com/package/@architect/plugin-storage-private).


## Installation

1. Run: `npm i @architect/plugin-storage-public`

2. Then add the following line to the `@plugins` pragma in your Architect project manifest (usually `.arc`):

> Note, no `@` in the plugin name!

```
@plugins
architect/plugin-storage-public
```

3. Add a new `@storage-public` pragma

Define any number of S3 bucket names within `@storage-public`; the following characters are allowed: `[a-zA-Z0-9_-]`

```
@storage-public
public-data
sharedinfo
```


## Accessing your bucket names

- Because CloudFormation provisions these buckets, your bucket name will be reformatted and provided a GUID by AWS
- Thus, to deterministically access your bucket name, your Lambdas will be assigned a `ARC_STORAGE_PUBLIC_<bucketname>` env var (with any dashes converted to underscores)
  - Example: your app is named `myapp`, and your bucket is named `public-data` in your `.arc` file
  - Your Lambda(s) would read the `ARC_STORAGE_PUBLIC_PUBLIC_DATA` env var (which would be assigned a value similar to `myappstaging-publicdatabucket-1f8394rh4qtvb`)
