import {
    Stack,
    StackProps,
    aws_s3 as s3,
} from "aws-cdk-lib"
import { Construct } from "constructs"

export class S3Stack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props)

        // S3 バケットの作成
        const bucket = new s3.Bucket(this, "SenBeroBucket", {
            bucketName: "senbero-image",
        })
    }
}