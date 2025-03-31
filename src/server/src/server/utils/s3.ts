import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "~/env";

class S3ClientSingleton {
  private static instance: S3Client | null = null;

  private static credentials =
    env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: env.AWS_ACCESS_KEY_ID,
          secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined;

  public static getInstance(): S3Client {
    S3ClientSingleton.instance ??= new S3Client({
      region: env.AWS_REGION,
      credentials: this.credentials,
    });

    return S3ClientSingleton.instance;
  }
}

const s3Client = S3ClientSingleton.getInstance();

export const generateSignedUrl = async (key: string, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: env.AWS_BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};
